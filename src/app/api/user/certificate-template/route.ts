import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { TierService } from "@/lib/services/TierService";
import { deleteStorageFile } from "@/lib/fileCleanup";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const template = await prisma.certificateTemplate.findUnique({
      where: { userId: session.userId },
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Get certificate template error:", error);
    return NextResponse.json({ error: "Failed to get template" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check tier access (PRO+ only)
    const tierInfo = await TierService.getUserTierInfo(session.userId);
    if (!tierInfo.tierConfig.hasCustomCertificate) {
      return NextResponse.json(
        { error: "Custom certificate requires PRO or BUSINESS tier" },
        { status: 403 }
      );
    }

    // Get current template to check for file deletion
    const currentTemplate = await prisma.certificateTemplate.findUnique({
      where: { userId: session.userId },
    });

    const body = await req.json();
    const {
      name,
      title,
      subtitle,
      showLogo,
      logoUrl,
      signatureText,
      footerText,
      validityDays,
      fontFamily,
      backgroundImage,
    } = body;

    const template = await prisma.certificateTemplate.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        name: name || "Custom",
        title: title || "TOEFL ITP Simulation",
        subtitle: subtitle || "Certificate of Completion",
        showLogo: showLogo !== false,
        logoUrl: logoUrl || null,
        signatureText: signatureText || "Authorized Signature",
        footerText: footerText || null,
        validityDays: validityDays !== undefined ? validityDays : 365,
        fontFamily: fontFamily || "Inter",
        backgroundImage: backgroundImage || null,
      },
      update: {
        name: name !== undefined ? name : undefined,
        title: title !== undefined ? title : undefined,
        subtitle: subtitle !== undefined ? subtitle : undefined,
        showLogo: showLogo !== undefined ? showLogo : undefined,
        logoUrl: logoUrl !== undefined ? logoUrl : undefined,
        signatureText: signatureText !== undefined ? signatureText : undefined,
        footerText: footerText !== undefined ? footerText : undefined,
        validityDays: validityDays !== undefined ? validityDays : undefined,
        fontFamily: fontFamily !== undefined ? fontFamily : undefined,
        backgroundImage: backgroundImage !== undefined ? backgroundImage : undefined,
      },
    });

    // Clean up old files if they were replaced/deleted
    if (currentTemplate) {
      // Delete old logo if changed/removed
      if (currentTemplate.logoUrl && currentTemplate.logoUrl !== logoUrl) {
        await deleteStorageFile(currentTemplate.logoUrl);
      }

      // Delete old background if changed/removed
      if (currentTemplate.backgroundImage && currentTemplate.backgroundImage !== backgroundImage) {
        await deleteStorageFile(currentTemplate.backgroundImage);
      }
    }

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error("Update certificate template error:", error);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}