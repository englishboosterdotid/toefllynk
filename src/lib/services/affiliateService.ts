import prisma from "@/lib/prisma";
import { nanoid } from "@/lib/nanoid";

export interface AffiliateEnrollmentWithDetails {
  id: string;
  affiliateUserId: string;
  ownerUserId: string;
  productId: string;
  referralCode: string;
  commissionPercent: number;
  createdAt: Date;
  product: {
    id: string;
    title: string;
    price: number;
    promoPrice: number | null;
    thumbnail: string | null;
  };
  affiliateUser: {
    id: string;
    name: string | null;
    username: string;
    avatar: string | null;
  };
}

export interface AffiliateClickData {
  referralCode: string;
  productId: string;
  visitorIp?: string;
}

export async function createAffiliateEnrollment(data: {
  affiliateUserId: string;
  ownerUserId: string;
  productId: string;
  commissionPercent?: number;
}): Promise<AffiliateEnrollmentWithDetails | null> {
  try {
    // Check if already enrolled
    const existing = await prisma.affiliateEnrollment.findFirst({
      where: {
        affiliateUserId: data.affiliateUserId,
        productId: data.productId,
      },
    });

    if (existing) {
      return null;
    }

    const referralCode = nanoid(10);

    const enrollment = await prisma.affiliateEnrollment.create({
      data: {
        affiliateUserId: data.affiliateUserId,
        ownerUserId: data.ownerUserId,
        productId: data.productId,
        referralCode,
        commissionPercent: data.commissionPercent || 10,
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            thumbnail: true,
            settings: { select: { promoPrice: true } },
          },
        },
        affiliateUser: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return enrollment as unknown as AffiliateEnrollmentWithDetails;
  } catch (error) {
    console.error("Create affiliate enrollment error:", error);
    return null;
  }
}

export async function recordAffiliateClick(data: AffiliateClickData) {
  return prisma.affiliateClick.create({
    data: {
      referralCode: data.referralCode,
      productId: data.productId,
      visitorIp: data.visitorIp,
    },
  });
}

export async function getAffiliateEnrollmentsByUser(userId: string) {
  return prisma.affiliateEnrollment.findMany({
    where: { affiliateUserId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          price: true,
          thumbnail: true,
          settings: { select: { promoPrice: true } },
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      },
    },
  });
}

export async function getAffiliateProducts(ownerUserId: string) {
  return prisma.product.findMany({
    where: {
      userId: ownerUserId,
      settings: { isArchived: false },
    },
    include: {
      settings: { select: { promoPrice: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAffiliateConversions(userId: string) {
  return prisma.affiliateConversion.findMany({
    where: { affiliateUserId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      order: {
        select: {
          id: true,
          buyerName: true,
          createdAt: true,
          product: {
            select: {
              id: true,
              title: true,
              price: true,
              settings: { select: { promoPrice: true } },
            },
          },
        },
      },
    },
  });
}

export async function getTotalAffiliateEarnings(userId: string): Promise<number> {
  const result = await prisma.affiliateConversion.aggregate({
    where: { affiliateUserId: userId },
    _sum: {
      commissionAmount: true,
    },
  });

  return result._sum.commissionAmount || 0;
}

export async function getAffiliateLinkByCode(referralCode: string) {
  return prisma.affiliateEnrollment.findUnique({
    where: { referralCode },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          price: true,
          thumbnail: true,
          settings: { select: { promoPrice: true } },
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              profile: { select: { headline: true, ctaText: true, whatsapp: true } },
            },
          },
        },
      },
      affiliateUser: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
        },
      },
    },
  });
}

export async function createAffiliateConversion(data: {
  orderId: string;
  referralCode: string;
  affiliateUserId: string;
  ownerUserId: string;
  commissionAmount: number;
}) {
  return prisma.affiliateConversion.create({
    data,
  });
}

export async function removeAffiliateEnrollment(enrollmentId: string, userId: string) {
  return prisma.affiliateEnrollment.deleteMany({
    where: {
      id: enrollmentId,
      affiliateUserId: userId,
    },
  });
}

export async function getClickStats(productId: string, startDate?: Date, endDate?: Date) {
  const where: Record<string, unknown> = { productId };

  if (startDate || endDate) {
    where.clickedAt = {};
    if (startDate) (where.clickedAt as Record<string, Date>).gte = startDate;
    if (endDate) (where.clickedAt as Record<string, Date>).lte = endDate;
  }

  return prisma.affiliateClick.findMany({
    where,
    orderBy: { clickedAt: "desc" },
  });
}

export async function getClickCountByCode(referralCode: string): Promise<number> {
  const result = await prisma.affiliateClick.count({
    where: { referralCode },
  });
  return result;
}

export async function findAffiliateEnrollment(referralCode: string) {
  return prisma.affiliateEnrollment.findUnique({
    where: { referralCode },
  });
}

export async function createAffiliateClick(referralCode: string, productId: string) {
  return prisma.affiliateClick.create({
    data: {
      referralCode,
      productId,
    },
  });
}

export async function getAffiliateLinksByUser(userId: string) {
  return prisma.affiliateEnrollment.findMany({
    where: { affiliateUserId: userId },
    include: {
      product: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}