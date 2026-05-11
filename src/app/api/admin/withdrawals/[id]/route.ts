import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

type Params = Promise<{ id: string }>;

export async function PATCH(req: Request, { params }: { params: Params }) {
  try {
    const session = await getSession();

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, notes } = body;

    if (!action || !["APPROVE", "REJECT", "COMPLETE"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Use APPROVE, REJECT, or COMPLETE" },
        { status: 400 }
      );
    }

    // Find the withdrawal request
    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
          },
          include: {
            bankAccount: {
              select: {
                bankName: true,
                bankAccount: true,
                bankHolder: true,
              },
            },
          },
        },
      },
    });

    if (!withdrawal) {
      return NextResponse.json(
        { error: "Withdrawal request not found" },
        { status: 404 }
      );
    }

    // Validate status based on action
    if (action === "COMPLETE") {
      // COMPLETE can only be done on APPROVED status
      if (withdrawal.status !== "APPROVED") {
        return NextResponse.json(
          { error: "Withdrawal must be APPROVED before marking as COMPLETED" },
          { status: 400 }
        );
      }
    } else {
      // APPROVE/REJECT can only be done on PENDING status
      if (withdrawal.status !== "PENDING") {
        return NextResponse.json(
          { error: "This withdrawal request has already been processed" },
          { status: 400 }
        );
      }
    }

    // Map action to status
    const statusMap: Record<string, "APPROVED" | "REJECTED" | "COMPLETED"> = {
      APPROVE: "APPROVED",
      REJECT: "REJECTED",
      COMPLETE: "COMPLETED",
    };

    const newStatus = statusMap[action];

    // Update withdrawal request
    const updated = await prisma.withdrawalRequest.update({
      where: { id },
      data: {
        status: newStatus,
        notes: notes || null,
        processedAt: new Date(),
        processedBy: session.userId,
      },
    });

    // If approved/completed, we might want to log this in audit log
    // For now, we'll just return success

    return NextResponse.json({
      success: true,
      message: `Withdrawal request ${action.toLowerCase()}d successfully`,
      data: {
        id: updated.id,
        status: updated.status,
        processedAt: updated.processedAt,
      },
    });
  } catch (error) {
    console.error("Admin withdrawal action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Params }) {
  try {
    const session = await getSession();

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
          include: {
            profile: { select: { whatsapp: true } },
          },
        },
      },
    });

    if (!withdrawal) {
      return NextResponse.json(
        { error: "Withdrawal request not found" },
        { status: 404 }
      );
    }

    // Get user's earnings info
    const earnings = await prisma.affiliateConversion.aggregate({
      where: { affiliateUserId: withdrawal.userId },
      _sum: { commissionAmount: true },
    });

    const totalEarnings = earnings._sum.commissionAmount || 0;

    return NextResponse.json({
      success: true,
      data: {
        ...withdrawal,
        userTotalEarnings: totalEarnings,
      },
    });
  } catch (error) {
    console.error("Get withdrawal detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}