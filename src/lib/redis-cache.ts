/**
 * Redis-backed cache with fallback to in-memory cache
 * For production use with Redis, falls back to in-memory for development
 */

import Redis from "ioredis";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Redis connection singleton
let redis: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redis) return redis;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 3000);
      },
      lazyConnect: true,
    });

    redis.on("error", (err) => {
      console.error("[Redis] Connection error:", err.message);
      redis = null;
    });

    return redis;
  } catch (err) {
    console.error("[Redis] Failed to create client:", err);
    return null;
  }
}

// In-memory fallback cache
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  async deletePattern(pattern: string): Promise<void> {
    // For memory cache, we can't do pattern matching
    // Just clear all if pattern is wildcard
    if (pattern.includes("*")) {
      this.clear();
    }
  }

  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

class RedisCache {
  private memory = new MemoryCache();
  private useRedis = false;
  private redisPrefix = "toefllynk:";

  constructor() {
    // Try to connect to Redis
    const client = getRedisClient();
    if (client) {
      this.useRedis = true;
      console.log("[Cache] Using Redis backend");
    } else {
      console.log("[Cache] Using in-memory fallback");
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.redisPrefix + key;

    if (this.useRedis) {
      try {
        const client = getRedisClient();
        if (!client) {
          return this.memory.get<T>(key);
        }

        const data = await client.get(fullKey);
        if (data) {
          const parsed = JSON.parse(data);
          // Check TTL from stored data
          if (Date.now() > parsed.expiresAt) {
            await client.del(fullKey);
            return null;
          }
          return parsed.data as T;
        }
      } catch (err) {
        console.error("[Redis] Get error:", err);
        return this.memory.get<T>(key);
      }
    }

    return this.memory.get<T>(key);
  }

  async set<T>(key: string, data: T, ttlMs: number = 60000): Promise<void> {
    const fullKey = this.redisPrefix + key;
    const expiresAt = Date.now() + ttlMs;

    // Always set in memory as backup
    this.memory.set(key, data, ttlMs);

    if (this.useRedis) {
      try {
        const client = getRedisClient();
        if (!client) return;

        await client.setex(
          fullKey,
          Math.floor(ttlMs / 1000),
          JSON.stringify({ data, expiresAt })
        );
      } catch (err) {
        console.error("[Redis] Set error:", err);
      }
    }
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.redisPrefix + key;
    this.memory.delete(key);

    if (this.useRedis) {
      try {
        const client = getRedisClient();
        if (!client) return;
        await client.del(fullKey);
      } catch (err) {
        console.error("[Redis] Delete error:", err);
      }
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    const fullPattern = this.redisPrefix + pattern;

    // Clear memory cache matching pattern
    if (pattern.includes("*")) {
      // Memory cache - clear all for now
      this.memory.clear();
    }

    if (this.useRedis) {
      try {
        const client = getRedisClient();
        if (!client) return;

        const keys = await client.keys(fullPattern);
        if (keys.length > 0) {
          await client.del(...keys);
        }
      } catch (err) {
        console.error("[Redis] DeletePattern error:", err);
      }
    }
  }

  async clear(): Promise<void> {
    this.memory.clear();

    if (this.useRedis) {
      try {
        const client = getRedisClient();
        if (!client) return;

        const keys = await client.keys(this.redisPrefix + "*");
        if (keys.length > 0) {
          await client.del(...keys);
        }
      } catch (err) {
        console.error("[Redis] Clear error:", err);
      }
    }
  }

  async stats(): Promise<{ size: number; keys: string[]; backend: string }> {
    const memoryStats = this.memory.stats();

    if (this.useRedis) {
      try {
        const client = getRedisClient();
        if (client) {
          const keys = await client.keys(this.redisPrefix + "*");
          return {
            size: keys.length,
            keys: keys.map((k) => k.replace(this.redisPrefix, "")),
            backend: "redis",
          };
        }
      } catch (err) {
        console.error("[Redis] Stats error:", err);
      }
    }

    return {
      ...memoryStats,
      backend: "memory",
    };
  }

  // Sync version for backward compatibility
  getSync<T>(key: string): T | null {
    return this.memory.get<T>(key);
  }

  setSync<T>(key: string, data: T, ttlMs: number = 60000): void {
    this.memory.set(key, data, ttlMs);

    // Async set to Redis (fire and forget)
    if (this.useRedis) {
      this.set(key, data, ttlMs).catch(() => {});
    }
  }

  deleteSync(key: string): void {
    this.memory.delete(key);
  }

  clearSync(): void {
    this.memory.clear();
  }
}

// Singleton instance
export const redisCache = new RedisCache();

// Re-export for backward compatibility
export const cache = {
  get: <T>(key: string): T | null => redisCache.getSync<T>(key),
  set: <T>(key: string, data: T, ttlMs?: number): void =>
    redisCache.setSync(key, data, ttlMs),
  delete: (key: string): void => {
    redisCache.deleteSync(key);
    redisCache.delete(key).catch(() => {});
  },
  clear: (): void => {
    redisCache.clearSync();
    redisCache.clear().catch(() => {});
  },
  deletePattern: (pattern: string): void => {
    redisCache.clearSync(); // Simplified for memory
    redisCache.deletePattern(pattern).catch(() => {});
  },
};

// Cache keys
export const CacheKeys = {
  LEADERBOARD: "leaderboard",
  ANALYTICS: "admin:analytics",
  PRODUCTS: "products",
  QUESTIONS: "admin:questions",
  EXAM_MONITORING: "admin:exam-monitoring",
  SUBSCRIPTION_PLANS: "subscription:plans",
} as const;

// Helper for cache invalidation by tag
export async function invalidateByTag(tag: string): Promise<void> {
  await redisCache.deletePattern(`*:${tag}:*`);
}

// Helper for cache invalidation by prefix
export async function invalidateByPrefix(prefix: string): Promise<void> {
  await redisCache.deletePattern(`${prefix}:*`);
}