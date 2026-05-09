// APP_URL can be used client-side
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Server-only secrets - DO NOT import these in client components
// Use process.env.JWT_SECRET directly in server files
const _JWT_SECRET = process.env.JWT_SECRET;

export const PLATFORM_FEE_PERCENT = 5;

// Reserved usernames that conflict with app routes
export const RESERVED_USERNAMES = [
  "admin",
  "user",
  "users",
  "student",
  "students",
  "api",
  "auth",
  "login",
  "logout",
  "register",
  "signup",
  "dashboard",
  "settings",
  "profile",
  "products",
  "orders",
  "withdrawal",
  "withdrawals",
  "affiliate",
  "subscription",
  "seller",
  "sellers",
  "microsite",
  "www",
  "app",
  "help",
  "support",
  "about",
  "contact",
  "pricing",
  "blog",
  "news",
  "oauth",
  "callback",
  "webhook",
  "webhooks",
  "midtrans",
  "xendit",
];

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.includes(username.toLowerCase());
}