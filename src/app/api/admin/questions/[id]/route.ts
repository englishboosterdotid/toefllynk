import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const question = await prisma.questionBank.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: { optionKey: "asc" },
        },
      },
    });

    if (!question) {
      return NextResponse.json(
        { success: false, message: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, question });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await req.formData();

    const question = await prisma.questionBank.update({
      where: { id },
      data: {
        section: formData.get("section") as any,
        questionNumber: Number(formData.get("questionNumber")),
        questionText: formData.get("questionText") as string,
        passageText: (formData.get("passageText") as string) || null,
        audioUrl: (formData.get("audioUrl") as string) || null,
        correctAnswer: formData.get("correctAnswer") as string,
        explanation: (formData.get("explanation") as string) || null,
      },
    });

    // Update options
    const optionA = formData.get("optionA") as string;
    const optionB = formData.get("optionB") as string;
    const optionC = formData.get("optionC") as string;
    const optionD = formData.get("optionD") as string;

    // Delete existing options
    await prisma.questionOption.deleteMany({
      where: { questionId: id },
    });

    // Create new options
    await prisma.questionOption.createMany({
      data: [
        { questionId: id, optionKey: "A", optionText: optionA },
        { questionId: id, optionKey: "B", optionText: optionB },
        { questionId: id, optionKey: "C", optionText: optionC },
        { questionId: id, optionKey: "D", optionText: optionD },
      ],
    });

    return NextResponse.json({ success: true, message: "Pertanyaan berhasil diupdate" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete related options first
    await prisma.questionOption.deleteMany({
      where: { questionId: id },
    });

    // Delete the question
    await prisma.questionBank.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Pertanyaan berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }
}