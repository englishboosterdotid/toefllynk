/**
 * Authentication helper functions
 * Wraps session functions for cleaner API routes
 */

import { cookies } from "next/headers";
import { getSession } from "@/lib/session";

export interface AuthUser {
  id: string;
  userId: string;
  email: string;
  username: string;
  name: string | null;
  role: string;
}

/**
 * Get user from cookie - returns user object with id property
 * Used by API routes to get authenticated user
 */
export async function getUserFromCookie(cookieStore: Awaited<ReturnType<typeof cookies>>): Promise<AuthUser | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return {
    id: session.userId,
    userId: session.userId,
    email: session.email,
    username: session.username,
    name: session.name || null,
    role: session.role || "USER",
  };
}

/**
 * Get current authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  return getUserFromCookie(cookieStore);
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}