import { Prisma } from "@/generated/prisma/client";
import { BaseRepository } from "./base.repository";
import prisma from "@/lib/prisma";

const SELECT_PRODUCT_VIEW_BASIC = {
  id: true,
  productId: true,
  viewedAt: true,
} as const;

export type ProductViewBasic = Prisma.ProductViewGetPayload<{ select: typeof SELECT_PRODUCT_VIEW_BASIC }>;

export class AnalyticsRepository extends BaseRepository {
  // ============ Product Views ============

  async recordProductView(data: {
    productId: string;
    viewerIp?: string | null;
    userAgent?: string | null;
    referrer?: string | null;
  }): Promise<void> {
    await prisma.productView.create({
      data: {
        productId: data.productId,
        viewerIp: data.viewerIp,
        userAgent: data.userAgent,
        referrer: data.referrer,
      },
    });
  }

  async getProductViewCount(productId: string, startDate?: Date, endDate?: Date): Promise<number> {
    return prisma.productView.count({
      where: {
        productId,
        ...(startDate && endDate
          ? { viewedAt: { gte: startDate, lte: endDate } }
          : {}),
      },
    });
  }

  async getProductViews(productId: string, page = 1, limit = 20, startDate?: Date, endDate?: Date) {
    const skip = (page - 1) * limit;

    const where = {
      productId,
      ...(startDate && endDate
        ? { viewedAt: { gte: startDate, lte: endDate } }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.productView.findMany({
        where,
        orderBy: { viewedAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          viewerIp: true,
          referrer: true,
          viewedAt: true,
        },
      }),
      prisma.productView.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============ User Analytics ============

  async getUserAnalytics(userId: string, startDate?: Date, endDate?: Date) {
    const dateFilter = startDate && endDate
      ? { gte: startDate, lte: endDate }
      : undefined;

    // Parallel queries for better performance
    const [
      totalProducts,
      completedOrdersAgg,
      totalOrdersCount,
      affiliateConversions,
      totalCustomers,
      totalViews,
    ] = await Promise.all([
      // Get product counts
      prisma.product.count({ where: { userId } }),

      // Get completed orders count
      prisma.order.aggregate({
        where: {
          product: { userId },
          status: "COMPLETED",
          ...(dateFilter && { createdAt: dateFilter }),
        },
        _count: true,
      }),

      // Get total orders count
      prisma.order.count({
        where: {
          product: { userId },
          ...(dateFilter && { createdAt: dateFilter }),
        },
      }),

      // Get affiliate stats
      prisma.affiliateConversion.count({
        where: { ownerUserId: userId },
      }),

      // Get customer count
      prisma.customer.count({
        where: { ownerUserId: userId },
      }),

      // Get conversion rate (views to orders)
      prisma.productView.count({
        where: { product: { userId } },
      }),
    ]);

    // Get completed orders for revenue calculation
    const completedOrders = await prisma.order.findMany({
      where: {
        product: { userId },
        status: "COMPLETED",
        ...(dateFilter && { createdAt: dateFilter }),
      },
      include: {
        product: { select: { price: true }, include: { settings: { select: { promoPrice: true } } } },
      },
    });

    const totalRevenue = completedOrders.reduce((sum, o) => {
      return sum + (o.product.settings?.promoPrice || o.product.price);
    }, 0);

    const completedCount = completedOrdersAgg._count;
    const conversionRate = totalViews > 0 ? (completedCount / totalViews) * 100 : 0;

    return {
      totalProducts,
      totalOrders: totalOrdersCount,
      completedOrders: completedCount,
      totalRevenue,
      affiliateConversions,
      totalCustomers,
      totalViews,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  }

  async getRevenueByPeriod(userId: string, period: "day" | "week" | "month" = "day", days = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await prisma.order.findMany({
      where: {
        product: { userId },
        status: "COMPLETED",
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        product: {
          select: { price: true },
          include: { settings: { select: { promoPrice: true } } },
        },
      },
    });

    // Group by period
    const revenueByPeriod: Record<string, number> = {};

    orders.forEach(order => {
      let key: string;
      const date = new Date(order.createdAt);

      switch (period) {
        case "day":
          key = date.toISOString().split("T")[0];
          break;
        case "week":
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split("T")[0];
          break;
        case "month":
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          break;
        default:
          key = date.toISOString().split("T")[0];
      }

      const price = order.product.settings?.promoPrice || order.product.price;
      revenueByPeriod[key] = (revenueByPeriod[key] || 0) + price;
    });

    // Fill in missing dates with 0
    const result: { date: string; revenue: number }[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      let key: string;
      const date = new Date(current);

      switch (period) {
        case "day":
          key = date.toISOString().split("T")[0];
          current.setDate(current.getDate() + 1);
          break;
        case "week":
          key = date.toISOString().split("T")[0];
          current.setDate(current.getDate() + 7);
          break;
        case "month":
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          current.setMonth(current.getMonth() + 1);
          break;
        default:
          key = date.toISOString().split("T")[0];
          current.setDate(current.getDate() + 1);
      }

      result.push({
        date: key,
        revenue: revenueByPeriod[key] || 0,
      });
    }

    return result;
  }

  // ============ Email Campaign Stats ============

  async getEmailCampaignStats(userId: string) {
    const campaigns = await prisma.emailCampaign.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        sentCount: true,
        deliveredCount: true,
        openCount: true,
        clickCount: true,
        status: true,
        createdAt: true,
      },
    });

    const totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
    const totalOpens = campaigns.reduce((sum, c) => sum + c.openCount, 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clickCount, 0);

    return {
      totalCampaigns: campaigns.length,
      totalSent,
      totalOpens,
      totalClicks,
      openRate: totalSent > 0 ? Math.round((totalOpens / totalSent) * 10000) / 100 : 0,
      clickRate: totalSent > 0 ? Math.round((totalClicks / totalSent) * 10000) / 100 : 0,
      campaigns,
    };
  }

  async findAll(options?: {
    where?: Prisma.ProductViewWhereInput;
    page?: number;
    limit?: number;
  }) {
    const { where, page = 1, limit = 20 } = options || {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.productView.findMany({
        where,
        orderBy: { viewedAt: "desc" },
        skip,
        take: limit,
        select: SELECT_PRODUCT_VIEW_BASIC,
      }),
      prisma.productView.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const analyticsRepository = new AnalyticsRepository();