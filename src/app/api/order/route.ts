import { NextResponse } from "next/server";
import { createOrder } from "@/lib/services/orderService";
import { productRepository } from "@/lib/repositories";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const formData = await req.formData();

  const productId = formData.get("productId") as string;
  const buyerName = formData.get("buyerName") as string;
  const buyerEmail = formData.get("buyerEmail") as string;
  const buyerWhatsapp = formData.get("buyerWhatsapp") as string;
  const referralCode = formData.get("referralCode") as string;
  const promoCode = formData.get("promoCode") as string;

  const product = await productRepository.findByIdWithOwner(productId);

  if (!product || product.isArchived) {
    return NextResponse.redirect(new URL("/program-closed", req.url));
  }

  // Validate promo code if provided
  let finalPrice = product.promoPrice || product.price;
  let appliedPromoId: string | null = null;
  let discountAmount = 0;

  if (promoCode) {
    const promo = await prisma.promoCode.findUnique({
      where: { code: promoCode.toUpperCase() },
    });

    if (promo && promo.userId === product.userId && promo.status === "ACTIVE") {
      const now = new Date();
      const isActive = now >= promo.startDate && (!promo.endDate || now <= promo.endDate);
      const hasUsageLeft = !promo.usageLimit || promo.usageCount < promo.usageLimit;

      if (isActive && hasUsageLeft && finalPrice >= promo.minPurchase) {
        if (promo.type === "PERCENTAGE") {
          discountAmount = Math.floor(finalPrice * (promo.value / 100));
          if (promo.maxDiscount && discountAmount > promo.maxDiscount) {
            discountAmount = promo.maxDiscount;
          }
        } else {
          discountAmount = promo.value;
        }

        // Cap discount at price
        if (discountAmount > finalPrice) {
          discountAmount = finalPrice;
        }

        finalPrice = finalPrice - discountAmount;
        appliedPromoId = promo.id;
      }
    }
  }

  await createOrder({
    productId,
    buyerName,
    buyerEmail,
    buyerWhatsapp: buyerWhatsapp || null,
    referralCode: referralCode || null,
    promoCodeId: appliedPromoId,
    discountAmount,
    finalPrice,
  });

  return NextResponse.redirect(new URL("/thank-you", req.url));
}