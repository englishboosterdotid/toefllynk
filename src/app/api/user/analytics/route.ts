import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import {
  getUserAnalytics,
  getRevenueByPeriod,
  getTopProducts,
  getAffiliateAnalytics,
  checkAnalyticsAccess,
} from "@/lib/services/analyticsService";

export async function GET(req: Request) {
  try {
    const user = await requireUser();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "overview";
    const period = searchParams.get("period") || "30";
    const periodType = (searchParams.get("periodType") || "day") as "day" | "week" | "month";
    const days = parseInt(period) || 30;

    // Check analytics access level
    const access = await checkAnalyticsAccess(user.id);

    if (!access.hasAccess) {
      return NextResponse.json(
        { success: false, message: "Fitur analytics tidak tersedia untuk tier Anda" },
        { status: 403 }
      );
    }

    let result;
    let data: any;

    switch (type) {
      case "revenue":
        const revenueResult = await getRevenueByPeriod(user.id, periodType, days);
        if (!revenueResult.success) {
          return NextResponse.json({ success: false, message: revenueResult.error }, { status: 400 });
        }
        data = revenueResult.data;
        break;

      case "topProducts":
        const topResult = await getTopProducts(user.id, 10, days);
        if (!topResult.success) {
          return NextResponse.json({ success: false, message: topResult.error }, { status: 400 });
        }
        data = topResult.data;
        break;

      case "affiliate":
        // Check if full/advanced analytics for affiliate
        if (access.level === "basic") {
          return NextResponse.json(
            { success: false, message: "Affiliate analytics hanya untuk PRO+" },
            { status: 403 }
          );
        }
        const affiliateResult = await getAffiliateAnalytics(user.id, days);
        if (!affiliateResult.success) {
          return NextResponse.json({ success: false, message: affiliateResult.error }, { status: 400 });
        }
        data = affiliateResult.data;
        break;

      case "overview":
      default:
        const overviewResult = await getUserAnalytics(user.id);
        if (!overviewResult.success) {
          return NextResponse.json({ success: false, message: overviewResult.error }, { status: 400 });
        }
        data = overviewResult.data;
        break;
    }

    return NextResponse.json({
      success: true,
      type,
      period: days,
      level: access.level,
      data,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}