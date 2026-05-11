import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const { referralCode, productId } = await request.json();

    if (!referralCode || !productId) {
      return NextResponse.json(
        { error: "Missing referralCode or productId" },
        { status: 400 }
      );
    }

    // Get visitor IP
    const headersList = await headers();
    const visitorIp =
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      "unknown";

    // Record the click
    const click = await prisma.affiliateClick.create({
      data: {
        referralCode,
        productId,
        visitorIp,
      },
    });

    return NextResponse.json({ success: true, clickId: click.id });
  } catch (error) {
    console.error("[Affiliate Track] Error:", error);
    return NextResponse.json(
      { error: "Failed to track click" },
      { status: 500 }
    );
  }
}
