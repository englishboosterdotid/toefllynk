import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const user = await requireUser();

    // Delete any PENDING subscriptions older than 1 minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    await prisma.subscription.deleteMany({
      where: {
        userId: user.id,
        status: "PENDING",
        createdAt: {
          lt: oneMinuteAgo,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pending subscriptions cleaned up",
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    console.error("Reset subscription error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
