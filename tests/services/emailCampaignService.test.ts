import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EMAIL_TEMPLATES, getTemplate, replaceTemplateVariables } from '@/lib/services/emailCampaignService';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    emailCampaign: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Mock repositories
vi.mock('@/lib/repositories', () => ({
  emailCampaignRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByUserId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    countByUser: vi.fn(),
  },
}));

// Mock TierService
vi.mock('@/lib/services/TierService', () => ({
  TierServiceClass: {
    getConfig: vi.fn((tier: string) => ({
      emailMarketingLimit: tier === 'BUSINESS' ? 10000 : tier === 'PRO' ? 1000 : 100,
    })),
  },
}));

describe('EmailCampaignService', () => {
  describe('EMAIL_TEMPLATES', () => {
    it('should have welcome template', () => {
      expect(EMAIL_TEMPLATES.welcome).toBeDefined();
      expect(EMAIL_TEMPLATES.welcome).toContain('Selamat Datang');
      expect(EMAIL_TEMPLATES.welcome).toContain('{{name}}');
      expect(EMAIL_TEMPLATES.welcome).toContain('{{cta_url}}');
    });

    it('should have orderConfirmation template', () => {
      expect(EMAIL_TEMPLATES.orderConfirmation).toBeDefined();
      expect(EMAIL_TEMPLATES.orderConfirmation).toContain('Pesanan Dikonfirmasi');
      expect(EMAIL_TEMPLATES.orderConfirmation).toContain('{{product_name}}');
      expect(EMAIL_TEMPLATES.orderConfirmation).toContain('{{total_amount}}');
    });

    it('should have newsletter template', () => {
      expect(EMAIL_TEMPLATES.newsletter).toBeDefined();
      expect(EMAIL_TEMPLATES.newsletter).toContain('{{subject}}');
      expect(EMAIL_TEMPLATES.newsletter).toContain('{{content}}');
      expect(EMAIL_TEMPLATES.newsletter).toContain('{{unsubscribe_url}}');
    });
  });

  describe('getTemplate', () => {
    it('should return welcome template', () => {
      const template = getTemplate('welcome');
      expect(template).toBe(EMAIL_TEMPLATES.welcome);
    });

    it('should return orderConfirmation template', () => {
      const template = getTemplate('orderConfirmation');
      expect(template).toBe(EMAIL_TEMPLATES.orderConfirmation);
    });

    it('should return newsletter template', () => {
      const template = getTemplate('newsletter');
      expect(template).toBe(EMAIL_TEMPLATES.newsletter);
    });
  });

  describe('replaceTemplateVariables', () => {
    it('should replace single variable', () => {
      const template = 'Hello {{name}}!';
      const result = replaceTemplateVariables(template, { name: 'John' });
      expect(result).toBe('Hello John!');
    });

    it('should replace multiple variables', () => {
      const template = 'Hello {{name}}, your order {{order_id}} is ready.';
      const result = replaceTemplateVariables(template, { name: 'John', order_id: '12345' });
      expect(result).toBe('Hello John, your order 12345 is ready.');
    });

    it('should replace same variable multiple times', () => {
      const template = '{{name}} said hello to {{name}}';
      const result = replaceTemplateVariables(template, { name: 'John' });
      expect(result).toBe('John said hello to John');
    });

    it('should leave unmatched variables as-is', () => {
      const template = 'Hello {{name}}, your code is {{code}}';
      const result = replaceTemplateVariables(template, { name: 'John' });
      expect(result).toBe('Hello John, your code is {{code}}');
    });

    it('should handle empty variables object', () => {
      const template = 'Hello {{name}}!';
      const result = replaceTemplateVariables(template, {});
      expect(result).toBe('Hello {{name}}!');
    });

    it('should replace product variables in order confirmation', () => {
      const template = EMAIL_TEMPLATES.orderConfirmation;
      const result = replaceTemplateVariables(template, {
        name: 'Jane Doe',
        product_name: 'TOEFL Practice Test',
        total_amount: 'Rp 150.000',
      });
      expect(result).toContain('Jane Doe');
      expect(result).toContain('TOEFL Practice Test');
      expect(result).toContain('Rp 150.000');
    });
  });
});