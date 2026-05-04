/**
 * Simple in-memory cache for API responses
 * For production, consider Redis or similar
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number = 60000): void {
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

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache stats
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
export const cache = new SimpleCache();

// Cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}

// Helper for cached fetch
export async function cachedFetch<T>(
  url: string,
  options?: {
    ttl?: number;
    key?: string;
  }
): Promise<T> {
  const cacheKey = options?.key || url;
  const ttl = options?.ttl || 60000;

  // Try cache first
  const cached = cache.get<T>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch fresh data
  const res = await fetch(url);
  const data = await res.json();

  // Store in cache
  cache.set(cacheKey, data, ttl);

  return data;
}

// Cache keys for common endpoints
export const CacheKeys = {
  LEADERBOARD: "/api/leaderboard",
  ANALYTICS: "/api/admin/analytics",
  PRODUCTS: "/api/products",
  QUESTIONS: "/api/admin/questions",
  EXAM_MONITORING: "/api/admin/exam-monitoring",
} as const;
