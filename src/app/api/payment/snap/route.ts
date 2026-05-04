import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createSnapToken } from "@/lib/payment";
import { createOrder } from "@/lib/services/orderService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, buyerName, buyerEmail, buyerWhatsapp, referralCode } = body;

    // Validate required fields
    if (!productId || !buyerName || !buyerEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.isArchived) {
      return NextResponse.json(
        { error: "Product not found or unavailable" },
        { status: 404 }
      );
    }

    // Calculate price
    const amount = product.promoPrice || product.price;

    // Create order in pending status
    const orderResult = await createOrder({
      productId,
      buyerName,
      buyerEmail,
      buyerWhatsapp: buyerWhatsapp || null,
      referralCode: referralCode || null,
    });

    if (!orderResult.success || !orderResult.order) {
      return NextResponse.json(
        { error: orderResult.error || "Failed to create order" },
        { status: 400 }
      );
    }

    // Create Midtrans Snap token
    const { token, redirectUrl } = await createSnapToken({
      orderId: orderResult.order.id,
      amount,
      buyerName,
      buyerEmail,
      buyerWhatsapp,
      productName: product.title,
    });

    return NextResponse.json({
      success: true,
      orderId: orderResult.order.id,
      snapToken: token,
      redirectUrl,
    });
  } catch (error) {
    console.error("[API /payment/snap] Error:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}