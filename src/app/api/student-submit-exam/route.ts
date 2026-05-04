import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/getStudentSession";
import { sendExamResult } from "@/lib/email";

export async function POST(req: Request) {
  const student = await getStudentSession();

  if (!student) {
    return NextResponse.json({ success: false });
  }

  // FIND USABLE CREDIT FIRST
  const credits = await prisma.studentExamCredit.findMany({
    where: {
      studentId: student.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const usable = credits.find((c) => c.usedCredit < c.totalCredit);

  if (!usable) {
    return NextResponse.json({
      success: false,
      message: "No exam credits remaining",
    });
  }

  const body = await req.json();
  const answers = body.answers as { questionId: string; selectedKey: string; timeSpent?: number }[];

  // Update session answers with timeSpent
  const activeSession = await prisma.examSession.findFirst({
    where: {
      studentId: student.id,
      status: "IN_PROGRESS",
    },
  });

  if (activeSession) {
    for (const ans of answers) {
      await prisma.examAnswer.upsert({
        where: {
          sessionId_questionId: {
            sessionId: activeSession.id,
            questionId: ans.questionId,
          },
        },
        create: {
          sessionId: activeSession.id,
          questionId: ans.questionId,
          selectedKey: ans.selectedKey,
          timeSpent: ans.timeSpent || 0,
        },
        update: {
          selectedKey: ans.selectedKey,
          timeSpent: ans.timeSpent || 0,
        },
      });
    }
  }

  // GET QUESTIONS FOR SCORING
  const questionIds = answers.map((a) => a.questionId);

  const questions = await prisma.questionBank.findMany({
    where: {
      id: {
        in: questionIds,
      },
    },
  });

  let listeningCorrect = 0;
  let structureCorrect = 0;
  let readingCorrect = 0;

  for (const ans of answers) {
    const q = questions.find((x) => x.id === ans.questionId);

    if (q && q.correctAnswer === ans.selectedKey) {
      if (q.section === "LISTENING") listeningCorrect++;
      if (q.section === "STRUCTURE") structureCorrect++;
      if (q.section === "READING") readingCorrect++;
    }
  }

  const totalRaw = listeningCorrect + structureCorrect + readingCorrect;
  const totalQuestions = questions.length || 1;
  const totalScore = Math.round(310 + (totalRaw / totalQuestions) * 367);

  // CREATE RESULT WITH PRODUCT SOURCE
  const result = await prisma.examResult.create({
    data: {
      studentId: student.id,
      productId: usable.productId,
      listeningCorrect,
      structureCorrect,
      readingCorrect,
      totalScore,
    },
  });

  // REDUCE ONE CREDIT
  await prisma.studentExamCredit.update({
    where: { id: usable.id },
    data: {
      usedCredit: {
        increment: 1,
      },
    },
  });

  // Update session status and save timeSpent for answers
  if (activeSession) {
    // Save timeSpent for all answers
    for (const ans of answers) {
      await prisma.examAnswer.update({
        where: {
          sessionId_questionId: {
            sessionId: activeSession.id,
            questionId: ans.questionId,
          },
        },
        data: {
          timeSpent: ans.timeSpent || 0,
        },
      }).catch(() => {}); // Ignore if not found
    }

    const warningCount = (await prisma.examActivityLog.count({
      where: {
        sessionId: activeSession.id,
        activityType: { in: ["TAB_SWITCH", "FULLSCREEN_EXIT"] },
      },
    }));

    await prisma.examSession.update({
      where: { id: activeSession.id },
      data: {
        status: warningCount >= 3 ? "ABANDONED" : "COMPLETED",
        completedAt: new Date(),
      },
    });
  }

  // Send exam result email (async, non-blocking)
  sendExamResult(student.buyerEmail, {
    studentName: student.buyerName,
    score: totalScore,
    listening: listeningCorrect,
    structure: structureCorrect,
    reading: readingCorrect,
    resultUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/student/result/${result.id}`,
  }).catch((err) => {
    console.error("Failed to send exam result email:", err);
  });

  return NextResponse.json({ success: true, resultId: result.id });
}