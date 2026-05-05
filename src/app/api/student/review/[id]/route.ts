import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/getStudentSession";
import { getSession } from "@/lib/session";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const student = await getStudentSession();
    const user = await getSession();

    if (!student && !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: resultId } = await params;

    // Verify ownership
    const result = await prisma.examResult.findUnique({
      where: { id: resultId },
      include: {
        student: true,
        product: { select: { userId: true, reviewIncluded: true } },
      },
    });

    if (!result) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    // Check if user has permission to view this result
    const isStudentOwner = student && result.studentId === student.id;
    const isProductOwner = user && result.product.userId === user.userId;
    const isAdmin = user?.role === "ADMIN";

    if (!isStudentOwner && !isProductOwner && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if review is included in the product
    if (!result.product.reviewIncluded && !isAdmin) {
      return NextResponse.json({ error: "Review not available for this product" }, { status: 403 });
    }

    // Get student's exam session to get their answers
    const session = await prisma.examSession.findFirst({
      where: {
        studentId: result.studentId,
      },
      orderBy: { createdAt: "desc" },
      include: {
        answers: true,
      },
    });

    // Get all questions with options
    const questions = await prisma.questionBank.findMany({
      include: { options: true },
      orderBy: [
        { section: "asc" },
        { questionNumber: "asc" },
      ],
    });

    // Format response with correct answers (only for authorized users)
    const reviewData = questions.map((q) => {
      const studentAnswer = session?.answers.find((a) => a.questionId === q.id);
      return {
        id: q.id,
        section: q.section,
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        passageText: q.passageText,
        audioUrl: q.audioUrl,
        explanation: q.explanation,
        options: q.options.map((opt) => ({
          id: opt.id,
          optionKey: opt.optionKey,
          optionText: opt.optionText,
        })),
        // Only include correctAnswer and user's answer for authorized viewers
        correctAnswer: q.correctAnswer,
        userAnswer: studentAnswer?.selectedKey || null,
      };
    });

    return NextResponse.json({
      success: true,
      resultId,
      reviewIncluded: result.product.reviewIncluded,
      totalQuestions: questions.length,
      answeredCount: session?.answers.length || 0,
      questions: reviewData,
    });
  } catch (error) {
    console.error("Review API error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}