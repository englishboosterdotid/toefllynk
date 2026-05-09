/**
 * Seller Tier Middleware
 * Checks if user meets minimum tier requirements
 */

import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { SellerTier } from "@/generated/prisma/enums";
import { TierService, TierServiceClass, TIER_ORDER } from "@/lib/services/TierService";

export interface TierCheckResult {
  success: boolean;
  currentTier?: SellerTier;
  requiredTier?: SellerTier;
  error?: string;
}

export async function requireTier(
  minTier: SellerTier,
  options?: {
    checkSubscription?: boolean;
    returnInfo?: boolean;
  }
): Promise<{ userId: string; tier: SellerTier } | void> {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      sellerTier: true,
      subscriptionEnd: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check if user meets minimum tier
  if (!TierServiceClass.isHigherOrEqual(user.sellerTier, minTier)) {
    const currentRank = TierServiceClass.getRank(user.sellerTier);
    const nextTier = TIER_ORDER[currentRank + 1];

    throw new Error(`TIER_REQUIRED:${minTier}:${nextTier || ""}`);
  }

  // Check subscription validity (if enabled)
  if (options?.checkSubscription && user.sellerTier !== "FREE") {
    const isValid = TierServiceClass.isSubscriptionValid(user.subscriptionEnd, user.sellerTier);

    if (!isValid) {
      throw new Error("SUBSCRIPTION_EXPIRED");
    }
  }

  return { userId: session.userId, tier: user.sellerTier };
}

export async function checkTierAccess(
  userId: string,
  minTier: SellerTier
): Promise<TierCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sellerTier: true },
  });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  const hasAccess = TierServiceClass.isHigherOrEqual(user.sellerTier, minTier);

  return {
    success: hasAccess,
    currentTier: user.sellerTier,
    requiredTier: minTier,
    error: hasAccess ? undefined : `Requires ${minTier} tier`,
  };
}

export async function requireFeature(
  feature: "WHITE_LABEL" | "API_ACCESS" | "UNLIMITED_PRODUCTS"
): Promise<void> {
  const requiredTierMap: Record<string, SellerTier> = {
    WHITE_LABEL: "BUSINESS",
    API_ACCESS: "PRO",
    UNLIMITED_PRODUCTS: "PRO",
  };

  const requiredTier = requiredTierMap[feature];
  await requireTier(requiredTier);
}

/**
 * Check if user has active seller status (PRO or BUSINESS tier)
 * Returns result object for API routes
 */
export async function requireActiveSeller(userId: string): Promise<{
  success: boolean;
  tier?: SellerTier;
  error?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      sellerTier: true,
      subscriptionEnd: true,
    },
  });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  if (user.sellerTier === "FREE") {
    return {
      success: false,
      error: "Upgrade ke PRO atau BUSINESS untuk mengakses fitur ini",
    };
  }

  // Check subscription validity for non-FREE tiers
  const isValid = TierServiceClass.isSubscriptionValid(user.subscriptionEnd, user.sellerTier);
  if (!isValid) {
    return {
      success: false,
      error: "Langganan Anda sudah expire. Mohon perpanjang untuk melanjutkan.",
    };
  }

  return { success: true, tier: user.sellerTier };
}
