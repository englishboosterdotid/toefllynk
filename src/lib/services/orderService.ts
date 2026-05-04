import prisma from "@/lib/prisma";
import { OrderStatus } from "@/generated/prisma/enums";
import { generateAccessToken } from "@/lib/generateAccessToken";

export interface OrderWithDetails {
  id: string;
  productId: string;
  buyerName: string;
  buyerEmail: string;
  buyerWhatsapp: string | null;
  referralCode: string | null;
  status: OrderStatus;
  studentId: string | null;
  createdAt: Date;
  product: {
    id: string;
    title: string;
    price: number;
    promoPrice: number | null;
  };
  student: {
    id: string;
    buyerName: string;
    buyerEmail: string;
    accessToken: string;
  } | null;
  affiliateConversion: {
    id: string;
    commissionAmount: number;
    affiliateUserId: string;
  } | null;
}

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
}): Promise<CreateOrderResult> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      include: { user: true },
    });

    if (!product) {
      return { success: false, error: "Produk tidak ditemukan" };
    }

    if (product.isArchived) {
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
        status: OrderStatus.PENDING,
        studentId: studentAccount.id,
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            promoPrice: true,
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
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.COMPLETED },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            promoPrice: true,
            examCredits: true,
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
      },
    });

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

    return order as unknown as OrderWithDetails;
  } catch (error) {
    console.error("Complete order error:", error);
    return null;
  }
}

export async function cancelOrder(orderId: string): Promise<OrderWithDetails | null> {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            promoPrice: true,
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

    return order as unknown as OrderWithDetails;
  } catch (error) {
    console.error("Cancel order error:", error);
    return null;
  }
}

export async function getOrdersByUser(userId: string) {
  return prisma.order.findMany({
    where: {
      product: {
        userId,
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          price: true,
          promoPrice: true,
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
    },
  });
}

export async function getOrdersByStudent(studentId: string) {
  return prisma.order.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          price: true,
          promoPrice: true,
        },
      },
    },
  });
}

export async function getOrderById(id: string): Promise<OrderWithDetails | null> {
  return prisma.order.findUnique({
    where: { id },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          price: true,
          promoPrice: true,
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
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
      adminFee: true,
    },
  }) as Promise<OrderWithDetails | null>;
}