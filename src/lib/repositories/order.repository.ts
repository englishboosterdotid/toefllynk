import { Prisma, OrderStatus } from "@/generated/prisma/client";
import { BaseRepository } from "./base.repository";
import prisma from "@/lib/prisma";

const SELECT_ORDER_WITH_DETAILS = {
  id: true,
  productId: true,
  buyerName: true,
  buyerEmail: true,
  buyerWhatsapp: true,
  referralCode: true,
  status: true,
  studentId: true,
  createdAt: true,
  product: {
    select: {
      id: true,
      title: true,
      price: true,
      user: {
        select: { id: true, name: true, username: true },
      },
      settings: {
        select: { promoPrice: true },
      },
    },
  },
  student: {
    select: {
      id: true,
      buyerName: true,
      buyerEmail: true,
      accessToken: true,
    },
  },
  affiliateConversion: {
    select: {
      id: true,
      commissionAmount: true,
      affiliateUserId: true,
    },
  },
  adminFee: {
    select: {
      id: true,
      feeAmount: true,
    },
  },
} as const;

const SELECT_ORDER_BASIC = {
  id: true,
  productId: true,
  buyerName: true,
  buyerEmail: true,
  status: true,
  createdAt: true,
  product: {
    select: {
      id: true,
      title: true,
      price: true,
      settings: {
        select: { promoPrice: true },
      },
    },
  },
} as const;

export type OrderWithDetails = Prisma.OrderGetPayload<{ select: typeof SELECT_ORDER_WITH_DETAILS }>;
export type OrderBasic = Prisma.OrderGetPayload<{ select: typeof SELECT_ORDER_BASIC }>;

export class OrderRepository extends BaseRepository {
  async findById(id: string): Promise<OrderWithDetails | null> {
    return prisma.order.findUnique({
      where: { id },
      select: SELECT_ORDER_WITH_DETAILS,
    });
  }

  async findByIdWithProduct(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: { product: true },
    });
  }

  async findByProductUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          product: { userId },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: SELECT_ORDER_WITH_DETAILS,
      }),
      prisma.order.count({ where: { product: { userId } } }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByStudent(studentId: string): Promise<OrderWithDetails[]> {
    return prisma.order.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      select: SELECT_ORDER_WITH_DETAILS,
    });
  }

  async findByEmail(email: string): Promise<OrderWithDetails[]> {
    return prisma.order.findMany({
      where: { buyerEmail: email },
      orderBy: { createdAt: "desc" },
      select: SELECT_ORDER_WITH_DETAILS,
    });
  }

  async findByStatus(status: OrderStatus, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where: { status },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: SELECT_ORDER_WITH_DETAILS,
      }),
      prisma.order.count({ where: { status } }),
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
    productId: string;
    buyerName: string;
    buyerEmail: string;
    buyerWhatsapp?: string | null;
    referralCode?: string | null;
    studentId?: string;
    status?: OrderStatus;
  }) {
    return prisma.order.create({
      data: {
        productId: data.productId,
        buyerName: data.buyerName,
        buyerEmail: data.buyerEmail,
        buyerWhatsapp: data.buyerWhatsapp,
        referralCode: data.referralCode,
        studentId: data.studentId,
        status: data.status || OrderStatus.PENDING,
      },
      include: {
        product: { select: { id: true, title: true, price: true } },
      },
    });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<OrderWithDetails | null> {
    return prisma.order.update({
      where: { id },
      data: { status },
      select: SELECT_ORDER_WITH_DETAILS,
    });
  }

  async linkStudent(id: string, studentId: string): Promise<void> {
    await prisma.order.update({
      where: { id },
      data: { studentId },
    });
  }

  async createWithStudent(data: {
    productId: string;
    buyerName: string;
    buyerEmail: string;
    buyerWhatsapp?: string | null;
    referralCode?: string | null;
    studentId: string;
    status?: OrderStatus;
  }) {
    return prisma.order.create({
      data: {
        productId: data.productId,
        buyerName: data.buyerName,
        buyerEmail: data.buyerEmail,
        buyerWhatsapp: data.buyerWhatsapp,
        referralCode: data.referralCode,
        studentId: data.studentId,
        status: data.status || OrderStatus.PENDING,
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            user: { select: { id: true, name: true, username: true } },
            settings: { select: { promoPrice: true, examCredits: true } },
          },
        },
        student: {
          select: {
            id: true,
            buyerName: true,
            buyerEmail: true,
            accessToken: true,
          },
        },
      },
    });
  }

  async findAll(options?: {
    where?: Prisma.OrderWhereInput;
    orderBy?: Prisma.OrderOrderByWithRelationInput;
    page?: number;
    limit?: number;
  }) {
    const { where, orderBy, page = 1, limit = 20 } = options || {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: SELECT_ORDER_WITH_DETAILS,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async countByProduct(productId: string): Promise<number> {
    return prisma.order.count({
      where: { productId, status: OrderStatus.COMPLETED },
    });
  }

  async countByUser(userId: string): Promise<number> {
    return prisma.order.count({
      where: {
        product: { userId },
        status: OrderStatus.COMPLETED,
      },
    });
  }

  async countByStatus(status: OrderStatus): Promise<number> {
    return prisma.order.count({ where: { status } });
  }

  async getRevenueByUser(userId: string): Promise<number> {
    const orders = await prisma.order.findMany({
      where: {
        product: { userId },
        status: OrderStatus.COMPLETED,
      },
      select: {
        id: true,
        product: {
          select: {
            price: true,
            settings: { select: { promoPrice: true } },
          },
        },
      },
    });

    return orders.reduce((sum, order) => {
      const price = order.product.settings?.promoPrice || order.product.price;
      return sum + price;
    }, 0);
  }
}

export const orderRepository = new OrderRepository();