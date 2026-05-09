import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const promoCode = await prisma.promoCode.findUnique({
      where: { id },
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
    });

    if (!promoCode) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
    }

    if (promoCode.userId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ promoCode });
  } catch (error) {
    console.error("Get promo code error:", error);
    return NextResponse.json({ error: "Failed to get promo code" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existingCode = await prisma.promoCode.findUnique({ where: { id } });
    if (!existingCode) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
    }

    if (existingCode.userId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};

    if (body.value !== undefined) {
      if (existingCode.type === "PERCENTAGE" && (body.value < 1 || body.value > 100)) {
        return NextResponse.json({ error: "Percentage must be between 1 and 100" }, { status: 400 });
      }
      updateData.value = body.value;
    }

    if (body.minPurchase !== undefined) updateData.minPurchase = body.minPurchase;
    if (body.maxDiscount !== undefined) updateData.maxDiscount = body.maxDiscount;
    if (body.usageLimit !== undefined) updateData.usageLimit = body.usageLimit;
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.status !== undefined) updateData.status = body.status;

    const updatedCode = await prisma.promoCode.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, promoCode: updatedCode });
  } catch (error) {
    console.error("Update promo code error:", error);
    return NextResponse.json({ error: "Failed to update promo code" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const promoCode = await prisma.promoCode.findUnique({ where: { id } });
    if (!promoCode) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
    }

    if (promoCode.userId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.promoCode.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete promo code error:", error);
    return NextResponse.json({ error: "Failed to delete promo code" }, { status: 500 });
  }
}