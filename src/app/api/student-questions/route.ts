import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const questions = await prisma.questionBank.findMany({
    include: {
      options: true,
    },
    orderBy: {
      questionNumber: "asc",
    },
  });

  return NextResponse.json({ questions });
}