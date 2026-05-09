import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { TierService } from "@/lib/services/TierService";

export async function GET() {
  try {
    const user = await requireUser();
    const tierInfo = await TierService.getUserTierInfo(user.id);

    return NextResponse.json({
      success: true,
      data: tierInfo,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    console.error("Get tier info error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
