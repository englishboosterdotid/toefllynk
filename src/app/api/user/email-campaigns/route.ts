import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromCookie } from "@/lib/auth";
import { getCampaignsByUser, createCampaign, getEmailQuota } from "@/lib/services/emailCampaignService";
import { requireActiveSeller } from "@/lib/requireSellerTier";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const user = await getUserFromCookie(cookieStore);

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { requireActiveSeller } = await import("@/lib/requireSellerTier");
    const requireResult = await requireActiveSeller(user.id);
    if (!requireResult.success) {
      return NextResponse.json(requireResult, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const result = await getCampaignsByUser(user.id, page, limit);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    // Get quota info
    const quota = await getEmailQuota(user.id);

    return NextResponse.json({
      success: true,
      campaigns: result.campaigns,
      pagination: result.pagination,
      quota,
    });
  } catch (error) {
    console.error("Get campaigns error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const user = await getUserFromCookie(cookieStore);

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const requireResult = await requireActiveSeller(user.id);
    if (!requireResult.success) {
      return NextResponse.json(requireResult, { status: 403 });
    }

    const body = await request.json();
    const { name, subject, template, scheduledAt } = body;

    if (!name || !subject) {
      return NextResponse.json({
        success: false,
        message: "Nama dan subjek harus diisi",
      }, { status: 400 });
    }

    const result = await createCampaign(user.id, {
      name,
      subject,
      template: template || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      campaign: result.campaign,
    });
  } catch (error) {
    console.error("Create campaign error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}