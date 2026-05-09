import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/services/authService";

export async function GET() {
  try {
    const cookieStore = await cookies();
    // Check both auth_token and token (same JWT, different cookie names)
    const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
    }

    // Get active exam sessions with student info and logs
    const activeSessions = await prisma.examSession.findMany({
      where: {
        status: "IN_PROGRESS",
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        answers: true,
        activityLogs: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
      orderBy: { lastActivity: "desc" },
    });

    // Get recent completed sessions (last 24 hours) with flag
    const recentCompleted = await prisma.examSession.findMany({
      where: {
        status: { in: ["COMPLETED", "ABANDONED"] },
        completedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        activityLogs: {
          where: {
            activityType: { in: ["TAB_SWITCH", "FULLSCREEN_EXIT", "AUTO_SUBMIT"] },
          },
        },
      },
      orderBy: { completedAt: "desc" },
      take: 20,
    });

    // Calculate stats
    const totalActive = activeSessions.length;
    const flaggedSessions = activeSessions.filter((s) =>
      s.activityLogs.some((l) => l.activityType === "TAB_SWITCH" || l.activityType === "FULLSCREEN_EXIT")
    ).length;
    const autoSubmitted = recentCompleted.filter((s) =>
      s.activityLogs.some((l) => l.activityType === "AUTO_SUBMIT")
    ).length;

    return NextResponse.json({
      success: true,
      stats: {
        totalActive,
        flaggedSessions,
        autoSubmitted24h: autoSubmitted,
      },
      activeSessions: activeSessions.map((s) => ({
        id: s.id,
        studentName: s.student.buyerName,
        studentEmail: s.student.buyerEmail,
        currentSection: s.currentSection,
        sectionTimeLeft: s.sectionTimeLeft,
        answeredCount: s.answers.length,
        warningCount: s.activityLogs.filter(
          (l) => l.activityType === "TAB_SWITCH" || l.activityType === "FULLSCREEN_EXIT"
        ).length,
        hasAutoSubmit: s.activityLogs.some((l) => l.activityType === "AUTO_SUBMIT"),
        lastActivity: s.lastActivity,
        recentLogs: s.activityLogs.map((l) => ({
          type: l.activityType,
          createdAt: l.createdAt,
        })),
      })),
      recentCompleted: recentCompleted.map((s) => ({
        id: s.id,
        studentName: s.student.buyerName,
        studentEmail: s.student.buyerEmail,
        status: s.status,
        warningCount: s.activityLogs.length,
        wasAutoSubmitted: s.activityLogs.some((l) => l.activityType === "AUTO_SUBMIT"),
        completedAt: s.completedAt,
      })),
    });
  } catch (error: any) {
    console.error("Admin exam monitoring error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}