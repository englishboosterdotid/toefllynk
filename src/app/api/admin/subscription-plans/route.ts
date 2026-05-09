import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import prisma from "@/lib/prisma";
import { SellerTier } from "@/generated/prisma/enums";

export async function GET() {
  try {
    await requireAdmin();

    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { tier: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: plans,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Admin access required") {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.message === "Unauthorized" ? 401 : 403 }
      );
    }
    console.error("Get subscription plans error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

interface PlanInput {
  tier: SellerTier;
  name: string;
  price: number;
  periodDays: number;
  features: string[];
  isActive: boolean;
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body: PlanInput = await req.json();
    const { tier, name, price, periodDays, features, isActive } = body;

    // Validate required fields
    if (!tier || !name || price === undefined || !periodDays) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate tier
    if (!["FREE", "PRO", "BUSINESS"].includes(tier)) {
      return NextResponse.json(
        { success: false, message: "Invalid tier" },
        { status: 400 }
      );
    }

    // Check if tier already exists
    const existing = await prisma.subscriptionPlan.findUnique({
      where: { tier },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Plan for this tier already exists" },
        { status: 400 }
      );
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        tier,
        name,
        price,
        periodDays,
        features: features || [],
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      data: plan,
      message: "Plan created successfully",
    });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Admin access required") {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.message === "Unauthorized" ? 401 : 403 }
      );
    }
    console.error("Create subscription plan error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body: Partial<PlanInput> & { id: string } = await req.json();
    const { id, tier, name, price, periodDays, features, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Plan ID is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = price;
    if (periodDays !== undefined) updateData.periodDays = periodDays;
    if (features !== undefined) updateData.features = features;
    if (isActive !== undefined) updateData.isActive = isActive;

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: plan,
      message: "Plan updated successfully",
    });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Admin access required") {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.message === "Unauthorized" ? 401 : 403 }
      );
    }
    console.error("Update subscription plan error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Plan ID is required" },
        { status: 400 }
      );
    }

    await prisma.subscriptionPlan.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Plan deleted successfully",
    });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Admin access required") {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.message === "Unauthorized" ? 401 : 403 }
      );
    }
    console.error("Delete subscription plan error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
