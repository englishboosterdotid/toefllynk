import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSession } from "@/lib/session";
import { join } from "path";
import { existsSync, readFileSync } from "fs";

// Helper function to fetch image and convert to base64
async function fetchImageAsBase64(url: string): Promise<string | null> {
  if (!url) return null;

  const isLocalFile = url.startsWith("/") || !url.startsWith("http");

  if (isLocalFile) {
    let filePath = url;
    if (filePath.startsWith("/")) {
      filePath = filePath.substring(1);
    }
    const fullPath = join(process.cwd(), "public", filePath);

    try {
      if (existsSync(fullPath)) {
        const buffer = readFileSync(fullPath);
        const ext = filePath.split(".").pop()?.toLowerCase() || "jpeg";
        const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
        return `data:${mimeType};base64,${buffer.toString("base64")}`;
      }
    } catch {
      return null;
    }
  }

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = response.headers.get("content-type") || "image/jpeg";
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { template } = body;

    let backgroundImageDataUrl: string | null = null;
    let logoDataUrl: string | null = null;

    // Fetch default background
    const defaultBgPath = join(process.cwd(), "public", "certificates", "sertifikat.jpg");
    try {
      if (existsSync(defaultBgPath)) {
        const bgBuffer = readFileSync(defaultBgPath);
        backgroundImageDataUrl = `data:image/jpeg;base64,${bgBuffer.toString("base64")}`;
      }
    } catch {}

    // Use template settings if provided
    if (template) {
      if (template.backgroundImage) {
        const bg = await fetchImageAsBase64(template.backgroundImage);
        if (bg) backgroundImageDataUrl = bg;
      }

      if (template.showLogo && template.logoUrl) {
        const logo = await fetchImageAsBase64(template.logoUrl);
        if (logo) logoDataUrl = logo;
      }
    }

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL("https://toefllynk.com/verify/preview", {
      width: 200,
      margin: 2,
      color: {
        dark: "#1e3a5f",
        light: "#ffffff",
      },
    });

    // Import CertificatePDF
    const { CertificatePDF } = await import("@/components/CertificatePDF");

    // Sample exam result for preview
    const sampleResult = {
      id: "preview-" + Date.now(),
      studentId: "preview-student",
      listeningCorrect: 42,
      structureCorrect: 38,
      readingCorrect: 45,
      totalScore: 563,
      productId: "preview-product",
      createdAt: new Date(),
      student: {
        id: "preview-student",
        buyerName: "John Doe",
        buyerEmail: "john@example.com",
      },
    };

    const customTemplate = template ? {
      title: template.title || "TOEFL ITP Simulation",
      subtitle: template.subtitle || "Certificate of Completion",
      showLogo: template.showLogo ?? true,
      logoUrl: template.logoUrl || null,
      signatureText: "Authorized Signature",
      footerText: template.footerText || null,
      fontFamily: "Inter",
      backgroundImage: template.backgroundImage || null,
      validityDays: template.validityDays ?? 365,
    } : null;

    const pdfBuffer = await renderToBuffer(
      CertificatePDF({
        result: sampleResult,
        qrCodeDataUrl,
        backgroundImage: backgroundImageDataUrl,
        customTemplate,
        logoUrl: logoDataUrl,
      })
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=\"Certificate-Preview.pdf\"",
      },
    });
  } catch (error: any) {
    console.error("Certificate preview error:", error);
    return NextResponse.json({
      error: "Failed to generate preview",
      details: error?.message,
    }, { status: 500 });
  }
}
