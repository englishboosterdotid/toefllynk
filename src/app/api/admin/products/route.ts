import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ProductType, PackageType } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.product.count(),
    ]);

    return NextResponse.json({ 
      success: true, 
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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

    const product = await prisma.product.create({
      data: {
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
        affiliateCommission: parseInt(affiliateCommission) || 10,
      },
    });

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
