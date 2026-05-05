import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { cache, CacheKeys } from "@/lib/cache";

export async function GET() {
  try {
    await requireAdmin();
    
    const cached = cache.get(CacheKeys.ANALYTICS);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Calculate 6 months range
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    
    // Get all necessary data in optimized queries
    const [
      totalExams,
      avgScoreResult,
      scoreDistribution,
      sectionAverages,
      recentResults,
      topPerformers,
    ] = await Promise.all([
      // Total exams count
      prisma.examResult.count(),
      
      // Average score calculation (using aggregation)
      prisma.examResult.aggregate({
        _avg: { totalScore: true }
      }),
      
      // Score distribution
      Promise.all([
        prisma.examResult.count({ where: { totalScore: { gte: 550 } } }),
        prisma.examResult.count({ where: { totalScore: { gte: 500, lt: 550 } } }),
        prisma.examResult.count({ where: { totalScore: { gte: 450, lt: 500 } } }),
        prisma.examResult.count({ where: { totalScore: { lt: 450 } } }),
      ]),
      
      // Section averages
      prisma.examResult.aggregate({
        _avg: {
          listeningCorrect: true,
          structureCorrect: true,
          readingCorrect: true
        }
      }),
      
      // Recent results
      prisma.examResult.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          student: { select: { buyerName: true } }
        }
      }),
      
      // Top performers
      prisma.examResult.findMany({
        take: 10,
        orderBy: { totalScore: "desc" },
        include: {
          student: { select: { buyerName: true } }
        }
      }),
    ]);

    // Monthly trend (last 6 months)
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const monthResults = await prisma.examResult.findMany({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      });

      const monthAvgScore = monthResults.length > 0
        ? Math.round(monthResults.reduce((sum, r) => sum + r.totalScore, 0) / monthResults.length)
        : 0;

      monthlyStats.push({
        month: monthDate.toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
        count: monthResults.length,
        avgScore: monthAvgScore,
      });
    }

    const avgScore = avgScoreResult._avg.totalScore 
      ? Math.round(avgScoreResult._avg.totalScore) 
      : 0;

    const excellentCount = scoreDistribution[0];
    const goodCount = scoreDistribution[1];
    const averageCount = scoreDistribution[2];
    const needsWorkCount = scoreDistribution[3];

    const avgListening = sectionAverages._avg.listeningCorrect 
      ? sectionAverages._avg.listeningCorrect.toFixed(1) 
      : "0";
    const avgStructure = sectionAverages._avg.structureCorrect 
      ? sectionAverages._avg.structureCorrect.toFixed(1) 
      : "0";
    const avgReading = sectionAverages._avg.readingCorrect 
      ? sectionAverages._avg.readingCorrect.toFixed(1) 
      : "0";

    const sectionAvgs = {
      LISTENING: parseFloat(avgListening),
      STRUCTURE: parseFloat(avgStructure),
      READING: parseFloat(avgReading),
    };
    const hardestSection = Object.entries(sectionAvgs).sort((a, b) => a[1] - b[1])[0][0];

    const response = {
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
      recentResults: recentResults.map(r => ({
        id: r.id,
        studentName: r.student.buyerName,
        score: r.totalScore,
        listening: r.listeningCorrect,
        structure: r.structureCorrect,
        reading: r.readingCorrect,
        date: r.createdAt,
      })),
      topPerformers: topPerformers.map((r, idx) => ({
        rank: idx + 1,
        studentName: r.student.buyerName,
        score: r.totalScore,
        date: r.createdAt,
      })),
    };
    
    cache.set(CacheKeys.ANALYTICS, response, 5 * 60 * 1000);
    
    return NextResponse.json(response);
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Admin access required") {
      return NextResponse.json({ success: false, message: error.message }, { status: error.message === "Unauthorized" ? 401 : 403 });
    }
    console.error("Analytics error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
