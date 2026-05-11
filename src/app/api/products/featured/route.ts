import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { TierService } from "@/lib/services/TierService";

const MAX_FEATURED_PRODUCTS = 3;

export async function POST(req: Request) {
  try {
    const user = await requireUser();

    const formData = await req.formData();
    const productId = formData.get("productId") as string;
    const featured = formData.get("featured") === "true";

    if (!productId) {
      return NextResponse.redirect(new URL("/user/products?error=product_required", req.url));
    }

    // Check tier access (PRO+ only)
    const tierInfo = await TierService.getUserTierInfo(user.id);
    if (!tierInfo.tierConfig.hasFeaturedProducts) {
      return NextResponse.redirect(new URL("/user/products?error=featured_requires_pro", req.url));
    }

    // Verify product ownership
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { userId: true },
    });

    if (!product || product.userId !== user.id) {
      return NextResponse.redirect(new URL("/user/products?error=unauthorized", req.url));
    }

    // If setting as featured, check limit
    if (featured) {
      const currentFeaturedCount = await prisma.product.count({
        where: { userId: user.id, settings: { isFeatured: true } },
      });

      // Don't count the current product if it's already featured
      const existingFeatured = await prisma.product.findUnique({
        where: { id: productId },
        include: { settings: { select: { isFeatured: true } } },
      });

      const effectiveCount = existingFeatured?.settings?.isFeatured ? currentFeaturedCount - 1 : currentFeaturedCount;

      if (effectiveCount >= MAX_FEATURED_PRODUCTS) {
        return NextResponse.redirect(new URL(`/user/products?error=max_featured&count=${MAX_FEATURED_PRODUCTS}`, req.url));
      }
    }

    await prisma.productSettings.upsert({
      where: { productId },
      create: { productId, isFeatured: featured },
      update: { isFeatured: featured },
    });

    return NextResponse.redirect(new URL("/user/products", req.url));
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    console.error("Toggle featured error:", error);
    return NextResponse.redirect(new URL("/user/products?error=server_error", req.url));
  }
}