import { analyticsRepository } from "@/lib/repositories";
import { TierServiceClass } from "@/lib/services/TierService";
import { SellerTier } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";

export interface AnalyticsOverview {
  totalProducts: number;
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
  affiliateConversions: number;
  totalCustomers: number;
  totalViews: number;
  conversionRate: number;
}

export interface RevenuePeriod {
  date: string;
  revenue: number;
}

export async function getUserAnalytics(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{ success: boolean; data?: AnalyticsOverview; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { sellerTier: true },
    });

    if (!user) {
      return { success: false, error: "User tidak ditemukan" };
    }

    const data = await analyticsRepository.getUserAnalytics(userId, startDate, endDate);

    return { success: true, data };
  } catch (error) {
    console.error("Get user analytics error:", error);
    return { success: false, error: "Terjadi kesalahan saat mengambil analytics" };
  }
}

export async function getRevenueByPeriod(
  userId: string,
  period: "day" | "week" | "month" = "day",
  days = 30
): Promise<{ success: boolean; data?: RevenuePeriod[]; error?: string }> {
  try {
    const data = await analyticsRepository.getRevenueByPeriod(userId, period, days);
    return { success: true, data };
  } catch (error) {
    console.error("Get revenue by period error:", error);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function getProductAnalytics(
  productId: string,
  page = 1,
  limit = 20,
  startDate?: Date,
  endDate?: Date
): Promise<{
  success: boolean;
  data?: {
    views: number;
    viewList: any;
  };
  error?: string;
}> {
  try {
    const viewCount = await analyticsRepository.getProductViewCount(productId, startDate, endDate);
    const viewList = await analyticsRepository.getProductViews(productId, page, limit, startDate, endDate);

    return {
      success: true,
      data: {
        views: viewCount,
        viewList,
      },
    };
  } catch (error) {
    console.error("Get product analytics error:", error);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function recordProductView(
  productId: string,
  viewerIp?: string | null,
  userAgent?: string | null,
  referrer?: string | null
): Promise<void> {
  await analyticsRepository.recordProductView({
    productId,
    viewerIp,
    userAgent,
    referrer,
  });
}

export async function getTopProducts(
  userId: string,
  limit = 5,
  period = 30
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const products = await prisma.product.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        thumbnail: true,
        price: true,
        promoPrice: true,
        _count: {
          select: { orders: true },
        },
      },
    });

    // Get orders for this period
    const orders = await prisma.order.findMany({
      where: {
        product: { userId },
        status: "COMPLETED",
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        productId: true,
        product: {
          select: { promoPrice: true, price: true },
        },
      },
    });

    // Calculate revenue per product
    const productRevenue: Record<string, number> = {};
    orders.forEach((o) => {
      const price = o.product.promoPrice || o.product.price;
      productRevenue[o.productId] = (productRevenue[o.productId] || 0) + price;
    });

    // Combine with product data and sort
    const topProducts = products
      .map((p) => ({
        ...p,
        orderCount: p._count.orders,
        revenue: productRevenue[p.id] || 0,
      }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, limit);

    return { success: true, data: topProducts };
  } catch (error) {
    console.error("Get top products error:", error);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function getAffiliateAnalytics(
  userId: string,
  period = 30
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const conversions = await prisma.affiliateConversion.findMany({
      where: {
        ownerUserId: userId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        id: true,
        commissionAmount: true,
        affiliateUserId: true,
        createdAt: true,
      },
    });

    const totalCommission = conversions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const uniqueAffiliates = new Set(conversions.map((c) => c.affiliateUserId)).size;

    return {
      success: true,
      data: {
        totalConversions: conversions.length,
        totalCommission,
        uniqueAffiliates,
        averageCommission: conversions.length > 0 ? Math.round(totalCommission / conversions.length) : 0,
        conversions: conversions.slice(0, 10), // Last 10 conversions
      },
    };
  } catch (error) {
    console.error("Get affiliate analytics error:", error);
    return { success: false, error: "Terjadi kesalahan" };
  }
}

export async function checkAnalyticsAccess(
  userId: string
): Promise<{ hasAccess: boolean; level: "basic" | "full" | "advanced"; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sellerTier: true },
  });

  if (!user) {
    return { hasAccess: false, level: "basic", error: "User tidak ditemukan" };
  }

  const tierConfig = TierServiceClass.getConfig(user.sellerTier as SellerTier);

  let level: "basic" | "full" | "advanced" = "basic";
  if (tierConfig.analyticsLevel === "full") level = "full";
  if (tierConfig.analyticsLevel === "advanced") level = "advanced";

  return { hasAccess: true, level };
}