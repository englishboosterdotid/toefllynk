/**
 * Rate limiting with Redis backend and memory fallback
 */

import { redisCache } from "./redis-cache";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 10; // Max 10 requests per window
const KEY_PREFIX = "ratelimit:";

interface RateLimitEntry {
  count: number;
  timestamp: number;
}

// In-memory fallback for when Redis is not available
const memoryStore = new Map<string, RateLimitEntry>();

function cleanOldEntries(): void {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  for (const [key, entry] of memoryStore) {
    if (entry.timestamp < windowStart) {
      memoryStore.delete(key);
    }
  }
}

// Periodic cleanup for memory store (every 15 minutes)
setInterval(cleanOldEntries, WINDOW_MS);

export async function rateLimit(req: Request): Promise<{ success: boolean; message?: string }> {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";
  const key = KEY_PREFIX + ip;

  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  try {
    // Try Redis first
    const cached = await redisCache.get<RateLimitEntry>(key);

    if (cached) {
      // Check if window has expired
      if (cached.timestamp < windowStart) {
        // New window - reset count
        await redisCache.set(key, { count: 1, timestamp: now }, WINDOW_MS);
        return { success: true };
      }

      // Within window - check count
      if (cached.count >= MAX_REQUESTS) {
        return { success: false, message: "Too many requests. Please try again later." };
      }

      // Increment count
      await redisCache.set(key, { count: cached.count + 1, timestamp: cached.timestamp }, WINDOW_MS);
      return { success: true };
    }

    // No existing entry - create new
    await redisCache.set(key, { count: 1, timestamp: now }, WINDOW_MS);
    return { success: true };

  } catch {
    // Fallback to memory store
    const existing = memoryStore.get(key);

    if (existing) {
      if (existing.timestamp < windowStart) {
        memoryStore.set(key, { count: 1, timestamp: now });
        return { success: true };
      }

      if (existing.count >= MAX_REQUESTS) {
        return { success: false, message: "Too many requests. Please try again later." };
      }

      memoryStore.set(key, { count: existing.count + 1, timestamp: existing.timestamp });
      return { success: true };
    }

    memoryStore.set(key, { count: 1, timestamp: now });
    return { success: true };
  }
}

// Stats for monitoring
export async function getRateLimitStats(): Promise<{ store: string; entries: number }> {
  const stats = await redisCache.stats();
  return {
    store: stats.backend,
    entries: stats.size,
  };
}
