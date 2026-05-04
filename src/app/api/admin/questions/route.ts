import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Section } from "@/generated/prisma/enums";

export async function GET() {
  try {
    const questions = await prisma.questionBank.findMany({
      orderBy: [
        { section: "asc" },
        { questionNumber: "asc" },
      ],
      include: {
        options: {
          orderBy: { optionKey: "asc" },
        },
      },
    });

    return NextResponse.json({ success: true, questions });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
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
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}