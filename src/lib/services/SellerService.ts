/**
 * Seller Service
 * Centralized service for seller/seller profile operations
 * Uses normalized schema pattern: SellerProfile, BankAccount
 */

import prisma from "@/lib/prisma";
import { SellerTier } from "@/generated/prisma/enums";
import { TierServiceClass } from "./TierService";

export interface SellerProfileData {
  bio?: string;
  headline?: string;
  ctaText?: string;
  whatsapp?: string;
  sellerTier?: SellerTier;
  subscriptionStart?: Date;
  subscriptionEnd?: Date;
  customFeeRate?: number | null;
  customDomain?: string | null;
  domainVerified?: boolean;
}

export interface CreateUserWithProfileParams {
  name?: string;
  email: string;
  password: string;
  username: string;
  avatar?: string;
  profile?: Partial<SellerProfileData>;
}

class SellerServiceClass {
  /**
   * Get user's seller profile with tier info
   */
  async getProfile(userId: string) {
    return prisma.sellerProfile.findUnique({
      where: { userId },
      include: { user: { select: { email: true, name: true } } },
    });
  }

  /**
   * Get seller's tier info (with defaults)
   */
  async getTierInfo(userId: string) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
      select: { sellerTier: true, customFeeRate: true, subscriptionEnd: true },
    });

    const sellerTier = profile?.sellerTier || "FREE";
    return {
      sellerTier,
      customFeeRate: profile?.customFeeRate,
      subscriptionEnd: profile?.subscriptionEnd,
      effectiveFeeRate: TierServiceClass.getEffectiveFee({
        sellerTier,
        customFeeRate: profile?.customFeeRate ?? null,
      }),
      tierConfig: TierServiceClass.getConfig(sellerTier),
    };
  }

  /**
   * Create or update seller profile
   */
  async upsertProfile(userId: string, data: SellerProfileData) {
    return prisma.sellerProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  /**
   * Update tier and subscription
   */
  async updateTier(
    userId: string,
    tier: SellerTier,
    options?: {
      reason?: string;
      feeOverride?: number | null;
      extendDays?: number;
    }
  ) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
      select: { subscriptionEnd: true, subscriptionStart: true },
    });

    const updateData: Record<string, unknown> = {
      sellerTier: tier,
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
      const currentEnd = profile?.subscriptionEnd || new Date();
      const newEnd = new Date(currentEnd);
      newEnd.setDate(newEnd.getDate() + options.extendDays);
      updateData.subscriptionEnd = newEnd;

      if (!profile?.subscriptionStart) {
        updateData.subscriptionStart = new Date();
      }
    }

    const result = await prisma.sellerProfile.upsert({
      where: { userId },
      create: { userId, ...updateData } as any,
      update: updateData,
    });

    // Log tier change
    await prisma.sellerTierLog.create({
      data: {
        userId,
        oldTier: profile ? profile.subscriptionEnd ? undefined : undefined : null,
        newTier: tier,
        changedBy: "SYSTEM",
        reason: options?.reason,
        feeOverride: options?.feeOverride,
      },
    });

    return result;
  }

  /**
   * Get bank info
   */
  async getBankInfo(userId: string) {
    return prisma.bankAccount.findUnique({
      where: { userId },
    });
  }

  /**
   * Update bank info
   */
  async updateBankInfo(userId: string, bankName: string, bankAccount: string, bankHolder: string) {
    return prisma.bankAccount.upsert({
      where: { userId },
      create: { userId, bankName, bankAccount, bankHolder },
      update: { bankName, bankAccount, bankHolder },
    });
  }

  /**
   * Update user balance (for earnings tracking)
   */
  async updateBalance(userId: string, balance: number) {
    return prisma.sellerProfile.update({
      where: { userId },
      data: { balance },
    });
  }

  /**
   * Add to user balance (for affiliate commissions)
   */
  async addToBalance(userId: string, amount: number) {
    return prisma.sellerProfile.update({
      where: { userId },
      data: { balance: { increment: amount } },
    });
  }

  /**
   * Deduct from user balance (for withdrawals)
   */
  async deductFromBalance(userId: string, amount: number) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
      select: { balance: true },
    });

    if (!profile || profile.balance < amount) {
      throw new Error("Insufficient balance");
    }

    return prisma.sellerProfile.update({
      where: { userId },
      data: { balance: { decrement: amount } },
    });
  }

  /**
   * Get balance
   */
  async getBalance(userId: string): Promise<number> {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
      select: { balance: true },
    });
    return profile?.balance ?? 0;
  }

  /**
   * Check if user has seller profile (is a seller)
   */
  async isSeller(userId: string): Promise<boolean> {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
      select: { sellerTier: true },
    });
    return !!profile;
  }

  /**
   * Create user with optional profile
   */
  async createUserWithProfile(params: CreateUserWithProfileParams) {
    return prisma.user.create({
      data: {
        name: params.name,
        email: params.email,
        password: params.password,
        username: params.username,
        avatar: params.avatar,
        profile: params.profile
          ? { create: params.profile }
          : undefined,
      },
      include: { profile: true },
    });
  }
}

export const SellerService = new SellerServiceClass();
