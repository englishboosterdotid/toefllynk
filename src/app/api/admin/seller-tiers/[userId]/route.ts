import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { SellerTier } from "@/generated/prisma/enums";
import { TierService, TierServiceClass } from "@/lib/services/TierService";
import { logAudit } from "@/lib/auditLog";

type Params = Promise<{ userId: string }>;

export async function GET(
  req: Request,
  { params }: { params: Params }
) {
  try {
    await requireAdmin();
    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        avatar: true,
        whatsapp: true,
        sellerTier: true,
        subscriptionStart: true,
        subscriptionEnd: true,
        customFeeRate: true,
        tierChangedAt: true,
        tierChangeReason: true,
        createdAt: true,
        _count: {
          select: {
            products: {
              where: { isArchived: false },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Get tier info
    const tierInfo = TierServiceClass.getConfig(user.sellerTier);

    // Get tier change history
    const tierHistory = await prisma.sellerTierLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Get admin who made last change (if changed by admin)
    let lastChangedByAdmin = null;
    if (tierHistory.length > 0) {
      const lastChange = tierHistory[0];
      if (lastChange.changedBy !== "SYSTEM" && lastChange.changedBy !== lastChange.userId) {
        const admin = await prisma.user.findUnique({
          where: { id: lastChange.changedBy },
          select: { id: true, name: true, email: true },
        });
        lastChangedByAdmin = admin;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          whatsapp: user.whatsapp,
          sellerTier: user.sellerTier,
          subscriptionStart: user.subscriptionStart,
          subscriptionEnd: user.subscriptionEnd,
          customFeeRate: user.customFeeRate,
          tierChangedAt: user.tierChangedAt,
          tierChangeReason: user.tierChangeReason,
          createdAt: user.createdAt,
          productCount: (user as any)._count?.products || 0,
        },
        tierInfo,
        tierHistory,
        lastChangedByAdmin,
      },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Admin access required") {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.message === "Unauthorized" ? 401 : 403 }
      );
    }
    console.error("Admin seller-tiers GET by ID error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Params }
) {
  try {
    const admin = await requireAdmin();
    const { userId } = await params;

    const body = await req.json();
    const { tier, reason, feeOverride, extendDays } = body;

    // Validate user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, sellerTier: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Validate tier if provided
    if (tier && !["FREE", "PRO", "BUSINESS"].includes(tier)) {
      return NextResponse.json(
        { success: false, message: "Invalid tier" },
        { status: 400 }
      );
    }

    // Validate fee override (0-20%)
    if (feeOverride !== undefined && feeOverride !== null) {
      const parsedFee = parseInt(feeOverride);
      if (isNaN(parsedFee) || parsedFee < 0 || parsedFee > 20) {
        return NextResponse.json(
          { success: false, message: "Fee override must be between 0 and 20" },
          { status: 400 }
        );
      }
    }

    // Change tier
    const result = await TierService.changeTier(userId, tier as SellerTier, admin.id, {
      reason,
      feeOverride: feeOverride !== undefined ? feeOverride : null,
      extendDays: extendDays ? parseInt(extendDays) : undefined,
    });

    // Audit log
    await logAudit({
      adminId: admin.id,
      action: "UPDATE",
      entityType: "SellerTier",
      entityId: userId,
      oldValue: { tier: result.oldTier },
      newValue: { tier, reason, feeOverride },
      details: `Changed tier from ${result.oldTier} to ${tier}${reason ? ` - Reason: ${reason}` : ""}`,
    });

    // Get updated user info
    const updatedUser = await TierService.getUserTierInfo(userId);

    return NextResponse.json({
      success: true,
      message: `Tier changed from ${result.oldTier} to ${tier}`,
      data: {
        userId,
        oldTier: result.oldTier,
        newTier: tier,
        ...updatedUser,
      },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Admin access required") {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.message === "Unauthorized" ? 401 : 403 }
      );
    }
    console.error("Admin seller-tiers PATCH error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
