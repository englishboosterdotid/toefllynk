import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

interface ValidatePromoResult {
  valid: boolean;
  error?: string;
  promo?: {
    id: string;
    code: string;
    type: string;
    value: number;
    minPurchase: number;
    maxDiscount: number | null;
  };
  discount?: number;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, productId } = body;

    if (!code || !productId) {
      return NextResponse.json(
        { valid: false, error: "Code and productId are required" },
        { status: 400 }
      );
    }

    // Find the promo code
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promoCode) {
      return NextResponse.json({ valid: false, error: "Kode promo tidak ditemukan" });
    }

    // Check if promo belongs to the product owner
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { settings: { select: { promoPrice: true } } },
    });

    if (!product) {
      return NextResponse.json({ valid: false, error: "Produk tidak ditemukan" });
    }

    if (promoCode.userId !== product.userId) {
      return NextResponse.json({ valid: false, error: "Kode promo tidak valid untuk produk ini" });
    }

    // Check status
    if (promoCode.status !== "ACTIVE") {
      return NextResponse.json({ valid: false, error: "Kode promo sudah tidak aktif" });
    }

    // Check date range
    const now = new Date();
    if (now < promoCode.startDate) {
      return NextResponse.json({ valid: false, error: "Kode promo belum aktif" });
    }
    if (promoCode.endDate && now > promoCode.endDate) {
      return NextResponse.json({ valid: false, error: "Kode promo sudah kadaluarsa" });
    }

    // Check usage limit
    if (promoCode.usageLimit && promoCode.usageCount >= promoCode.usageLimit) {
      return NextResponse.json({ valid: false, error: "Kode promo sudah mencapai batas penggunaan" });
    }

    // Calculate price after any existing promo
    const price = product.settings?.promoPrice || product.price;

    // Check minimum purchase
    if (promoCode.minPurchase > 0 && price < promoCode.minPurchase) {
      return NextResponse.json({
        valid: false,
        error: `Minimal pembelian Rp ${promoCode.minPurchase.toLocaleString("id-ID")}`,
      });
    }

    // Calculate discount
    let discount = 0;
    if (promoCode.type === "PERCENTAGE") {
      discount = Math.floor(price * (promoCode.value / 100));
      if (promoCode.maxDiscount && discount > promoCode.maxDiscount) {
        discount = promoCode.maxDiscount;
      }
    } else {
      discount = promoCode.value;
    }

    // Don't allow discount greater than price
    if (discount > price) {
      discount = price;
    }

    return NextResponse.json({
      valid: true,
      promo: {
        id: promoCode.id,
        code: promoCode.code,
        type: promoCode.type,
        value: promoCode.value,
        minPurchase: promoCode.minPurchase,
        maxDiscount: promoCode.maxDiscount,
      },
      discount,
    });
  } catch (error) {
    console.error("Validate promo error:", error);
    return NextResponse.json({ valid: false, error: "Gagal memvalidasi kode promo" }, { status: 500 });
  }
}