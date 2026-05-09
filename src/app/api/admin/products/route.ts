import { NextResponse } from "next/server";
import { ProductType, PackageType } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/requireAdmin";
import { productRepository } from "@/lib/repositories";

export async function GET(req: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "20")));

    const result = await productRepository.findAllWithUsers({
      page,
      limit,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      products: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      }
    });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Admin access required") {
      return NextResponse.json({ success: false, message: error.message }, { status: error.message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const {
      title,
      description,
      price,
      promoPrice,
      thumbnail,
      checkoutLink,
      category,
      productType,
      packageType,
      examCredits,
      certificateIncluded,
      reviewIncluded,
      zoomIncluded,
      affiliateEnabled,
      affiliateCommission,
      userId,
    } = body;

    // Validation
    const parsedPrice = parseInt(price);
    const parsedPromoPrice = promoPrice ? parseInt(promoPrice) : null;
    const parsedExamCredits = parseInt(examCredits) || 1;

    if (!parsedPrice || parsedPrice < 1000) {
      return NextResponse.json(
        { success: false, message: "Harga minimal Rp 1.000" },
        { status: 400 }
      );
    }

    if (parsedPromoPrice && parsedPromoPrice < 1000) {
      return NextResponse.json(
        { success: false, message: "Harga promo minimal Rp 1.000" },
        { status: 400 }
      );
    }

    if (parsedPromoPrice && parsedPromoPrice > parsedPrice) {
      return NextResponse.json(
        { success: false, message: "Harga promo tidak boleh lebih tinggi dari harga normal" },
        { status: 400 }
      );
    }

    if (parsedExamCredits < 1) {
      return NextResponse.json(
        { success: false, message: "Exam credits minimal 1" },
        { status: 400 }
      );
    }

    const product = await productRepository.create({
      userId,
      title,
      description,
      price: parsedPrice,
      promoPrice: parsedPromoPrice,
      thumbnail,
      checkoutLink,
      category,
      productType: productType || "TOEFL_SIMULATION",
      packageType,
      examCredits: parsedExamCredits,
      certificateIncluded: certificateIncluded ?? true,
      reviewIncluded: reviewIncluded ?? false,
      zoomIncluded: zoomIncluded ?? false,
      affiliateEnabled: affiliateEnabled ?? false,
    });

    // Create default affiliate enrollment with commission
    if (affiliateEnabled && userId) {
      const { createAffiliateEnrollment } = await import("@/lib/services/affiliateService");
      await createAffiliateEnrollment({
        affiliateUserId: userId,
        ownerUserId: userId,
        productId: product.id,
        commissionPercent: parseInt(affiliateCommission) || 10,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Admin access required") {
      return NextResponse.json({ success: false, message: error.message }, { status: error.message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}