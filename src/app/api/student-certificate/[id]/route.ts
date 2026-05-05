import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { renderToBuffer } from "@react-pdf/renderer";
import { CertificatePDF } from "@/components/CertificatePDF";
import { getStudentSession } from "@/lib/getStudentSession";
import { getSession } from "@/lib/session";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Auth check: either student owner or admin/user
    const student = await getStudentSession();
    const session = await getSession();

    if (!student && !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await prisma.examResult.findUnique({
      where: { id },
      include: {
        student: true,
        product: { select: { userId: true } },
      },
    });

    if (!result) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    // Verify ownership: student owner, product owner, or admin
    const isStudentOwner = student && result.studentId === student.id;
    const isProductOwner = session && result.product.userId === session.userId;
    const isAdmin = session?.role === "ADMIN";

    if (!isStudentOwner && !isProductOwner && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Generate QR code with verification URL
    const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/verify/${result.id}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: "#1e3a5f",
        light: "#ffffff",
      },
    });

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      CertificatePDF({ result, qrCodeDataUrl })
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="TOEFL-Certificate-${result.student.buyerName.replace(/\s+/g, "-")}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Certificate generation error:", error);
    return NextResponse.json({ error: "Failed to generate certificate" }, { status: 500 });
  }
}