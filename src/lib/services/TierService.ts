/**
 * Tier Service Provider
 * Centralized tier management service with clean API
 */

import prisma from "@/lib/prisma";
import { userRepository, productRepository } from "@/lib/repositories";
import { SellerTier } from "@/generated/prisma/enums";

// ============================================
// TIER CONFIGURATION (3-Tier Structure)
// ============================================

export const TIER_CONFIG: Record<string, TierConfig> = {
  FREE: {
    name: "Coba",
    displayName: "Coba",
    description: "Gratis untuk memulai",
    platformFee: 10,
    withdrawalFee: 5,
    minimumWithdrawal: 100000, // Rp 100.000
    maxProducts: 3,
    maxMicrositeProducts: 3,
    features: [
      "3 Produk untuk dijual",
      "3 Produk di microsite",
      "Affiliate System",
      "Midtrans Payment",
      "Basic Analytics",
    ],
    isUnlimited: false,
    hasCustomCertificate: false,
    hasPromoCodes: false,
    hasCustomDomain: false,
    customThemeLevel: 0,
    hasFeaturedProducts: false,
    hasCustomFooterHeader: false,
    hasRemoveLynkLogo: false,
    customerDatabaseLimit: 50,
    hasExportCustomer: false,
    emailMarketingLimit: 100,
    hasAPIAccess: false,
    hasWebhook: false,
    analyticsLevel: "basic",
    supportLevel: "community",
    hasWhiteLabel: false,
  },
  PRO: {
    name: "Berkembang",
    displayName: "Berkembang",
    description: "Untuk growing business",
    platformFee: 5,
    withdrawalFee: 2,
    minimumWithdrawal: 50000, // Rp 50.000
    maxProducts: -1,
    maxMicrositeProducts: 15,
    features: [
      "Unlimited Produk untuk dijual",
      "15 Produk di microsite",
      "Affiliate System",
      "Midtrans Payment",
      "Full Analytics",
      "Custom Certificate",
      "Promo/Discount Code",
      "Custom Domain",
      "Basic Theme Customization",
      "Featured Products",
      "Customer Database (500)",
      "Export Customer Data",
      "Email Marketing (1.000/bulan)",
      "API Access",
    ],
    isUnlimited: true,
    hasCustomCertificate: true,
    hasPromoCodes: true,
    hasCustomDomain: true,
    customThemeLevel: 1,
    hasFeaturedProducts: true,
    hasCustomFooterHeader: false,
    hasRemoveLynkLogo: false,
    customerDatabaseLimit: 500,
    hasExportCustomer: true,
    emailMarketingLimit: 1000,
    hasAPIAccess: true,
    hasWebhook: false,
    analyticsLevel: "full",
    supportLevel: "email",
    hasWhiteLabel: false,
  },
  BUSINESS: {
    name: "Bisnis",
    displayName: "Bisnis",
    description: "Untuk scale besar",
    platformFee: 3,
    withdrawalFee: 0,
    minimumWithdrawal: 25000, // Rp 25.000
    maxProducts: -1,
    maxMicrositeProducts: -1,
    features: [
      "Unlimited Produk untuk dijual",
      "Unlimited Produk di microsite",
      "Affiliate System",
      "Midtrans Payment",
      "Advanced Analytics",
      "Custom Certificate",
      "Promo/Discount Code",
      "Custom Domain",
      "Full Theme Customization",
      "Custom Footer/Header",
      "Remove Lynk Logo",
      "Customer Database (Unlimited)",
      "Export Customer Data",
      "Email Marketing (10.000/bulan)",
      "API Access",
      "Webhook Integration",
    ],
    isUnlimited: true,
    hasCustomCertificate: true,
    hasPromoCodes: true,
    hasCustomDomain: true,
    customThemeLevel: 2,
    hasFeaturedProducts: true,
    hasCustomFooterHeader: true,
    hasRemoveLynkLogo: true,
    customerDatabaseLimit: -1,
    hasExportCustomer: true,
    emailMarketingLimit: 10000,
    hasAPIAccess: true,
    hasWebhook: true,
    analyticsLevel: "advanced",
    supportLevel: "priority",
    hasWhiteLabel: true,
  },
};

export interface TierConfig {
  name: string;
  displayName: string;
  description: string;
  platformFee: number;
  withdrawalFee: number;
  minimumWithdrawal: number;
  maxProducts: number;
  maxMicrositeProducts: number;
  features: string[];
  isUnlimited: boolean;
  hasCustomCertificate: boolean;
  hasPromoCodes: boolean;
  hasCustomDomain: boolean;
  customThemeLevel: number;
  hasFeaturedProducts: boolean;
  hasCustomFooterHeader: boolean;
  hasRemoveLynkLogo: boolean;
  customerDatabaseLimit: number;
  hasExportCustomer: boolean;
  emailMarketingLimit: number;
  hasAPIAccess: boolean;
  hasWebhook: boolean;
  analyticsLevel: "basic" | "full" | "advanced";
  supportLevel: "community" | "email" | "priority";
  hasWhiteLabel: boolean;
}

export const TIER_ORDER: SellerTier[] = ["FREE", "PRO", "BUSINESS"];
export const GRACE_PERIOD_DAYS = 7;

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    tier: "FREE",
    name: "Coba",
    displayName: "Coba",
    price: 0,
    displayPrice: 0,
    periodDays: 0,
    description: "Gratis untuk memulai",
    features: TIER_CONFIG.FREE.features,
    cta: "Mulai Gratis",
  },
  {
    tier: "PRO",
    name: "Berkembang",
    displayName: "Berkembang",
    price: 79000,
    displayPrice: 79000,
    periodDays: 30,
    description: "Untuk growing business",
    features: TIER_CONFIG.PRO.features,
    cta: "Pilih Berkembang",
    popular: true,
  },
  {
    tier: "BUSINESS",
    name: "Bisnis",
    displayName: "Bisnis",
    price: 199000,
    displayPrice: 199000,
    periodDays: 30,
    description: "Untuk scale besar",
    features: TIER_CONFIG.BUSINESS.features,
    cta: "Pilih Bisnis",
  },
];

export interface SubscriptionPlan {
  tier: SellerTier;
  name: string;
  displayName: string;
  price: number;
  displayPrice: number;
  periodDays: number;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

// ============================================
// TYPES
// ============================================

export interface ProductLimitResult {
  canCreate: boolean;
  productCount: number;
  maxProducts: number;
  maxMicrositeProducts: number;
  isUnlimited: boolean;
  currentTier: SellerTier;
  effectiveFeeRate: number;
}

export interface MicrositeProductLimitResult {
  canShow: boolean;
  visibleCount: number;
  maxVisible: number;
  isUnlimited: boolean;
  currentTier: SellerTier;
}

export interface FeeCalculation {
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
}

export interface TierChangeResult {
  success: boolean;
  oldTier: SellerTier | null;
  newTier: SellerTier;
  message?: string;
}

export interface TierChangeLogInput {
  userId: string;
  oldTier: SellerTier | null;
  newTier: SellerTier;
  changedBy: string;
  reason?: string;
  feeOverride?: number | null;
}

export interface UserTierInfo {
  tier: SellerTier;
  tierConfig: TierConfig;
  effectiveFeeRate: number;
  withdrawalFeeRate: number;
  maxProducts: number;
  maxMicrositeProducts: number;
  isUnlimited: boolean;
  productCount: number;
  micrositeVisibleCount: number;
  productsUsed: number;
  subscriptionStatus: "ACTIVE" | "EXPIRED" | "GRACE_PERIOD" | "NONE";
  subscriptionEnd: Date | null;
  daysUntilExpiry: number | null;
  customFeeRate: number | null;
  canUpgrade: boolean;
  upgradeTo: SellerTier | null;
}

export interface FeatureAccessResult {
  hasAccess: boolean;
  requiredTier?: SellerTier;
  feature?: string;
}

export interface TierUpgradeEmailData {
  tierName: string;
  tierDisplayName: string;
  expiresAt: Date;
  orderId: string;
}

// ============================================
// TIER SERVICE CLASS
// ============================================

class TierServiceClass {
  // ============ STATIC HELPERS ============

  static getConfig(tier: SellerTier): TierConfig {
    return TIER_CONFIG[tier];
  }

  static getLimit(tier: SellerTier): number {
    return TIER_CONFIG[tier].maxProducts;
  }

  static getFee(tier: SellerTier): number {
    return TIER_CONFIG[tier].platformFee;
  }

  static getWithdrawalFee(tier: SellerTier): number {
    return TIER_CONFIG[tier].withdrawalFee;
  }

  static getMinimumWithdrawal(tier: SellerTier): number {
    return TIER_CONFIG[tier].minimumWithdrawal;
  }

  static getMicrositeProductLimit(tier: SellerTier): number {
    return TIER_CONFIG[tier].maxMicrositeProducts;
  }

  static isUnlimited(tier: SellerTier): boolean {
    return TIER_CONFIG[tier].maxProducts === -1;
  }

  static getRank(tier: SellerTier): number {
    return TIER_ORDER.indexOf(tier);
  }

  static isHigherOrEqual(tier1: SellerTier, tier2: SellerTier): boolean {
    return this.getRank(tier1) >= this.getRank(tier2);
  }

  static isHigher(tier1: SellerTier, tier2: SellerTier): boolean {
    return this.getRank(tier1) > this.getRank(tier2);
  }

  static getNextTier(currentTier: SellerTier): SellerTier | null {
    const currentRank = this.getRank(currentTier);
    if (currentRank < TIER_ORDER.length - 1) {
      return TIER_ORDER[currentRank + 1];
    }
    return null;
  }

  static getEffectiveFee(user: { sellerTier: SellerTier; customFeeRate: number | null }): number {
    if (user.customFeeRate !== null && user.customFeeRate !== undefined) {
      return Math.max(0, Math.min(20, user.customFeeRate));
    }
    return this.getFee(user.sellerTier);
  }

  static calculateFee(amount: number, feeRate: number): FeeCalculation {
    const feeAmount = Math.floor(amount * (feeRate / 100));
    const netAmount = amount - feeAmount;
    return { grossAmount: amount, feeAmount, netAmount };
  }

  static isSubscriptionValid(subscriptionEnd: Date | null, tier: SellerTier): boolean {
    if (tier === "FREE") return true;
    if (!subscriptionEnd) return true;

    const now = new Date();
    const gracePeriodEnd = new Date(subscriptionEnd);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

    return now <= gracePeriodEnd;
  }

  static isExpired(subscriptionEnd: Date | null): boolean {
    if (!subscriptionEnd) return false;

    const now = new Date();
    const gracePeriodEnd = new Date(subscriptionEnd);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

    return now > gracePeriodEnd;
  }

  static getDaysUntilExpiry(subscriptionEnd: Date | null): number | null {
    if (!subscriptionEnd) return null;
    const now = new Date();
    const diff = subscriptionEnd.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  static getDaysUntilGracePeriodEnd(subscriptionEnd: Date | null): number | null {
    if (!subscriptionEnd) return null;
    const now = new Date();
    const gracePeriodEnd = new Date(subscriptionEnd);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);
    const diff = gracePeriodEnd.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // ============ INSTANCE METHODS ============

  async checkProductLimit(userId: string): Promise<ProductLimitResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        sellerTier: true,
        customFeeRate: true,
        subscriptionEnd: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const productCount = await productRepository.countByUser(userId);

    const tierConfig = TierServiceClass.getConfig(user.sellerTier);
    const maxProducts = tierConfig.maxProducts;
    const maxMicrositeProducts = tierConfig.maxMicrositeProducts;
    const isUnlimited = tierConfig.isUnlimited;
    const effectiveFeeRate = TierServiceClass.getEffectiveFee(user);

    if (!TierServiceClass.isSubscriptionValid(user.subscriptionEnd, user.sellerTier) && user.sellerTier !== "FREE") {
      return {
        canCreate: false,
        productCount,
        maxProducts,
        maxMicrositeProducts,
        isUnlimited,
        currentTier: user.sellerTier,
        effectiveFeeRate,
      };
    }

    if (!isUnlimited && productCount >= maxProducts) {
      return {
        canCreate: false,
        productCount,
        maxProducts,
        maxMicrositeProducts,
        isUnlimited,
        currentTier: user.sellerTier,
        effectiveFeeRate,
      };
    }

    return {
      canCreate: true,
      productCount,
      maxProducts,
      maxMicrositeProducts,
      isUnlimited,
      currentTier: user.sellerTier,
      effectiveFeeRate,
    };
  }

  async checkMicrositeProductLimit(userId: string): Promise<MicrositeProductLimitResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        sellerTier: true,
        subscriptionEnd: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const tierConfig = TierServiceClass.getConfig(user.sellerTier);
    const maxMicrositeProducts = tierConfig.maxMicrositeProducts;
    const isUnlimited = maxMicrositeProducts === -1;

    const visibleCount = await productRepository.countVisibleOnMicrosite(userId);

    if (!isUnlimited && visibleCount >= maxMicrositeProducts) {
      return {
        canShow: false,
        visibleCount,
        maxVisible: maxMicrositeProducts,
        isUnlimited,
        currentTier: user.sellerTier,
      };
    }

    return {
      canShow: true,
      visibleCount,
      maxVisible: maxMicrositeProducts,
      isUnlimited,
      currentTier: user.sellerTier,
    };
  }

  async changeTier(
    userId: string,
    newTier: SellerTier,
    changedBy: string,
    options?: {
      reason?: string;
      feeOverride?: number | null;
      extendDays?: number;
    }
  ): Promise<TierChangeResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        sellerTier: true,
        subscriptionEnd: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const oldTier = user.sellerTier;

    const updateData: Record<string, unknown> = {
      sellerTier: newTier,
      tierChangedAt: new Date(),
      tierChangeReason: options?.reason || null,
    };

    if (options?.feeOverride !== undefined) {
      if (options.feeOverride !== null && (options.feeOverride < 0 || options.feeOverride > 20)) {
        throw new Error("Fee override must be between 0 and 20");
      }
      updateData.customFeeRate = options.feeOverride;
    }

    if (options?.extendDays) {
      const currentEnd = user.subscriptionEnd || new Date();
      const newEnd = new Date(currentEnd);
      newEnd.setDate(newEnd.getDate() + options.extendDays);
      updateData.subscriptionEnd = newEnd;

      if (!user.subscriptionEnd) {
        updateData.subscriptionStart = new Date();
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    await this.logTierChange({
      userId,
      oldTier,
      newTier,
      changedBy,
      reason: options?.reason,
      feeOverride: options?.feeOverride,
    });

    return {
      success: true,
      oldTier,
      newTier,
      message: `Tier changed from ${oldTier} to ${newTier}`,
    };
  }

  async logTierChange(input: TierChangeLogInput): Promise<void> {
    await prisma.sellerTierLog.create({
      data: {
        userId: input.userId,
        oldTier: input.oldTier,
        newTier: input.newTier,
        changedBy: input.changedBy,
        reason: input.reason || null,
        feeOverride: input.feeOverride ?? null,
      },
    });
  }

  async getUserTierInfo(userId: string): Promise<UserTierInfo> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        sellerTier: true,
        customFeeRate: true,
        subscriptionEnd: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const productCount = await productRepository.countByUser(userId);
    const micrositeVisibleCount = await productRepository.countVisibleOnMicrosite(userId);

    const tierConfig = TierServiceClass.getConfig(user.sellerTier);
    const effectiveFeeRate = TierServiceClass.getEffectiveFee(user);
    const isExpired = TierServiceClass.isExpired(user.subscriptionEnd);
    const daysUntilExpiry = TierServiceClass.getDaysUntilExpiry(user.subscriptionEnd);

    let subscriptionStatus: "ACTIVE" | "EXPIRED" | "GRACE_PERIOD" | "NONE" = "NONE";
    if (user.sellerTier === "FREE") {
      subscriptionStatus = "NONE";
    } else if (isExpired) {
      subscriptionStatus = "EXPIRED";
    } else if (user.subscriptionEnd) {
      const daysLeft = TierServiceClass.getDaysUntilExpiry(user.subscriptionEnd);
      if (daysLeft !== null && daysLeft <= GRACE_PERIOD_DAYS) {
        subscriptionStatus = "GRACE_PERIOD";
      } else {
        subscriptionStatus = "ACTIVE";
      }
    }

    const upgradeTo = TierServiceClass.getNextTier(user.sellerTier);

    return {
      tier: user.sellerTier,
      tierConfig,
      effectiveFeeRate,
      withdrawalFeeRate: tierConfig.withdrawalFee,
      maxProducts: tierConfig.maxProducts,
      maxMicrositeProducts: tierConfig.maxMicrositeProducts,
      isUnlimited: tierConfig.isUnlimited,
      productCount,
      micrositeVisibleCount,
      productsUsed: productCount,
      subscriptionStatus,
      subscriptionEnd: user.subscriptionEnd,
      daysUntilExpiry,
      customFeeRate: user.customFeeRate,
      canUpgrade: upgradeTo !== null,
      upgradeTo,
    };
  }

  // ============ FEATURE ACCESS HELPERS ============

  async checkFeatureAccess(
    userId: string,
    feature: keyof TierConfig
  ): Promise<FeatureAccessResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { sellerTier: true },
    });

    if (!user) {
      return { hasAccess: false };
    }

    const tierConfig = TierServiceClass.getConfig(user.sellerTier);
    const featureValue = tierConfig[feature];

    if (typeof featureValue === "boolean") {
      return { hasAccess: featureValue as boolean };
    }

    return { hasAccess: false };
  }

  async requireFeatureAccess(
    userId: string,
    feature: keyof TierConfig,
    errorMessage?: string
  ): Promise<void> {
    const result = await this.checkFeatureAccess(userId, feature);
    if (!result.hasAccess) {
      throw new Error(errorMessage || `FEATURE_NOT_ALLOWED:${feature}`);
    }
  }

  async activateSubscription(orderId: string, transactionId?: string): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: orderId },
    });

    if (!subscription) {
      console.log(`[TierService] Subscription ${orderId} not found`);
      return;
    }

    if (subscription.status === "ACTIVE") {
      console.log(`[TierService] Subscription ${orderId} already active`);
      return;
    }

    const plan = SUBSCRIPTION_PLANS.find((p) => p.tier === subscription.tier);
    const periodDays = plan?.periodDays || 30;

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + periodDays);

    // Update subscription with transaction ID
    await prisma.subscription.update({
      where: { id: orderId },
      data: {
        status: "ACTIVE",
        startedAt: now,
        expiresAt,
        transactionId: transactionId || null,
      },
    });

    await this.changeTier(
      subscription.userId,
      subscription.tier,
      "SYSTEM",
      {
        reason: `Upgrade via payment ${orderId}`,
        extendDays: periodDays,
      }
    );

    const user = await prisma.user.findUnique({
      where: { id: subscription.userId },
      select: { email: true },
    });

    if (user) {
      this.sendUpgradeEmail(user.email, {
        tierName: plan?.name || subscription.tier,
        tierDisplayName: plan?.displayName || subscription.tier,
        expiresAt,
        orderId,
      }).catch((err) => {
        console.error("[TierService] Failed to send email:", err);
      });
    }
  }

  async handleUpgradeNotification(payload: Record<string, unknown>): Promise<void> {
    const orderId = payload.order_id as string;
    const transactionStatus = payload.transaction_status as string;
    const statusCode = payload.status_code as string;
    const transactionId = payload.transaction_id as string | undefined;

    console.log(`[TierService] Processing upgrade: ${orderId}, Status: ${transactionStatus}, TransactionID: ${transactionId}`);

    if (statusCode !== "200" && statusCode !== "201") {
      return;
    }

    if (transactionStatus !== "settlement" && transactionStatus !== "capture") {
      return;
    }

    await this.activateSubscription(orderId, transactionId);
  }

  private async sendUpgradeEmail(email: string, data: TierUpgradeEmailData): Promise<void> {
    const { sendEmail } = await import("@/lib/email");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    await sendEmail({
      to: email,
      subject: `Selamat! Anda Berhasil Upgrade ke ${data.tierDisplayName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1e40af;">Selamat! 🎉</h1>
          <p>Anda berhasil upgrade ke <strong>${data.tierDisplayName}</strong>.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Detail:</strong></p>
            <p>Tier: ${data.tierDisplayName}</p>
            <p>Aktif sampai: ${data.expiresAt.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
            <p>Order ID: ${data.orderId}</p>
          </div>
          <p>
            <a href="${appUrl}/user/subscription" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Lihat Detail Langganan
            </a>
          </p>
        </div>
      `,
    });
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const TierService = new TierServiceClass();

// Re-export static class for static method access
export { TierServiceClass };