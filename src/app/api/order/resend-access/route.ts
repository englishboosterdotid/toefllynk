import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendOrderConfirmation } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const orderId = formData.get("orderId") as string;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: true,
        student: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (!order.student) {
      return NextResponse.json(
        { error: "Student account not found" },
        { status: 404 }
      );
    }

    if (order.product.productType === "BUNDLE") {
      return NextResponse.json(
        { error: "Bundle orders don't have automatic access" },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const price = order.product.promoPrice || order.product.price;

    // Resend the confirmation email
    await sendOrderConfirmation(order.buyerEmail, {
      orderId: order.id,
      productName: order.product.title,
      amount: price,
      buyerName: order.buyerName,
      accessToken: order.student.accessToken,
      examCredits: order.product.examCredits,
      dashboardUrl: `${appUrl}/student/dashboard`,
      loginUrl: `${appUrl}/student/login`,
    });

    return NextResponse.json({
      success: true,
      message: "Access email sent successfully",
    });
  } catch (error) {
    console.error("[API /order/resend-access] Error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}