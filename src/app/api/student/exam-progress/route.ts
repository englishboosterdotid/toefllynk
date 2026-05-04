import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/services/authService";

// Section time limits in seconds
export const SECTION_TIME_LIMITS: Record<string, number> = {
  LISTENING: 35 * 60,    // 35 minutes
  STRUCTURE: 25 * 60,     // 25 minutes
  READING: 55 * 60,        // 55 minutes
};

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("student_token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    const { questionId, selectedKey, isFlagged, currentSection, sectionTimeLeft, totalElapsedTime } = await req.json();

    // Find or create active session
    let session = await prisma.examSession.findFirst({
      where: {
        studentId: decoded.userId,
        status: "IN_PROGRESS",
      },
    });

    if (!session) {
      return NextResponse.json({ success: false, message: "No active exam session" }, { status: 400 });
    }

    // Update or create answer
    await prisma.examAnswer.upsert({
      where: {
        sessionId_questionId: {
          sessionId: session.id,
          questionId: questionId,
        },
      },
      create: {
        sessionId: session.id,
        questionId: questionId,
        selectedKey: selectedKey,
        isFlagged: isFlagged || false,
      },
      update: {
        selectedKey: selectedKey,
        isFlagged: isFlagged !== undefined ? isFlagged : undefined,
        updatedAt: new Date(),
      },
    });

    // Update session progress
    await prisma.examSession.update({
      where: { id: session.id },
      data: {
        currentSection: currentSection || session.currentSection,
        sectionTimeLeft: sectionTimeLeft ?? session.sectionTimeLeft,
        totalElapsedTime: totalElapsedTime ?? session.totalElapsedTime,
        lastActivity: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Answer saved",
      savedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Auto-save error:", error);
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

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    // Get current session with answers
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
      return NextResponse.json({ success: true, data: null });
    }

    // Transform answers to object format
    const answersObj: Record<string, { selectedKey: string; isFlagged: boolean }> = {};
    session.answers.forEach((answer) => {
      answersObj[answer.questionId] = {
        selectedKey: answer.selectedKey,
        isFlagged: answer.isFlagged,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        currentSection: session.currentSection,
        sectionTimeLeft: session.sectionTimeLeft,
        totalElapsedTime: session.totalElapsedTime,
        answers: answersObj,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}