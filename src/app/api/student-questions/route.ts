import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/getStudentSession";

export async function GET(req: Request) {
  // Require student authentication
  const student = await getStudentSession();
  if (!student) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if student has valid credits
  const credits = await prisma.studentExamCredit.findMany({
    where: { studentId: student.id },
  });

  const hasAvailableCredits = credits.some((c) => c.usedCredit < c.totalCredit);
  if (!hasAvailableCredits) {
    return NextResponse.json({ error: "No exam credits available" }, { status: 403 });
  }

  const questions = await prisma.questionBank.findMany({
    include: {
      options: true,
    },
    orderBy: {
      questionNumber: "asc",
    },
  });

  // CRITICAL: Remove correctAnswer from all questions before sending to client
  const sanitizedQuestions = questions.map((q) => ({
    ...q,
    correctAnswer: undefined,
  }));

  return NextResponse.json({ questions: sanitizedQuestions });
}