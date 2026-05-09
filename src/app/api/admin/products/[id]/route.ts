import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { cleanupFileChange, deleteStorageFile } from "@/lib/fileCleanup";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    // Get current product to check for file cleanup
    const currentProduct = await prisma.product.findUnique({
      where: { id },
      select: { thumbnail: true },
    });

    const product = await prisma.product.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        price: parseInt(body.price),
        promoPrice: body.promoPrice ? parseInt(body.promoPrice) : null,
        thumbnail: body.thumbnail,
        checkoutLink: body.checkoutLink,
        category: body.category,
        productType: body.productType,
        packageType: body.packageType,
        examCredits: parseInt(body.examCredits) || 1,
        certificateIncluded: body.certificateIncluded,
        reviewIncluded: body.reviewIncluded,
        zoomIncluded: body.zoomIncluded,
        affiliateEnabled: body.affiliateEnabled,
        affiliateCommission: parseInt(body.affiliateCommission) || 10,
        isArchived: body.isArchived,
      },
    });

    // Clean up old thumbnail if changed
    if (currentProduct?.thumbnail) {
      await cleanupFileChange(currentProduct.thumbnail, body.thumbnail);
    }

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Admin access required") {
      return NextResponse.json({ success: false, message: error.message }, { status: error.message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Get product to delete its thumbnail
    const product = await prisma.product.findUnique({
      where: { id },
      select: { thumbnail: true },
    });

    await prisma.product.delete({
      where: { id },
    });

    // Clean up thumbnail file if exists
    if (product?.thumbnail) {
      await deleteStorageFile(product.thumbnail);
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
