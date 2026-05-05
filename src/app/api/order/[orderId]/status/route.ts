import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Auth check
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        student: { select: { id: true } },
        product: { select: { userId: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify ownership - either the buyer or the product owner
    const isBuyer = order.buyerEmail === session.email;
    const isProductOwner = order.product.userId === session.userId;
    const isAdmin = session.role === "ADMIN";

    if (!isBuyer && !isProductOwner && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      studentId: order.student?.id || null,
    });
  } catch (error) {
    console.error("[API /order/status] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}