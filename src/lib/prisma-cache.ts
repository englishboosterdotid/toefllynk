/**
 * Prisma Query Caching Layer
 * Wraps Prisma queries with Redis/in-memory caching for performance
 */

import prisma from "./prisma";
import { redisCache, CacheKeys } from "./redis-cache";

// Cache TTLs in milliseconds
const TTL = {
  SHORT: 60 * 1000,       // 1 minute
  MEDIUM: 5 * 60 * 1000,   // 5 minutes
  LONG: 30 * 60 * 1000,   // 30 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
};

// Helper type for cached functions
type CachedFn<T> = () => Promise<T>;

/**
 * Execute a function with caching
 */
async function withCache<T>(
  cacheKey: string,
  fn: CachedFn<T>,
  ttlMs: number = TTL.MEDIUM
): Promise<T> {
  // Try cache first
  const cached = await redisCache.get<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Execute query
  const result = await fn();

  // Cache result
  await redisCache.set(cacheKey, result, ttlMs);

  return result;
}

/**
 * User query caching
 */
export const cachedUsers = {
  async getUserById(id: string, ttlMs: number = TTL.MEDIUM) {
    return withCache(`user:${id}`, () =>
      prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          createdAt: true,
          profile: {
            select: {
              sellerTier: true,
              customFeeRate: true,
            },
          },
        },
      }),
      ttlMs
    );
  },

  async getSellers(tier?: string, ttlMs: number = TTL.SHORT) {
    const cacheKey = tier ? `sellers:tier:${tier}` : "sellers:all";
    return withCache(cacheKey, () =>
      prisma.user.findMany({
        where: {
          profile: tier ? { sellerTier: tier as any } : undefined,
        },
        select: {
          id: true,
          username: true,
          name: true,
          createdAt: true,
          profile: {
            select: { sellerTier: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      ttlMs
    );
  },
};

/**
 * Product query caching
 */
export const cachedProducts = {
  async getProductsByUser(userId: string, ttlMs: number = TTL.SHORT) {
    return withCache(`products:user:${userId}`, () =>
      prisma.product.findMany({
        where: { userId },
        include: { settings: { where: { isArchived: false } } },
        orderBy: { createdAt: "desc" },
      }),
      ttlMs
    );
  },

  async getFeaturedProducts(limit: number = 10, ttlMs: number = TTL.MEDIUM) {
    return withCache(`products:featured:${limit}`, () =>
      prisma.product.findMany({
        where: {
          settings: {
            isArchived: false,
            isVisibleOnMicrosite: true,
          },
        },
        include: {
          settings: true,
          user: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      ttlMs
    );
  },

  async getProductById(id: string, ttlMs: number = TTL.MEDIUM) {
    return withCache(`product:${id}`, () =>
      prisma.product.findUnique({
        where: { id },
        include: {
          settings: true,
          user: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
      }),
      ttlMs
    );
  },
};

/**
 * Analytics query caching
 */
export const cachedAnalytics = {
  async getAdminStats(ttlMs: number = TTL.SHORT) {
    return withCache(CacheKeys.ANALYTICS, async () => {
      const [totalUsers, totalProducts, totalOrders, completedOrders] = await Promise.all([
        prisma.user.count(),
        prisma.product.count(),
        prisma.order.count(),
        prisma.order.count({ where: { status: "COMPLETED" } }),
      ]);

      return {
        totalUsers,
        totalProducts,
        totalOrders,
        completedOrders,
      };
    }, ttlMs);
  },

  async getMonthlyStats(year: number, month: number, ttlMs: number = TTL.SHORT) {
    const cacheKey = `analytics:monthly:${year}:${month}`;
    return withCache(cacheKey, async () => {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const [newOrders, completedOrders] = await Promise.all([
        prisma.order.count({
          where: { createdAt: { gte: startDate, lte: endDate } },
        }),
        prisma.order.count({
          where: {
            status: "COMPLETED",
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
      ]);

      return {
        newOrders,
        completedOrders,
      };
    }, ttlMs);
  },
};

/**
 * Subscription plan caching
 */
export const cachedSubscriptions = {
  async getPlans(ttlMs: number = TTL.LONG) {
    return withCache(CacheKeys.SUBSCRIPTION_PLANS, () =>
      prisma.subscriptionPlan.findMany({
        orderBy: { price: "asc" },
      }),
      ttlMs
    );
  },

  async getUserSubscription(userId: string, ttlMs: number = TTL.SHORT) {
    return withCache(`subscription:user:${userId}`, () =>
      prisma.subscription.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      ttlMs
    );
  },
};

/**
 * Leaderboard caching
 */
export const cachedLeaderboard = {
  async getTopSellers(limit: number = 20, ttlMs: number = TTL.MEDIUM) {
    return withCache(`${CacheKeys.LEADERBOARD}:sellers:${limit}`, () =>
      prisma.user.findMany({
        select: {
          id: true,
          username: true,
          name: true,
          createdAt: true,
          profile: {
            select: { sellerTier: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      ttlMs
    );
  },

  async getTopProducts(limit: number = 20, ttlMs: number = TTL.MEDIUM) {
    return withCache(`${CacheKeys.LEADERBOARD}:products:${limit}`, () =>
      prisma.product.findMany({
        where: {
          settings: {
            isArchived: false,
            isVisibleOnMicrosite: true,
          },
        },
        include: {
          settings: { select: { promoPrice: true } },
          user: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      ttlMs
    );
  },
};

/**
 * Cache invalidation helpers
 */
export async function invalidateUserCache(userId: string) {
  await redisCache.delete(`user:${userId}`);
  await redisCache.delete(`subscription:user:${userId}`);
  await redisCache.deletePattern(`products:user:${userId}*`);
}

export async function invalidateProductCache(productId: string, userId: string) {
  await redisCache.delete(`product:${productId}`);
  await redisCache.delete(`products:user:${userId}`);
  await redisCache.delete("products:featured:10");
  await redisCache.deletePattern(`${CacheKeys.LEADERBOARD}:products*`);
}

export async function invalidateAnalyticsCache() {
  await redisCache.delete(CacheKeys.ANALYTICS);
  await redisCache.deletePattern("analytics:*");
}

export async function invalidateAllCache() {
  await redisCache.clear();
}
