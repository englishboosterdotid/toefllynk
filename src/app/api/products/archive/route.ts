import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const productId = formData.get("productId") as string;

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (product) {
    await prisma.product.update({
      where: { id: productId },
      data: {
        isArchived: !product.isArchived,
      },
    });
  }

  return NextResponse.redirect(new URL("/user/products", req.url));
}