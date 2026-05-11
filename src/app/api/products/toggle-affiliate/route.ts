import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { cache, CacheKeys } from "@/lib/cache";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const productId = formData.get("productId") as string;
    const user = await requireUser();

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { settings: { select: { affiliateEnabled: true } } },
    });

    if (!product || product.userId !== user.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    await prisma.productSettings.upsert({
      where: { productId },
      create: { productId, affiliateEnabled: true },
      update: { affiliateEnabled: !product.settings?.affiliateEnabled },
    });

    // Invalidate products cache
    cache.delete(CacheKeys.PRODUCTS);

    return NextResponse.redirect(new URL("/user/products", req.url));
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
