import { OrderStatus } from "@/generated/prisma/enums";
import { orderRepository, productRepository, studentRepository, type OrderWithDetails } from "@/lib/repositories";
import { generateAccessToken } from "@/lib/generateAccessToken";
import prisma from "@/lib/prisma";

export interface CreateOrderResult {
  success: boolean;
  order?: OrderWithDetails;
  studentAccessToken?: string;
  error?: string;
}

export async function createOrder(data: {
  productId: string;
  buyerName: string;
  buyerEmail: string;
  buyerWhatsapp?: string | null;
  referralCode?: string | null;
  promoCodeId?: string | null;
  discountAmount?: number;
  finalPrice?: number;
}): Promise<CreateOrderResult> {
  try {
    const product = await productRepository.findByIdWithOwner(data.productId);

    if (!product) {
      return { success: false, error: "Produk tidak ditemukan" };
    }

    if (product.isArchived) {
      return { success: false, error: "Produk sudah tidak tersedia" };
    }

    // Check if buyer already has an account
    let studentAccount = await studentRepository.findByEmail(data.buyerEmail);

    // Generate access token
    const accessToken = generateAccessToken();

    if (!studentAccount) {
      studentAccount = await studentRepository.create({
        buyerName: data.buyerName,
        buyerEmail: data.buyerEmail,
        buyerWhatsapp: data.buyerWhatsapp,
        accessToken,
        ownerUserId: product.userId,
      });
    }

    // Create order
    const order = await orderRepository.createWithStudent({
      productId: data.productId,
      buyerName: data.buyerName,
      buyerEmail: data.buyerEmail,
      buyerWhatsapp: data.buyerWhatsapp,
      referralCode: data.referralCode,
      studentId: studentAccount.id,
      status: OrderStatus.PENDING,
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
      order: order as unknown as OrderWithDetails,
      studentAccessToken: accessToken,
    };
  } catch (error) {
    console.error("Create order error:", error);
    return { success: false, error: "Terjadi kesalahan saat membuat order" };
  }
}

export async function completeOrder(orderId: string): Promise<OrderWithDetails | null> {
  try {
    const order = await orderRepository.updateStatus(orderId, OrderStatus.COMPLETED);

    if (!order) return null;

    // Create student exam credits
    if (order.studentId && order.product) {
      await prisma.studentExamCredit.create({
        data: {
          studentId: order.studentId,
          productId: order.productId,
          totalCredit: order.product.examCredits || 1,
        },
      });
    }

    return order;
  } catch (error) {
    console.error("Complete order error:", error);
    return null;
  }
}

export async function cancelOrder(orderId: string): Promise<OrderWithDetails | null> {
  return orderRepository.updateStatus(orderId, OrderStatus.CANCELLED);
}

export async function getOrdersByUser(userId: string) {
  return orderRepository.findByProductUser(userId);
}

export async function getOrdersByStudent(studentId: string) {
  return orderRepository.findByStudent(studentId);
}

export async function getOrderById(id: string): Promise<OrderWithDetails | null> {
  return orderRepository.findById(id);
}