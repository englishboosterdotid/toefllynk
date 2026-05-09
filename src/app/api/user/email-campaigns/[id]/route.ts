import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromCookie } from "@/lib/auth";
import { getCampaignById, updateCampaign, deleteCampaign, sendCampaign } from "@/lib/services/emailCampaignService";
import { requireActiveSeller } from "@/lib/requireSellerTier";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const user = await getUserFromCookie(cookieStore);

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await getCampaignById(id);

    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    // Check ownership
    if (result.campaign?.userId !== user.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      campaign: result.campaign,
    });
  } catch (error) {
    console.error("Get campaign error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Check ownership
    const existing = await getCampaignById(id);
    if (!existing.success || !existing.campaign) {
      return NextResponse.json({ success: false, message: "Campaign tidak ditemukan" }, { status: 404 });
    }

    if (existing.campaign.userId !== user.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { name, subject, template, scheduledAt, action } = body;

    // Handle special actions
    if (action === "send") {
      const recipients = body.recipients || [];
      const sendResult = await sendCampaign(id, recipients);

      if (!sendResult.success) {
        return NextResponse.json(sendResult, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        sent: sendResult.sent,
      });
    }

    // Normal update
    const result = await updateCampaign(id, user.id, {
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
    console.error("Update campaign error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const user = await getUserFromCookie(cookieStore);

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await getCampaignById(id);

    if (!result.success || !result.campaign) {
      return NextResponse.json({ success: false, message: "Campaign tidak ditemukan" }, { status: 404 });
    }

    if (result.campaign.userId !== user.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const deleteResult = await deleteCampaign(id);

    if (!deleteResult.success) {
      return NextResponse.json(deleteResult, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete campaign error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}