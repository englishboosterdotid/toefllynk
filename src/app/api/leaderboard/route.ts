import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const results = await prisma.examResult.findMany({
      include: {
        student: {
          select: { buyerName: true },
        },
      },
      orderBy: { totalScore: "desc" },
      take: 50,
    });

    return NextResponse.json({
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
    });
  } catch (error: any) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}