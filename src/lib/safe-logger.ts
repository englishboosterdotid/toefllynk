/**
 * Safe Logging Utilities
 * Prevents sensitive data from being logged to console
 */

type LogLevel = "debug" | "info" | "warn" | "error";

// Sensitive field patterns to redact
const SENSITIVE_PATTERNS = [
  "password",
  "token",
  "secret",
  "apiKey",
  "api_key",
  "authorization",
  "bearer",
  "credential",
  "creditCard",
  "cardNumber",
  "cvv",
  "ssn",
  "accessToken",
  "refreshToken",
  "privateKey",
  "midtransServerKey",
  "midtrans_server_key",
  "serverKey",
  "clientKey",
  "jwtSecret",
  "jwt_secret",
  "databaseUrl",
  "dbUrl",
  "REDIS_URL",
  "AWS_SECRET",
  "STRIPE_KEY",
];

/**
 * Recursively sanitize an object by redacting sensitive fields
 */
export function sanitizeObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    // Check if string contains sensitive patterns
    for (const pattern of SENSITIVE_PATTERNS) {
      if (obj.toLowerCase().includes(pattern.toLowerCase())) {
        return "[REDACTED]";
      }
    }
    return obj;
  }

  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();

    // Check if key matches sensitive patterns
    const isSensitive = SENSITIVE_PATTERNS.some(
      (p) => lowerKey.includes(p.toLowerCase()) || lowerKey === p.toLowerCase()
    );

    if (isSensitive) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Extract safe error info from an error object
 */
export function getSafeErrorInfo(error: unknown): { message: string; code?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: (error as any).code,
    };
  }

  if (typeof error === "string") {
    return { message: error };
  }

  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;
    return {
      message: String(err.message || err.error || "Unknown error"),
      code: String(err.code || ""),
    };
  }

  return { message: "Unknown error type" };
}

/**
 * Safe console logger that sanitizes arguments
 */
class SafeLogger {
  private log(level: LogLevel, prefix: string, args: unknown[]) {
    const sanitized = args.map((arg) => {
      if (arg instanceof Error) {
        return `[${arg.name}] ${arg.message}`;
      }
      if (typeof arg === "object" && arg !== null) {
        return sanitizeObject(arg);
      }
      return arg;
    });

    const timestamp = new Date().toISOString();
    const logFn = console[level] || console.log;
    logFn(`[${timestamp}] ${prefix}`, ...sanitized);
  }

  debug(prefix: string, ...args: unknown[]) {
    this.log("debug", prefix, args);
  }

  info(prefix: string, ...args: unknown[]) {
    this.log("info", prefix, args);
  }

  warn(prefix: string, ...args: unknown[]) {
    this.log("warn", prefix, args);
  }

  error(prefix: string, ...args: unknown[]) {
    this.log("error", prefix, args);
  }
}

export const safeLogger = new SafeLogger();

/**
 * Format log entry as JSON for structured logging
 */
export function formatLogEntry(
  level: LogLevel,
  service: string,
  message: string,
  data?: Record<string, unknown>
): string {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service,
    message,
    ...(data && { data: sanitizeObject(data) }),
  };
  return JSON.stringify(entry);
}
