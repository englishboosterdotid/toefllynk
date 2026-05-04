import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";

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

    if (format === "csv") {
      const headers = [
        "section",
        "questionNumber",
        "questionText",
        "passageText",
        "audioUrl",
        "correctAnswer",
        "optionA",
        "optionB",
        "optionC",
        "optionD",
        "explanation",
      ];

      const rows = questions.map((q) => [
        q.section,
        q.questionNumber,
        q.questionText.replace(/"/g, '""'),
        q.passageText?.replace(/"/g, '""') || "",
        q.audioUrl || "",
        q.correctAnswer,
        q.options.find((o) => o.optionKey === "A")?.optionText.replace(/"/g, '""') || "",
        q.options.find((o) => o.optionKey === "B")?.optionText.replace(/"/g, '""') || "",
        q.options.find((o) => o.optionKey === "C")?.optionText.replace(/"/g, '""') || "",
        q.options.find((o) => o.optionKey === "D")?.optionText.replace(/"/g, '""') || "",
        q.explanation?.replace(/"/g, '""') || "",
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=toefl-questions.csv",
        },
      });
    }

    return NextResponse.json({ success: true, questions });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { questions, mode = "create" } = body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid questions data" },
        { status: 400 }
      );
    }

    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    };

    for (const q of questions) {
      try {
        if (!q.section || !q.questionNumber || !q.questionText || !q.correctAnswer) {
          results.errors.push(`Missing required fields: ${JSON.stringify(q)}`);
          continue;
        }

        const questionData = {
          section: q.section,
          questionNumber: parseInt(q.questionNumber),
          questionText: q.questionText,
          passageText: q.passageText || null,
          audioUrl: q.audioUrl || null,
          correctAnswer: q.correctAnswer.toUpperCase(),
          explanation: q.explanation || null,
        };

        if (mode === "replace") {
          // Delete existing questions with same section and number
          const existing = await prisma.questionBank.findFirst({
            where: {
              section: questionData.section,
              questionNumber: questionData.questionNumber,
            },
          });

          if (existing) {
            await prisma.questionOption.deleteMany({
              where: { questionId: existing.id },
            });
            await prisma.questionBank.delete({
              where: { id: existing.id },
            });
          }
        }

        // Create question
        const question = await prisma.questionBank.create({
          data: questionData,
        });

        // Create options
        const options = [];
        if (q.optionA) options.push({ questionId: question.id, optionKey: "A", optionText: q.optionA });
        if (q.optionB) options.push({ questionId: question.id, optionKey: "B", optionText: q.optionB });
        if (q.optionC) options.push({ questionId: question.id, optionKey: "C", optionText: q.optionC });
        if (q.optionD) options.push({ questionId: question.id, optionKey: "D", optionText: q.optionD });

        if (options.length > 0) {
          await prisma.questionOption.createMany({ data: options });
        }

        results.created++;
      } catch (err: any) {
        results.errors.push(`Error processing question: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${results.created} questions`,
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
