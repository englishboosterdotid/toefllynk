import prisma from "@/lib/prisma";
import { ProductType, PackageType } from "@/generated/prisma/enums";

export interface ProductWithUser {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  price: number;
  promoPrice: number | null;
  thumbnail: string | null;
  checkoutLink: string | null;
  category: string | null;
  productType: ProductType;
  packageType: PackageType | null;
  examCredits: number;
  certificateIncluded: boolean;
  reviewIncluded: boolean;
  zoomIncluded: boolean;
  affiliateEnabled: boolean;
  isArchived: boolean;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    username: string;
    avatar: string | null;
    headline: string | null;
  };
  _count?: {
    orders: number;
    affiliateEnrollments: number;
  };
}

export async function getProductsByUser(userId: string): Promise<ProductWithUser[]> {
  return prisma.product.findMany({
    where: { userId, isArchived: false },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          headline: true,
        },
      },
      _count: {
        select: {
          orders: true,
          affiliateEnrollments: true,
        },
      },
    },
  }) as Promise<ProductWithUser[]>;
}

export async function getArchivedProductsByUser(userId: string): Promise<ProductWithUser[]> {
  return prisma.product.findMany({
    where: { userId, isArchived: true },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          headline: true,
        },
      },
      _count: {
        select: {
          orders: true,
          affiliateEnrollments: true,
        },
      },
    },
  }) as Promise<ProductWithUser[]>;
}

export async function getProductById(id: string): Promise<ProductWithUser | null> {
  return prisma.product.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          headline: true,
        },
      },
      _count: {
        select: {
          orders: true,
          affiliateEnrollments: true,
        },
      },
    },
  }) as Promise<ProductWithUser | null>;
}

export async function createProduct(data: {
  userId: string;
  title: string;
  description?: string;
  packageType?: PackageType;
  productType?: ProductType;
  examCredits?: number;
  price: number;
  promoPrice?: number | null;
  thumbnail?: string;
  category?: string | null;
  certificateIncluded?: boolean;
  reviewIncluded?: boolean;
  zoomIncluded?: boolean;
  affiliateEnabled?: boolean;
}): Promise<ProductWithUser> {
  return prisma.product.create({
    data,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          headline: true,
        },
      },
    },
  }) as Promise<ProductWithUser>;
}

export async function updateProduct(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    packageType: PackageType;
    productType: ProductType;
    examCredits: number;
    price: number;
    promoPrice: number | null;
    thumbnail: string;
    checkoutLink: string;
    category: string | null;
    certificateIncluded: boolean;
    reviewIncluded: boolean;
    zoomIncluded: boolean;
  }>
): Promise<ProductWithUser> {
  return prisma.product.update({
    where: { id },
    data,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          headline: true,
        },
      },
      _count: {
        select: {
          orders: true,
          affiliateEnrollments: true,
        },
      },
    },
  }) as Promise<ProductWithUser>;
}

export async function archiveProduct(id: string): Promise<ProductWithUser> {
  return prisma.product.update({
    where: { id },
    data: { isArchived: true },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          headline: true,
        },
      },
    },
  }) as Promise<ProductWithUser>;
}

export async function unarchiveProduct(id: string): Promise<ProductWithUser> {
  return prisma.product.update({
    where: { id },
    data: { isArchived: false },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          headline: true,
        },
      },
    },
  }) as Promise<ProductWithUser>;
}

export async function getProductWithAffiliateInfo(productId: string, referralCode: string) {
  return prisma.product.findFirst({
    where: {
      id: productId,
      affiliateEnrollments: {
        some: { referralCode },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          headline: true,
          ctaText: true,
          whatsapp: true,
        },
      },
      affiliateEnrollments: {
        where: { referralCode },
        select: {
          commissionPercent: true,
        },
      },
    },
  });
}

export async function getPublicProducts(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
      headline: true,
      bio: true,
      ctaText: true,
      whatsapp: true,
    },
  });

  if (!user) return null;

  const products = await prisma.product.findMany({
    where: {
      userId: user.id,
      isArchived: false,
    },
    orderBy: { createdAt: "desc" },
    include: {
      affiliateEnrollments: {
        select: {
          referralCode: true,
        },
      },
    },
  });

  return { user, products };
}