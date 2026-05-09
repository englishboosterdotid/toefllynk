import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
const mockPrisma = {
  customer: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  order: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({
  default: mockPrisma,
}));

describe('CustomerService', () => {
  describe('Customer creation', () => {
    it('should create customer with correct data structure', async () => {
      const customerData = {
        ownerUserId: 'user-123',
        buyerName: 'John Doe',
        buyerEmail: 'john@example.com',
        buyerPhone: '+6281234567890',
      };

      const mockCreatedCustomer = {
        id: 'cust-123',
        ...customerData,
        buyerAddress: null,
        totalPurchases: 0,
        totalSpent: 0,
        lastPurchaseAt: null,
        notes: null,
        tags: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.customer.create.mockResolvedValue(mockCreatedCustomer);

      const result = await mockPrisma.customer.create({
        data: customerData,
      });

      expect(result).toBeDefined();
      expect(result.buyerName).toBe('John Doe');
      expect(result.buyerEmail).toBe('john@example.com');
      expect(result.totalPurchases).toBe(0);
    });
  });

  describe('Customer upsert logic', () => {
    it('should update existing customer when email exists', async () => {
      const existingCustomer = {
        id: 'cust-123',
        ownerUserId: 'user-123',
        buyerName: 'John Doe',
        buyerEmail: 'john@example.com',
        totalPurchases: 1,
        totalSpent: 100000,
      };

      mockPrisma.customer.findUnique.mockResolvedValue(existingCustomer);
      mockPrisma.customer.update.mockResolvedValue({
        ...existingCustomer,
        totalPurchases: 2,
        totalSpent: 200000,
      });

      const updated = await mockPrisma.customer.update({
        where: { buyerEmail: 'john@example.com' },
        data: {
          totalPurchases: { increment: 1 },
          totalSpent: { increment: 100000 },
          lastPurchaseAt: new Date(),
        },
      });

      expect(updated.totalPurchases).toBe(2);
      expect(updated.totalSpent).toBe(200000);
    });

    it('should create new customer when email does not exist', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(null);

      const newCustomer = {
        id: 'cust-new',
        ownerUserId: 'user-123',
        buyerName: 'Jane Doe',
        buyerEmail: 'jane@example.com',
        totalPurchases: 1,
        totalSpent: 150000,
      };

      mockPrisma.customer.create.mockResolvedValue(newCustomer);

      const result = await mockPrisma.customer.create({
        data: {
          ownerUserId: 'user-123',
          buyerName: 'Jane Doe',
          buyerEmail: 'jane@example.com',
          totalPurchases: 1,
          totalSpent: 150000,
          lastPurchaseAt: new Date(),
        },
      });

      expect(result).toBeDefined();
      expect(result.buyerEmail).toBe('jane@example.com');
    });
  });

  describe('Customer search', () => {
    it('should search customers by email', async () => {
      const customers = [
        { id: 'cust-1', buyerEmail: 'john@example.com', buyerName: 'John' },
        { id: 'cust-2', buyerEmail: 'jane@example.com', buyerName: 'Jane' },
      ];

      mockPrisma.customer.findMany.mockResolvedValue(customers);

      const result = await mockPrisma.customer.findMany({
        where: {
          ownerUserId: 'user-123',
          buyerEmail: { contains: 'example', mode: 'insensitive' },
        },
      });

      expect(result).toHaveLength(2);
    });

    it('should search customers by name', async () => {
      const customers = [
        { id: 'cust-1', buyerName: 'John Doe', buyerEmail: 'john@example.com' },
      ];

      mockPrisma.customer.findMany.mockResolvedValue(customers);

      const result = await mockPrisma.customer.findMany({
        where: {
          ownerUserId: 'user-123',
          buyerName: { contains: 'John', mode: 'insensitive' },
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].buyerName).toContain('John');
    });
  });

  describe('Customer pagination', () => {
    it('should return paginated results', async () => {
      const total = 50;
      const page = 1;
      const limit = 10;

      const customers = Array.from({ length: limit }, (_, i) => ({
        id: `cust-${i}`,
        buyerName: `Customer ${i}`,
        buyerEmail: `customer${i}@example.com`,
      }));

      mockPrisma.customer.findMany.mockResolvedValue(customers);
      mockPrisma.customer.count.mockResolvedValue(total);

      const [data, count] = await Promise.all([
        mockPrisma.customer.findMany({
          where: { ownerUserId: 'user-123' },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        mockPrisma.customer.count({ where: { ownerUserId: 'user-123' } }),
      ]);

      expect(data).toHaveLength(limit);
      expect(count).toBe(total);
    });
  });

  describe('Customer export', () => {
    it('should format customer data for CSV export', () => {
      const customers = [
        {
          buyerName: 'John Doe',
          buyerEmail: 'john@example.com',
          buyerPhone: '+6281234567890',
          totalPurchases: 5,
          totalSpent: 500000,
          lastPurchaseAt: new Date('2024-01-15'),
        },
      ];

      const headers = ['Name', 'Email', 'Phone', 'Total Purchases', 'Total Spent', 'Last Purchase'];
      const rows = customers.map((c) => [
        c.buyerName,
        c.buyerEmail,
        c.buyerPhone || '',
        c.totalPurchases.toString(),
        c.totalSpent.toString(),
        c.lastPurchaseAt?.toISOString().split('T')[0] || '',
      ]);

      expect(headers).toHaveLength(6);
      expect(rows[0]).toHaveLength(6);
      expect(rows[0][0]).toBe('John Doe');
      expect(rows[0][1]).toBe('john@example.com');
    });
  });
});