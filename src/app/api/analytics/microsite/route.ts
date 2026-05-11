import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID required" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Get visitor info
    const headersList = await headers();
    const viewerIp =
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      "unknown";
    const userAgent = headersList.get("user-agent") || undefined;
    const referrer = req.headers.get("referer") || undefined;

    await prisma.micrositeView.create({
      data: {
        userId,
        viewerIp,
        userAgent,
        referrer,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[MicrositeView] Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID required" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { userId };
    if (startDate || endDate) {
      where.viewedAt = {};
      if (startDate) (where.viewedAt as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.viewedAt as Record<string, Date>).lte = new Date(endDate);
    }

    const views = await prisma.micrositeView.findMany({
      where,
      orderBy: { viewedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      userId,
      totalViews: views.length,
      views,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
