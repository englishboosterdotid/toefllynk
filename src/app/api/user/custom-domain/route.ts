import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { TierService } from "@/lib/services/TierService";
import crypto from "crypto";

function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        customDomain: true,
        domainVerified: true,
        domainVerifiedAt: true,
        sellerTier: true,
      },
    });

    return NextResponse.json({
      customDomain: user?.customDomain,
      domainVerified: user?.domainVerified,
      domainVerifiedAt: user?.domainVerifiedAt,
      canSetCustomDomain: user?.sellerTier === "BUSINESS",
    });
  } catch (error) {
    console.error("Get custom domain error:", error);
    return NextResponse.json({ error: "Failed to get custom domain" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check tier access (BUSINESS only)
    const tierInfo = await TierService.getUserTierInfo(session.userId);
    if (tierInfo.tier !== "BUSINESS") {
      return NextResponse.json(
        { error: "Custom domain requires BUSINESS tier" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { customDomain } = body;

    if (!customDomain) {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 }
      );
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    if (!domainRegex.test(customDomain)) {
      return NextResponse.json(
        { error: "Invalid domain format" },
        { status: 400 }
      );
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        customDomain: customDomain.toLowerCase(),
        domainVerified: false,
        domainVerifiedAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Domain configured. Please add DNS record to verify ownership.",
      verification: {
        recordType: "TXT",
        name: "_toefllynk-verification." + customDomain,
        value: verificationToken,
      },
      instructions: [
        `1. Add a TXT record for "_toefllynk-verification.${customDomain}"`,
        `2. Set the value to: ${verificationToken}`,
        "3. Wait for DNS propagation (can take up to 24 hours)",
        "4. Click 'Verify' to confirm ownership",
      ],
    });
  } catch (error) {
    console.error("Set custom domain error:", error);
    return NextResponse.json({ error: "Failed to set custom domain" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        customDomain: null,
        domainVerified: false,
        domainVerifiedAt: null,
      },
    });

    return NextResponse.json({ success: true, message: "Custom domain removed" });
  } catch (error) {
    console.error("Remove custom domain error:", error);
    return NextResponse.json({ error: "Failed to remove custom domain" }, { status: 500 });
  }
}