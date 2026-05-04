import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        studentId: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      studentId: order.studentId,
    });
  } catch (error) {
    console.error("[API /order/status] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}