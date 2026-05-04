import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ProductType, PackageType } from "@/generated/prisma/enums";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
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
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
