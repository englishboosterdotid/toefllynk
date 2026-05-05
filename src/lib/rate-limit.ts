const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 10; // Max 10 requests per window

export async function rateLimit(req: Request): Promise<{ success: boolean; message?: string }> {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";

  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const existing = rateLimitMap.get(ip);

  if (existing) {
    if (existing.timestamp < windowStart) {
      rateLimitMap.set(ip, { count: 1, timestamp: now });
      return { success: true };
    }

    if (existing.count >= MAX_REQUESTS) {
      return { success: false, message: "Too many requests. Please try again later." };
    }

    rateLimitMap.set(ip, { count: existing.count + 1, timestamp: existing.timestamp });
    return { success: true };
  }

  rateLimitMap.set(ip, { count: 1, timestamp: now });
  return { success: true };
}

setInterval(() => {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  for (const [ip, data] of rateLimitMap) {
    if (data.timestamp < windowStart) {
      rateLimitMap.delete(ip);
    }
  }
}, WINDOW_MS);
