import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { SellerTier } from "@/generated/prisma/enums";

export async function GET(req: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "20")));
    const tier = searchParams.get("tier") as SellerTier | null;
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ];
    }

    // Add profile filter for tier if specified
    if (tier && ["FREE", "BASIC", "PRO", "BUSINESS"].includes(tier)) {
      whereClause.profile = { sellerTier: tier };
    }

    const [users, total, tierCounts] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          avatar: true,
          createdAt: true,
          profile: {
            select: {
              sellerTier: true,
              subscriptionStart: true,
              subscriptionEnd: true,
              customFeeRate: true,
              tierChangedAt: true,
            },
          },
          _count: {
            select: {
              products: {
                where: { settings: { isArchived: false } },
              },
            },
          },
        },
      }),
      prisma.user.count({ where: whereClause }),
      prisma.sellerProfile.groupBy({
        by: ["sellerTier"],
        _count: { sellerTier: true },
      }),
    ]);

    // Format tier counts
    const tierDistribution = {
      FREE: 0,
      BASIC: 0,
      STARTER: 0,
      PRO: 0,
      BUSINESS: 0,
    };

    tierCounts.forEach((item) => {
      tierDistribution[item.sellerTier] = item._count.sellerTier;
    });

    return NextResponse.json({
      success: true,
      sellers: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        createdAt: user.createdAt,
        sellerTier: user.profile?.sellerTier || "FREE",
        subscriptionStart: user.profile?.subscriptionStart,
        subscriptionEnd: user.profile?.subscriptionEnd,
        customFeeRate: user.profile?.customFeeRate,
        tierChangedAt: user.profile?.tierChangedAt,
        productCount: user._count.products,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total: total,
        tierDistribution,
      },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Admin access required") {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.message === "Unauthorized" ? 401 : 403 }
      );
    }
    console.error("Admin seller-tiers GET error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
