import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const session = await getSession();

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const whereClause: any = {};
    if (status && ["PENDING", "APPROVED", "REJECTED", "COMPLETED"].includes(status)) {
      whereClause.status = status;
    }

    const withdrawalRequests = await prisma.withdrawalRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate stats
    const allRequests = await prisma.withdrawalRequest.findMany({
      select: { status: true, amount: true, netAmount: true },
    });

    const pendingCount = allRequests.filter((r) => r.status === "PENDING").length;
    const totalPendingAmount = allRequests
      .filter((r) => r.status === "PENDING")
      .reduce((sum, r) => sum + r.amount, 0);

    const totalApprovedAmount = allRequests
      .filter((r) => r.status === "COMPLETED")
      .reduce((sum, r) => sum + (r.netAmount || r.amount), 0);

    return NextResponse.json({
      success: true,
      data: {
        requests: withdrawalRequests,
        stats: {
          pendingCount,
          totalPendingAmount,
          totalApprovedAmount,
          totalRequests: allRequests.length,
        },
      },
    });
  } catch (error) {
    console.error("Get admin withdrawals error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}