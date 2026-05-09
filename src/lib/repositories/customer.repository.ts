import { Prisma } from "@/generated/prisma/client";
import { BaseRepository } from "./base.repository";
import prisma from "@/lib/prisma";

const SELECT_CUSTOMER_BASIC = {
  id: true,
  buyerName: true,
  buyerEmail: true,
  buyerPhone: true,
  buyerAddress: true,
  totalPurchases: true,
  totalSpent: true,
  lastPurchaseAt: true,
  tags: true,
  createdAt: true,
} as const;

export type CustomerBasic = Prisma.CustomerGetPayload<{ select: typeof SELECT_CUSTOMER_BASIC }>;

export class CustomerRepository extends BaseRepository {
  async findById(id: string): Promise<CustomerBasic | null> {
    return prisma.customer.findUnique({
      where: { id },
      select: SELECT_CUSTOMER_BASIC,
    });
  }

  async findByEmail(buyerEmail: string): Promise<CustomerBasic | null> {
    return prisma.customer.findUnique({
      where: { buyerEmail },
      select: SELECT_CUSTOMER_BASIC,
    });
  }

  async findByIdWithOrders(id: string) {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            product: {
              select: { id: true, title: true, price: true },
            },
          },
        },
      },
    });
  }

  async findByOwnerUser(ownerUserId: string, page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          ownerUserId,
          OR: [
            { buyerName: { contains: search, mode: "insensitive" as const } },
            { buyerEmail: { contains: search, mode: "insensitive" as const } },
            { tags: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : { ownerUserId };

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: SELECT_CUSTOMER_BASIC,
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(data: {
    ownerUserId: string;
    buyerName: string;
    buyerEmail: string;
    buyerPhone?: string | null;
    buyerAddress?: string | null;
    tags?: string | null;
  }): Promise<CustomerBasic> {
    return prisma.customer.create({
      data,
      select: SELECT_CUSTOMER_BASIC,
    });
  }

  async update(
    id: string,
    data: Partial<{
      buyerName: string;
      buyerEmail: string;
      buyerPhone: string | null;
      buyerAddress: string | null;
      totalPurchases: number;
      totalSpent: number;
      lastPurchaseAt: Date;
      notes: string | null;
      tags: string | null;
    }>
  ): Promise<CustomerBasic | null> {
    return prisma.customer.update({
      where: { id },
      data,
      select: SELECT_CUSTOMER_BASIC,
    });
  }

  async upsertFromOrder(ownerUserId: string, orderData: {
    buyerName: string;
    buyerEmail: string;
    buyerWhatsapp?: string | null;
    productPrice: number;
  }): Promise<CustomerBasic> {
    return prisma.customer.upsert({
      where: { buyerEmail: orderData.buyerEmail },
      create: {
        ownerUserId,
        buyerName: orderData.buyerName,
        buyerEmail: orderData.buyerEmail,
        buyerPhone: orderData.buyerWhatsapp,
        totalPurchases: 1,
        totalSpent: orderData.productPrice,
        lastPurchaseAt: new Date(),
      },
      update: {
        buyerName: orderData.buyerName,
        buyerPhone: orderData.buyerWhatsapp,
        totalPurchases: { increment: 1 },
        totalSpent: { increment: orderData.productPrice },
        lastPurchaseAt: new Date(),
      },
      select: SELECT_CUSTOMER_BASIC,
    });
  }

  async countByOwnerUser(ownerUserId: string): Promise<number> {
    return prisma.customer.count({ where: { ownerUserId } });
  }

  async delete(id: string): Promise<void> {
    await prisma.customer.delete({ where: { id } });
  }

  async findAll(options?: {
    where?: Prisma.CustomerWhereInput;
    orderBy?: Prisma.CustomerOrderByWithRelationInput;
    page?: number;
    limit?: number;
  }) {
    const { where, orderBy, page = 1, limit = 20 } = options || {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: SELECT_CUSTOMER_BASIC,
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const customerRepository = new CustomerRepository();