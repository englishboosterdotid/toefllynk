import prisma from "@/lib/prisma";
import { createOrder } from "@/lib/services/orderService";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();

  const productId = formData.get("productId") as string;
  const buyerName = formData.get("buyerName") as string;
  const buyerEmail = formData.get("buyerEmail") as string;
  const buyerWhatsapp = formData.get("buyerWhatsapp") as string;
  const referralCode = formData.get("referralCode") as string;

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product || product.isArchived) {
    return NextResponse.redirect(new URL("/program-closed", req.url));
  }

  await createOrder({
    productId,
    buyerName,
    buyerEmail,
    buyerWhatsapp: buyerWhatsapp || null,
    referralCode: referralCode || null,
  });

  return NextResponse.redirect(new URL("/thank-you", req.url));
}