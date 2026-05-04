import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/services/authService";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
    }

    // Get all results for analytics
    const results = await prisma.examResult.findMany({
      include: {
        student: true,
        product: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate statistics
    const totalExams = results.length;
    const avgScore = totalExams > 0
      ? Math.round(results.reduce((sum, r) => sum + r.totalScore, 0) / totalExams)
      : 0;

    // Score distribution
    const excellentCount = results.filter(r => r.totalScore >= 550).length;
    const goodCount = results.filter(r => r.totalScore >= 500 && r.totalScore < 550).length;
    const averageCount = results.filter(r => r.totalScore >= 450 && r.totalScore < 500).length;
    const needsWorkCount = results.filter(r => r.totalScore < 450).length;

    // Section averages
    const avgListening = totalExams > 0
      ? (results.reduce((sum, r) => sum + r.listeningCorrect, 0) / totalExams).toFixed(1)
      : "0";
    const avgStructure = totalExams > 0
      ? (results.reduce((sum, r) => sum + r.structureCorrect, 0) / totalExams).toFixed(1)
      : "0";
    const avgReading = totalExams > 0
      ? (results.reduce((sum, r) => sum + r.readingCorrect, 0) / totalExams).toFixed(1)
      : "0";

    // Hardest sections (lowest average)
    const sectionAvgs = {
      LISTENING: parseFloat(avgListening as string),
      STRUCTURE: parseFloat(avgStructure as string),
      READING: parseFloat(avgReading as string),
    };
    const hardestSection = Object.entries(sectionAvgs).sort((a, b) => a[1] - b[1])[0][0];

    // Monthly trend (last 6 months)
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const monthResults = results.filter(r => {
        const date = new Date(r.createdAt);
        return date >= monthStart && date <= monthEnd;
      });

      monthlyStats.push({
        month: monthDate.toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
        count: monthResults.length,
        avgScore: monthResults.length > 0
          ? Math.round(monthResults.reduce((sum, r) => sum + r.totalScore, 0) / monthResults.length)
          : 0,
      });
    }

    // Recent results
    const recentResults = results.slice(0, 20).map(r => ({
      id: r.id,
      studentName: r.student.buyerName,
      score: r.totalScore,
      listening: r.listeningCorrect,
      structure: r.structureCorrect,
      reading: r.readingCorrect,
      date: r.createdAt,
    }));

    // Top performers (leaderboard)
    const topPerformers = [...results]
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10)
      .map((r, idx) => ({
        rank: idx + 1,
        studentName: r.student.buyerName,
        score: r.totalScore,
        date: r.createdAt,
      }));

    return NextResponse.json({
      success: true,
      stats: {
        totalExams,
        avgScore,
        passRate: totalExams > 0 ? Math.round((excellentCount + goodCount) / totalExams * 100) : 0,
        sectionAverages: {
          listening: avgListening,
          structure: avgStructure,
          reading: avgReading,
        },
        hardestSection,
        scoreDistribution: {
          excellent: excellentCount,
          good: goodCount,
          average: averageCount,
          needsWork: needsWorkCount,
        },
      },
      monthlyTrend: monthlyStats,
      recentResults,
      topPerformers,
    });
  } catch (error: any) {
    console.error("Analytics error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}