import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { renderToBuffer } from "@react-pdf/renderer";
import { getStudentSession } from "@/lib/getStudentSession";
import { getSession } from "@/lib/session";
import { join } from "path";
import { existsSync, readFileSync } from "fs";

interface CustomTemplate {
  title: string;
  subtitle: string;
  showLogo: boolean;
  logoUrl: string | null;
  signatureText: string;
  footerText: string | null;
  fontFamily: string;
  backgroundImage: string | null;
  validityDays: number | null;
}

interface ExamResult {
  id: string;
  studentId: string;
  listeningCorrect: number;
  structureCorrect: number;
  readingCorrect: number;
  totalScore: number;
  productId: string;
  createdAt: Date;
  student: {
    id: string;
    buyerName: string;
    buyerEmail: string | null;
  };
  product: {
    userId: string;
  };
}

// Helper function to fetch image and convert to base64
async function fetchImageAsBase64(url: string): Promise<string | null> {
  if (!url) return null;

  console.log(`[fetchImageAsBase64] Processing URL: ${url}`);

  // Check if it's a local file path (starts with / or doesn't have protocol)
  const isLocalFile = url.startsWith("/") || !url.startsWith("http");

  if (isLocalFile) {
    // It's a local file, try to read from filesystem
    let filePath = url;

    // Remove leading slash if present
    if (filePath.startsWith("/")) {
      filePath = filePath.substring(1);
    }

    const fullPath = join(process.cwd(), "public", filePath);
    console.log(`[fetchImageAsBase64] Local file full path: ${fullPath}`);

    try {
      if (existsSync(fullPath)) {
        console.log(`[fetchImageAsBase64] File exists, reading...`);
        const buffer = readFileSync(fullPath);
        const ext = filePath.split(".").pop()?.toLowerCase() || "jpeg";
        const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
        return `data:${mimeType};base64,${buffer.toString("base64")}`;
      } else {
        console.log(`[fetchImageAsBase64] File does NOT exist at: ${fullPath}`);
      }
    } catch (err: any) {
      console.log(`[fetchImageAsBase64] Error reading file: ${err.message}`);
      return null;
    }
  }

  // It's a remote URL, try to fetch it
  console.log(`[fetchImageAsBase64] Fetching remote URL...`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`[fetchImageAsBase64] HTTP error: ${response.status}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = response.headers.get("content-type") || "image/jpeg";
    const base64 = buffer.toString("base64");
    return `data:${mimeType};base64,${base64}`;
  } catch (err: any) {
    console.log(`[fetchImageAsBase64] Fetch error: ${err.message}`);
    return null;
  }
}

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

    // Get custom template if exists (PRO+ users) - students see seller's custom template
    let customTemplate: CustomTemplate | null = null;
    let backgroundImageDataUrl: string | null = null;
    let logoDataUrl: string | null = null;

    // Fetch default background image (local file)
    const defaultBgPath = join(process.cwd(), "public", "certificates", "sertifikat.jpg");

    try {
      if (existsSync(defaultBgPath)) {
        const bgBuffer = readFileSync(defaultBgPath);
        const base64 = bgBuffer.toString("base64");
        backgroundImageDataUrl = `data:image/jpeg;base64,${base64}`;
      }
    } catch (err: any) {
      console.error("Failed to load default background:", err.message);
    }

    // Always try to fetch seller's custom template (for all users including students)
    const template = await prisma.certificateTemplate.findUnique({
      where: { userId: result.product.userId },
    }) as CustomTemplate | null;
    if (template) {
      customTemplate = {
        title: template.title,
        subtitle: template.subtitle,
        showLogo: template.showLogo,
        logoUrl: template.logoUrl,
        signatureText: template.signatureText,
        footerText: template.footerText,
        fontFamily: template.fontFamily,
        backgroundImage: template.backgroundImage,
        validityDays: (template as any).validityDays ?? null,
      };

      // Fetch custom background image if exists
      if (template.backgroundImage) {
        const customBg = await fetchImageAsBase64(template.backgroundImage);
        if (customBg) {
          backgroundImageDataUrl = customBg;
        }
      }

      // Fetch logo if exists and showLogo is true
      if (template.showLogo && template.logoUrl) {
        const logo = await fetchImageAsBase64(template.logoUrl);
        if (logo) {
          logoDataUrl = logo;
        }
      }
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

    // Import CertificatePDF dynamically to avoid SSR issues
    const { CertificatePDF } = await import("@/components/CertificatePDF");

    // Generate PDF with custom template
    const pdfBuffer = await renderToBuffer(
      CertificatePDF({
        result: result as ExamResult,
        qrCodeDataUrl,
        backgroundImage: backgroundImageDataUrl,
        customTemplate,
        logoUrl: logoDataUrl,
      })
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="TOEFL-Certificate-${result.student.buyerName.replace(/\s+/g, "-")}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Certificate generation error:", error);
    console.error("Error stack:", error?.stack);
    return NextResponse.json({
      error: "Failed to generate certificate",
      details: error?.message || "Unknown error"
    }, { status: 500 });
  }
}