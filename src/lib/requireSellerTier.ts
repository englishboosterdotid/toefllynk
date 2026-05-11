/**
 * Seller Tier Middleware
 * Checks if user meets minimum tier requirements
 * Uses normalized SellerProfile pattern
 */

import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { SellerTier } from "@/generated/prisma/enums";
import { TierServiceClass, TIER_ORDER } from "@/lib/services/TierService";

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

  // Get tier info from SellerProfile
  const profile = await prisma.sellerProfile.findUnique({
    where: { userId: session.userId },
    select: {
      sellerTier: true,
      subscriptionEnd: true,
    },
  });

  const sellerTier = profile?.sellerTier || "FREE";

  // Check if user meets minimum tier
  if (!TierServiceClass.isHigherOrEqual(sellerTier, minTier)) {
    const currentRank = TierServiceClass.getRank(sellerTier);
    const nextTier = TIER_ORDER[currentRank + 1];

    throw new Error(`TIER_REQUIRED:${minTier}:${nextTier || ""}`);
  }

  // Check subscription validity (if enabled)
  if (options?.checkSubscription && sellerTier !== "FREE") {
    const isValid = TierServiceClass.isSubscriptionValid(profile?.subscriptionEnd ?? null, sellerTier);

    if (!isValid) {
      throw new Error("SUBSCRIPTION_EXPIRED");
    }
  }

  return { userId: session.userId, tier: sellerTier };
}

export async function checkTierAccess(
  userId: string,
  minTier: SellerTier
): Promise<TierCheckResult> {
  const profile = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: { sellerTier: true },
  });

  const sellerTier = profile?.sellerTier || "FREE";
  const hasAccess = TierServiceClass.isHigherOrEqual(sellerTier, minTier);

  return {
    success: hasAccess,
    currentTier: sellerTier,
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
  const profile = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: {
      sellerTier: true,
      subscriptionEnd: true,
    },
  });

  const sellerTier = profile?.sellerTier || "FREE";

  if (sellerTier === "FREE") {
    return {
      success: false,
      error: "Upgrade ke PRO atau BUSINESS untuk mengakses fitur ini",
    };
  }

  // Check subscription validity for non-FREE tiers
  const isValid = TierServiceClass.isSubscriptionValid(profile?.subscriptionEnd ?? null, sellerTier);
  if (!isValid) {
    return {
      success: false,
      error: "Langganan Anda sudah expire. Mohon perpanjang untuk melanjutkan.",
    };
  }

  return { success: true, tier: sellerTier };
}
