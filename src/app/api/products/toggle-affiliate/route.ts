import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const productId = formData.get("productId") as string;
    const user = await requireUser();

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { userId: true, affiliateEnabled: true },
    });

    if (!product || product.userId !== user.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    await prisma.product.update({
      where: { id: productId },
      data: { affiliateEnabled: !product.affiliateEnabled },
    });

    return NextResponse.redirect(new URL("/user/products", req.url));
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}