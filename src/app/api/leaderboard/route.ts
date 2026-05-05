import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cache, CacheKeys } from "@/lib/cache";

export async function GET() {
  try {
    const cached = cache.get(CacheKeys.LEADERBOARD);
    if (cached) {
      return NextResponse.json(cached);
    }
    
    const results = await prisma.examResult.findMany({
      include: {
        student: {
          select: { buyerName: true },
        },
      },
      orderBy: { totalScore: "desc" },
      take: 50,
    });

    const response = {
      success: true,
      leaderboard: results.map((r) => ({
        id: r.id,
        studentName: r.student.buyerName,
        totalScore: r.totalScore,
        listeningCorrect: r.listeningCorrect,
        structureCorrect: r.structureCorrect,
        readingCorrect: r.readingCorrect,
        createdAt: r.createdAt.toISOString(),
      })),
    };
    
    cache.set(CacheKeys.LEADERBOARD, response, 60 * 1000);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}