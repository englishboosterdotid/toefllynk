import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendOrderConfirmation } from "@/lib/email";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    // Auth check
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
        product: {
          include: { settings: true },
        },
        student: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Verify ownership - buyer or product owner or admin
    const isBuyer = order.buyerEmail === session.email;
    const isProductOwner = order.product.userId === session.userId;
    const isAdmin = session.role === "ADMIN";

    if (!isBuyer && !isProductOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    if (!order.student) {
      return NextResponse.json(
        { error: "Student account not found" },
        { status: 404 }
      );
    }

    // No specific product type check needed - simulation orders have automatic access
    // The check was removed since we only have INDIVIDUAL package type
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const price = order.product.settings?.promoPrice || order.product.price;
    const examCredits = order.product.settings?.examCredits || 1;

    // Resend the confirmation email
    await sendOrderConfirmation(order.buyerEmail, {
      orderId: order.id,
      productName: order.product.title,
      amount: price,
      buyerName: order.buyerName,
      accessToken: order.student.accessToken,
      examCredits,
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