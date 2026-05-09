import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { TierService } from "@/lib/services/TierService";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const promoCodes = await prisma.promoCode.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
    });

    return NextResponse.json({ promoCodes });
  } catch (error) {
    console.error("Get promo codes error:", error);
    return NextResponse.json({ error: "Failed to get promo codes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check tier access (PRO+ only)
    const tierInfo = await TierService.getUserTierInfo(session.userId);
    if (!tierInfo.tierConfig.hasPromoCodes) {
      return NextResponse.json(
        { error: "Promo codes require PRO or BUSINESS tier" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { code, type, value, minPurchase, maxDiscount, usageLimit, startDate, endDate } = body;

    // Validate required fields
    if (!code || !type || value === undefined) {
      return NextResponse.json(
        { error: "Code, type, and value are required" },
        { status: 400 }
      );
    }

    // Validate code format
    const codeRegex = /^[A-Z0-9_-]{3,20}$/i;
    if (!codeRegex.test(code)) {
      return NextResponse.json(
        { error: "Code must be 3-20 characters (letters, numbers, underscore, hyphen)" },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existingCode) {
      return NextResponse.json(
        { error: "Code already exists" },
        { status: 409 }
      );
    }

    // Validate value
    if (type === "PERCENTAGE" && (value < 1 || value > 100)) {
      return NextResponse.json(
        { error: "Percentage must be between 1 and 100" },
        { status: 400 }
      );
    }

    if (type === "FIXED" && value < 1000) {
      return NextResponse.json(
        { error: "Fixed discount must be at least Rp 1.000" },
        { status: 400 }
      );
    }

    const promoCode = await prisma.promoCode.create({
      data: {
        userId: session.userId,
        code: code.toUpperCase(),
        type: type === "PERCENTAGE" ? "PERCENTAGE" : "FIXED",
        value,
        minPurchase: minPurchase || 0,
        maxDiscount: maxDiscount || null,
        usageLimit: usageLimit || null,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json({ success: true, promoCode });
  } catch (error) {
    console.error("Create promo code error:", error);
    return NextResponse.json({ error: "Failed to create promo code" }, { status: 500 });
  }
}