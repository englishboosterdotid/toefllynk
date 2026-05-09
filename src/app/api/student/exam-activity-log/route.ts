import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Student token is a plain access token, not JWT - verify in DB
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

    const { activityType, details, sessionId } = await req.json();

    if (!activityType) {
      return NextResponse.json({ success: false, message: "Activity type required" }, { status: 400 });
    }

    // Find active session
    let session;
    if (sessionId) {
      session = await prisma.examSession.findFirst({
        where: {
          id: sessionId,
          studentId: decoded.userId,
          status: "IN_PROGRESS",
        },
      });
    } else {
      session = await prisma.examSession.findFirst({
        where: {
          studentId: decoded.userId,
          status: "IN_PROGRESS",
        },
      });
    }

    if (!session) {
      // No active session yet - this is normal when exam just started
      // Return success but don't log (session will be created when exam starts)
      return NextResponse.json({
        success: true,
        message: "No active session yet",
        log: null,
      });
    }

    // Log the activity
    const log = await prisma.examActivityLog.create({
      data: {
        sessionId: session.id,
        activityType: activityType,
        details: details || null,
      },
    });

    return NextResponse.json({
      success: true,
      log: {
        id: log.id,
        activityType: log.activityType,
        createdAt: log.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Log activity error:", error);
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

    // Get all sessions for this student with their logs
    const sessions = await prisma.examSession.findMany({
      where: {
        studentId: decoded.userId,
      },
      include: {
        activityLogs: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      sessions: sessions.map((s) => ({
        id: s.id,
        status: s.status,
        currentSection: s.currentSection,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        activityCount: s.activityLogs.length,
        warningCount: s.activityLogs.filter((l) => l.activityType === "TAB_SWITCH" || l.activityType === "FULLSCREEN_EXIT").length,
        logs: s.activityLogs.map((l) => ({
          id: l.id,
          type: l.activityType,
          details: l.details,
          createdAt: l.createdAt,
        })),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}