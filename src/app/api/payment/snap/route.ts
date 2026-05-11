import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createSnapToken } from "@/lib/payment";
import { OrderService } from "@/lib/services/orderService";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // Apply rate limiting to prevent abuse
    const rateLimitResult = await rateLimit(req);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { productId, buyerName, buyerEmail, buyerWhatsapp, referralCode } = body;

    // Validate required fields
    if (!productId || !buyerName || !buyerEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(buyerEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Get product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { settings: true },
    });

    if (!product || product.settings?.isArchived) {
      return NextResponse.json(
        { error: "Product not found or unavailable" },
        { status: 404 }
      );
    }

    // Calculate price
    const amount = product.settings?.promoPrice || product.price;

    // Validate amount
    if (amount < 1000) {
      return NextResponse.json(
        { error: "Invalid product price" },
        { status: 400 }
      );
    }

    // Create order in pending status
    const orderResult = await OrderService.createOrder({
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