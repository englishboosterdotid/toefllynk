/**
 * Order Service
 * Centralized service for order operations
 * Uses normalized schema pattern
 */

import { OrderStatus, ProductType } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { generateAccessToken } from "@/lib/generateAccessToken";
import { ProductService } from "./ProductService";

export interface CreateOrderParams {
  productId: string;
  buyerName: string;
  buyerEmail: string;
  buyerWhatsapp?: string | null;
  referralCode?: string | null;
  promoCodeId?: string | null;
  discountAmount?: number;
}

export interface OrderResult {
  success: boolean;
  order?: {
    id: string;
    status: OrderStatus;
    buyerEmail: string;
    createdAt: Date;
  };
  studentAccessToken?: string;
  error?: string;
}

class OrderServiceClass {
  /**
   * Create a new order with student account
   */
  async createOrder(data: CreateOrderParams): Promise<OrderResult> {
    try {
      const product = await ProductService.getProductWithOwner(data.productId);

      if (!product) {
        return { success: false, error: "Produk tidak ditemukan" };
      }

      if (product.settings?.isArchived) {
        return { success: false, error: "Produk sudah tidak tersedia" };
      }

      // Check if buyer already has an account
      let studentAccount = await prisma.studentAccount.findUnique({
        where: { buyerEmail: data.buyerEmail },
      });

      // Generate access token
      const accessToken = generateAccessToken();

      if (!studentAccount) {
        studentAccount = await prisma.studentAccount.create({
          data: {
            buyerName: data.buyerName,
            buyerEmail: data.buyerEmail,
            buyerWhatsapp: data.buyerWhatsapp,
            accessToken,
            ownerUserId: product.userId,
          },
        });
      }

      // Create order
      const order = await prisma.order.create({
        data: {
          productId: data.productId,
          buyerName: data.buyerName,
          buyerEmail: data.buyerEmail,
          buyerWhatsapp: data.buyerWhatsapp,
          referralCode: data.referralCode,
          studentId: studentAccount.id,
          status: OrderStatus.PENDING,
        },
      });

      // Record promo redemption if applicable
      if (data.promoCodeId && data.discountAmount && data.discountAmount > 0) {
        await prisma.promoRedemption.create({
          data: {
            promoId: data.promoCodeId,
            orderId: order.id,
            userId: studentAccount.id,
            discount: data.discountAmount,
          },
        });

        // Update usage count
        await prisma.promoCode.update({
          where: { id: data.promoCodeId },
          data: { usageCount: { increment: 1 } },
        });
      }

      return {
        success: true,
        order: {
          id: order.id,
          status: order.status,
          buyerEmail: order.buyerEmail,
          createdAt: order.createdAt,
        },
        studentAccessToken: accessToken,
      };
    } catch (error) {
      console.error("Create order error:", error);
      return { success: false, error: "Terjadi kesalahan saat membuat order" };
    }
  }

  /**
   * Complete an order (mark as COMPLETED)
   */
  async completeOrder(orderId: string): Promise<OrderResult["order"] | null> {
    try {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.COMPLETED },
      });

      // Get product for exam credits
      const product = await prisma.product.findUnique({
        where: { id: order.productId },
        include: { settings: { select: { examCredits: true } } },
      });

      // Create or update exam credits for TOEFL simulations
      if (order.studentId && product?.productType === ProductType.TOEFL_SIMULATION) {
        const examCredits = product.settings?.examCredits || 1;
        const existingCredit = await prisma.studentExamCredit.findFirst({
          where: {
            studentId: order.studentId,
            productId: order.productId,
          },
        });

        if (existingCredit) {
          await prisma.studentExamCredit.update({
            where: { id: existingCredit.id },
            data: {
              totalCredit: existingCredit.totalCredit + examCredits,
            },
          });
        } else {
          await prisma.studentExamCredit.create({
            data: {
              studentId: order.studentId,
              productId: order.productId,
              totalCredit: examCredits,
            },
          });
        }
      }

      return {
        id: order.id,
        status: order.status,
        buyerEmail: order.buyerEmail,
        createdAt: order.createdAt,
      };
    } catch (error) {
      console.error("Complete order error:", error);
      return null;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string) {
    return prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });
  }

  /**
   * Get order by ID with full details
   */
  async getOrderById(orderId: string) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: {
          include: { settings: true },
        },
        student: true,
        customer: true,
      },
    });
  }

  /**
   * Get orders for a seller's products
   */
  async getOrdersBySeller(sellerId: string, options?: {
    status?: OrderStatus;
    limit?: number;
  }) {
    return prisma.order.findMany({
      where: {
        product: { userId: sellerId },
        ...(options?.status ? { status: options.status } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit,
      include: {
        product: {
          select: { title: true, price: true },
        },
        student: {
          select: { buyerName: true, buyerEmail: true },
        },
      },
    });
  }

  /**
   * Get orders for a student
   */
  async getOrdersByStudent(studentId: string) {
    return prisma.order.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: { settings: true },
        },
      },
    });
  }

  /**
   * Get effective price for order
   */
  async getEffectivePrice(productId: string): Promise<number> {
    return ProductService.getEffectivePrice(productId);
  }

  /**
   * Update order status
   */
  async updateStatus(orderId: string, status: OrderStatus) {
    return prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }

  /**
   * Count orders by status for a seller
   */
  async countOrdersByStatus(sellerId: string, status: OrderStatus): Promise<number> {
    return prisma.order.count({
      where: {
        product: { userId: sellerId },
        status,
      },
    });
  }
}

export const OrderService = new OrderServiceClass();

// Export createOrder for backwards compatibility
export const createOrder = (data: CreateOrderParams) => OrderService.createOrder(data);
