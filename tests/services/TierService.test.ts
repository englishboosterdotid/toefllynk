import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TierServiceClass, TIER_CONFIG, TIER_ORDER } from '@/lib/services/TierService';

// Mock prisma before importing TierService
vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    sellerTierLog: {
      create: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock repositories
vi.mock('@/lib/repositories', () => ({
  productRepository: {
    countByUser: vi.fn(),
    countVisibleOnMicrosite: vi.fn(),
  },
}));

describe('TierService', () => {
  describe('getConfig', () => {
    it('should return FREE tier config', () => {
      const config = TierServiceClass.getConfig('FREE');
      expect(config.name).toBe('Coba');
      expect(config.platformFee).toBe(10);
      expect(config.maxProducts).toBe(3);
    });

    it('should return PRO tier config', () => {
      const config = TierServiceClass.getConfig('PRO');
      expect(config.name).toBe('Berkembang');
      expect(config.platformFee).toBe(5);
      expect(config.maxProducts).toBe(-1); // unlimited
    });

    it('should return BUSINESS tier config', () => {
      const config = TierServiceClass.getConfig('BUSINESS');
      expect(config.name).toBe('Bisnis');
      expect(config.platformFee).toBe(3);
      expect(config.maxProducts).toBe(-1); // unlimited
    });
  });

  describe('getRank', () => {
    it('should return correct rank for FREE', () => {
      expect(TierServiceClass.getRank('FREE')).toBe(0);
    });

    it('should return correct rank for PRO', () => {
      expect(TierServiceClass.getRank('PRO')).toBe(1);
    });

    it('should return correct rank for BUSINESS', () => {
      expect(TierServiceClass.getRank('BUSINESS')).toBe(2);
    });
  });

  describe('isHigherOrEqual', () => {
    it('should return true for same tier', () => {
      expect(TierServiceClass.isHigherOrEqual('PRO', 'PRO')).toBe(true);
    });

    it('should return true when first tier is higher', () => {
      expect(TierServiceClass.isHigherOrEqual('BUSINESS', 'PRO')).toBe(true);
      expect(TierServiceClass.isHigherOrEqual('PRO', 'FREE')).toBe(true);
    });

    it('should return false when first tier is lower', () => {
      expect(TierServiceClass.isHigherOrEqual('FREE', 'PRO')).toBe(false);
      expect(TierServiceClass.isHigherOrEqual('PRO', 'BUSINESS')).toBe(false);
    });
  });

  describe('isHigher', () => {
    it('should return false for same tier', () => {
      expect(TierServiceClass.isHigher('PRO', 'PRO')).toBe(false);
    });

    it('should return true when first tier is strictly higher', () => {
      expect(TierServiceClass.isHigher('BUSINESS', 'PRO')).toBe(true);
    });

    it('should return false when tiers are equal or lower', () => {
      expect(TierServiceClass.isHigher('FREE', 'PRO')).toBe(false);
      expect(TierServiceClass.isHigher('PRO', 'PRO')).toBe(false);
    });
  });

  describe('getNextTier', () => {
    it('should return PRO for FREE', () => {
      expect(TierServiceClass.getNextTier('FREE')).toBe('PRO');
    });

    it('should return BUSINESS for PRO', () => {
      expect(TierServiceClass.getNextTier('PRO')).toBe('BUSINESS');
    });

    it('should return null for BUSINESS', () => {
      expect(TierServiceClass.getNextTier('BUSINESS')).toBeNull();
    });
  });

  describe('getEffectiveFee', () => {
    it('should return custom fee rate when set', () => {
      const user = { sellerTier: 'PRO' as const, customFeeRate: 2 };
      expect(TierServiceClass.getEffectiveFee(user)).toBe(2);
    });

    it('should return tier fee when custom fee is null', () => {
      const user = { sellerTier: 'PRO' as const, customFeeRate: null };
      expect(TierServiceClass.getEffectiveFee(user)).toBe(5);
    });

    it('should cap custom fee at minimum 0', () => {
      const user = { sellerTier: 'PRO' as const, customFeeRate: -5 };
      expect(TierServiceClass.getEffectiveFee(user)).toBe(0);
    });

    it('should cap custom fee at maximum 20', () => {
      const user = { sellerTier: 'FREE' as const, customFeeRate: 25 };
      expect(TierServiceClass.getEffectiveFee(user)).toBe(20);
    });
  });

  describe('calculateFee', () => {
    it('should calculate fee correctly for 10%', () => {
      const result = TierServiceClass.calculateFee(100000, 10);
      expect(result.grossAmount).toBe(100000);
      expect(result.feeAmount).toBe(10000);
      expect(result.netAmount).toBe(90000);
    });

    it('should calculate fee correctly for 5%', () => {
      const result = TierServiceClass.calculateFee(200000, 5);
      expect(result.feeAmount).toBe(10000);
      expect(result.netAmount).toBe(190000);
    });

    it('should floor fractional fees', () => {
      const result = TierServiceClass.calculateFee(33333, 10);
      expect(result.feeAmount).toBe(3333); // floor(3333.3)
    });
  });

  describe('isUnlimited', () => {
    it('should return false for FREE tier', () => {
      expect(TierServiceClass.isUnlimited('FREE')).toBe(false);
    });

    it('should return true for PRO and BUSINESS tiers', () => {
      expect(TierServiceClass.isUnlimited('PRO')).toBe(true);
      expect(TierServiceClass.isUnlimited('BUSINESS')).toBe(true);
    });
  });

  describe('getMinimumWithdrawal', () => {
    it('should return 100000 for FREE', () => {
      expect(TierServiceClass.getMinimumWithdrawal('FREE')).toBe(100000);
    });

    it('should return 50000 for PRO', () => {
      expect(TierServiceClass.getMinimumWithdrawal('PRO')).toBe(50000);
    });

    it('should return 25000 for BUSINESS', () => {
      expect(TierServiceClass.getMinimumWithdrawal('BUSINESS')).toBe(25000);
    });
  });

  describe('getMicrositeProductLimit', () => {
    it('should return 3 for FREE', () => {
      expect(TierServiceClass.getMicrositeProductLimit('FREE')).toBe(3);
    });

    it('should return 15 for PRO', () => {
      expect(TierServiceClass.getMicrositeProductLimit('PRO')).toBe(15);
    });

    it('should return -1 for BUSINESS (unlimited)', () => {
      expect(TierServiceClass.getMicrositeProductLimit('BUSINESS')).toBe(-1);
    });
  });

  describe('isSubscriptionValid', () => {
    it('should return true for FREE tier', () => {
      expect(TierServiceClass.isSubscriptionValid(null, 'FREE')).toBe(true);
    });

    it('should return true when subscription end is in the future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      expect(TierServiceClass.isSubscriptionValid(futureDate, 'PRO')).toBe(true);
    });

    it('should return true during grace period (7 days after expiry)', () => {
      const graceEndDate = new Date();
      graceEndDate.setDate(graceEndDate.getDate() + 5); // 5 days from now (within 7 day grace)
      expect(TierServiceClass.isSubscriptionValid(graceEndDate, 'PRO')).toBe(true);
    });

    it('should return false after grace period', () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 10); // 10 days ago (past grace period)
      expect(TierServiceClass.isSubscriptionValid(expiredDate, 'PRO')).toBe(false);
    });
  });

  describe('getDaysUntilExpiry', () => {
    it('should return null when no subscription end', () => {
      expect(TierServiceClass.getDaysUntilExpiry(null)).toBeNull();
    });

    it('should return positive days for future subscription', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const days = TierServiceClass.getDaysUntilExpiry(futureDate);
      expect(days).toBeGreaterThan(0);
      expect(days).toBeLessThanOrEqual(30);
    });

    it('should return negative days for past subscription', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const days = TierServiceClass.getDaysUntilExpiry(pastDate);
      expect(days).toBeLessThan(0);
    });
  });
});