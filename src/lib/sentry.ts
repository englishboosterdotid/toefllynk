/**
 * Sentry Integration for TOEFL Lynk
 *
 * Setup:
 * 1. Create Sentry account at https://sentry.io
 * 2. Create a new project (Next.js)
 * 3. Copy DSN to environment variables
 *
 * Environment Variables:
 *   SENTRY_DSN=https://xxx@sentry.io/xxx
 *   SENTRY_ENVIRONMENT=production
 */

import * as Sentry from "@sentry/nextjs";

// Only initialize in production
if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Environment
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Error sampling
    sampleRate: 1.0,

    // Debug mode (only in development)
    debug: false,

    // Replays for better debugging
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 0.1,

    // Ignore common errors that aren't actionable
    ignoreErrors: [
      "ResizeObserver loop completed with undelivered notifications",
      "Non-Error promise rejection",
      "Hydration Mismatch",
    ],

    // Allowlist forunneling
    tunnel: undefined,

    // Additional context
    beforeSend(event) {
      // Add custom context here
      return event;
    },

    // Breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      // Filter out noisy breadcrumbs
      return breadcrumb;
    },
  });
}

export const captureException = (error: Error, context?: Record<string, any>) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error("[Error]", error, context);
  }
};

export const captureMessage = (message: string, level?: Sentry.SeverityLevel) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  } else {
    console.log("[Message]", message);
  }
};

// API route wrapper with error handling
export async function withSentry<T>(
  handler: () => Promise<T>,
  fallback?: (error: Error) => T
): Promise<T> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof Error) {
      captureException(error, { route: "api" });
    }
    if (fallback) {
      return fallback(error instanceof Error ? error : new Error(String(error)));
    }
    throw error;
  }
}

// Client-side error boundary helper
export function logError(error: Error | unknown, context?: Record<string, any>) {
  if (process.env.NODE_ENV === "production") {
    if (error instanceof Error) {
      Sentry.captureException(error, { extra: context });
    } else {
      Sentry.captureMessage(String(error), "error");
    }
  } else {
    console.error("[Client Error]", error, context);
  }
}

// Performance monitoring helper
export function startTransaction(name: string, op: string = "navigation") {
  // Note: For full transaction support, use @sentry/tracing
  // For now, we just return null as placeholder
  return null;
}