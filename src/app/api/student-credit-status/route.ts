import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/getStudentSession";

export async function GET() {
  const student = await getStudentSession();

  if (!student) {
    return NextResponse.json({
      success: false,
      availableCredits: 0,
    });
  }

  const credits = await prisma.studentExamCredit.findMany({
    where: {
      studentId: student.id,
    },
  });

  const availableCredits = credits.reduce((sum, item) => {
    return sum + (item.totalCredit - item.usedCredit);
  }, 0);

  return NextResponse.json({
    success: true,
    availableCredits,
  });
}