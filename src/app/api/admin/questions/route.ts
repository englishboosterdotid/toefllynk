import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Section } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "50")));
    const skip = (page - 1) * limit;
    const section = searchParams.get("section") as Section | null;

    const where = section ? { section } : {};

    const [questions, total] = await Promise.all([
      prisma.questionBank.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { section: "asc" },
          { questionNumber: "asc" },
        ],
        include: {
          options: {
            orderBy: { optionKey: "asc" },
          },
        },
      }),
      prisma.questionBank.count({ where }),
    ]);

    return NextResponse.json({ 
      success: true, 
      questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Admin access required") {
      return NextResponse.json({ success: false, message: error.message }, { status: error.message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const formData = await req.formData();

    const question = await prisma.questionBank.create({
      data: {
        section: formData.get("section") as Section,
        questionNumber: Number(formData.get("questionNumber")),
        questionText: formData.get("questionText") as string,
        passageText: (formData.get("passageText") as string) || null,
        audioUrl: (formData.get("audioUrl") as string) || null,
        correctAnswer: formData.get("correctAnswer") as string,
        explanation: (formData.get("explanation") as string) || null,
      },
    });

    await prisma.questionOption.createMany({
      data: [
        {
          questionId: question.id,
          optionKey: "A",
          optionText: formData.get("optionA") as string,
        },
        {
          questionId: question.id,
          optionKey: "B",
          optionText: formData.get("optionB") as string,
        },
        {
          questionId: question.id,
          optionKey: "C",
          optionText: formData.get("optionC") as string,
        },
        {
          questionId: question.id,
          optionKey: "D",
          optionText: formData.get("optionD") as string,
        },
      ],
    });

    return NextResponse.json({ success: true, message: "Pertanyaan berhasil disimpan" });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Admin access required") {
      return NextResponse.json({ success: false, message: error.message }, { status: error.message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}