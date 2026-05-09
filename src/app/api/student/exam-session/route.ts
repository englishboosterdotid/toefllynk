import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Section time limits in seconds
export const SECTION_TIME_LIMITS: Record<string, number> = {
  LISTENING: 35 * 60,    // 35 minutes
  STRUCTURE: 25 * 60,    // 25 minutes
  READING: 55 * 60,       // 55 minutes
};

// Student token is a plain access token, not JWT - just verify it exists in DB
async function verifyStudentToken(token: string): Promise<{ userId: string } | null> {
  if (!token) return null;

  const student = await prisma.studentAccount.findFirst({
    where: { accessToken: token },
    select: { id: true },
  });

  return student ? { userId: student.id } : null;
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("student_token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyStudentToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    // Check if student has credits
    const credit = await prisma.studentExamCredit.findFirst({
      where: {
        studentId: decoded.userId,
        productId: req.headers.get("X-Product-Id") || undefined,
      },
    });

    if (!credit || credit.usedCredit >= credit.totalCredit) {
      return NextResponse.json({ success: false, message: "No credits available" }, { status: 400 });
    }

    // Check if there's already an in-progress session
    const existingSession = await prisma.examSession.findFirst({
      where: {
        studentId: decoded.userId,
        status: "IN_PROGRESS",
      },
      include: {
        answers: true,
      },
    });

    if (existingSession) {
      // Return existing session with progress
      const answersObj: Record<string, { selectedKey: string; isFlagged: boolean }> = {};
      existingSession.answers.forEach((answer) => {
        answersObj[answer.questionId] = {
          selectedKey: answer.selectedKey,
          isFlagged: answer.isFlagged,
        };
      });

      return NextResponse.json({
        success: true,
        session: {
          id: existingSession.id,
          currentSection: existingSession.currentSection,
          sectionTimeLeft: existingSession.sectionTimeLeft,
          totalElapsedTime: existingSession.totalElapsedTime,
          answers: answersObj,
          startedAt: existingSession.startedAt,
        },
        isResumed: true,
      });
    }

    // Create new session
    const session = await prisma.examSession.create({
      data: {
        studentId: decoded.userId,
        status: "IN_PROGRESS",
        currentSection: "LISTENING",
        sectionTimeLeft: SECTION_TIME_LIMITS.LISTENING,
        totalElapsedTime: 0,
        startedAt: new Date(),
        lastActivity: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        currentSection: session.currentSection,
        sectionTimeLeft: session.sectionTimeLeft,
        totalElapsedTime: 0,
        answers: {},
        startedAt: session.startedAt,
      },
      isResumed: false,
    });
  } catch (error: any) {
    console.error("Start exam error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("student_token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyStudentToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    const session = await prisma.examSession.findFirst({
      where: {
        studentId: decoded.userId,
        status: "IN_PROGRESS",
      },
      include: {
        answers: true,
      },
    });

    if (!session) {
      return NextResponse.json({ success: true, session: null });
    }

    const answersObj: Record<string, { selectedKey: string; isFlagged: boolean }> = {};
    session.answers.forEach((answer) => {
      answersObj[answer.questionId] = {
        selectedKey: answer.selectedKey,
        isFlagged: answer.isFlagged,
      };
    });

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        currentSection: session.currentSection,
        sectionTimeLeft: session.sectionTimeLeft,
        totalElapsedTime: session.totalElapsedTime,
        answers: answersObj,
        startedAt: session.startedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}