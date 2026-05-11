import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cache, CacheKeys } from "@/lib/cache";
import { requireUser } from "@/lib/requireUser";

export async function POST(req: Request) {
  try {
    const user = await requireUser();

    const formData = await req.formData();
    const productId = formData.get("productId") as string;

    // Verify ownership
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { settings: { select: { isArchived: true } } },
    });

    if (!product || product.userId !== user.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    // Update via ProductSettings
    await prisma.productSettings.upsert({
      where: { productId },
      create: { productId, isArchived: true },
      update: { isArchived: !product.settings?.isArchived },
    });

    // Invalidate cache
    cache.delete(CacheKeys.PRODUCTS);

    return NextResponse.redirect(new URL("/user/products", req.url));
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.redirect(new URL("/user/products", req.url));
  }
}