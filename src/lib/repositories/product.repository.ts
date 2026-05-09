import { Prisma, ProductType, PackageType } from "@/generated/prisma/client";
import { BaseRepository } from "./base.repository";
import prisma from "@/lib/prisma";

const SELECT_PRODUCT_WITH_USER = {
  id: true,
  userId: true,
  title: true,
  description: true,
  price: true,
  promoPrice: true,
  thumbnail: true,
  checkoutLink: true,
  category: true,
  productType: true,
  packageType: true,
  examCredits: true,
  certificateIncluded: true,
  reviewIncluded: true,
  zoomIncluded: true,
  affiliateEnabled: true,
  isArchived: true,
  isVisibleOnMicrosite: true,
  createdAt: true,
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
} as const;

const SELECT_PRODUCT_BASIC = {
  id: true,
  userId: true,
  title: true,
  description: true,
  price: true,
  promoPrice: true,
  thumbnail: true,
  category: true,
  productType: true,
  packageType: true,
  examCredits: true,
  certificateIncluded: true,
  reviewIncluded: true,
  zoomIncluded: true,
  isArchived: true,
  createdAt: true,
} as const;

export type ProductWithUser = Prisma.ProductGetPayload<{ select: typeof SELECT_PRODUCT_WITH_USER }>;
export type ProductBasic = Prisma.ProductGetPayload<{ select: typeof SELECT_PRODUCT_BASIC }>;

export class ProductRepository extends BaseRepository {
  async findById(id: string): Promise<ProductWithUser | null> {
    return prisma.product.findUnique({
      where: { id },
      select: SELECT_PRODUCT_WITH_USER,
    });
  }

  async findByIdWithOwner(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, sellerTier: true },
        },
      },
    });
  }

  async findByUserId(userId: string, includeArchived = false): Promise<ProductWithUser[]> {
    return prisma.product.findMany({
      where: {
        userId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      orderBy: { createdAt: "desc" },
      select: SELECT_PRODUCT_WITH_USER,
    });
  }

  async findArchivedByUserId(userId: string): Promise<ProductWithUser[]> {
    return prisma.product.findMany({
      where: { userId, isArchived: true },
      orderBy: { createdAt: "desc" },
      select: SELECT_PRODUCT_WITH_USER,
    });
  }

  async findVisibleOnMicrosite(userId: string): Promise<ProductWithUser[]> {
    return prisma.product.findMany({
      where: {
        userId,
        isArchived: false,
        isVisibleOnMicrosite: true,
      },
      orderBy: { createdAt: "desc" },
      select: SELECT_PRODUCT_WITH_USER,
    });
  }

  async findFeaturedByUser(userId: string, limit = 10): Promise<ProductWithUser[]> {
    return prisma.product.findMany({
      where: {
        userId,
        isArchived: false,
        isFeatured: true,
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      select: SELECT_PRODUCT_WITH_USER,
    });
  }

  async create(data: {
    userId: string;
    title: string;
    description?: string | null;
    packageType?: PackageType;
    productType?: ProductType;
    examCredits?: number;
    price: number;
    promoPrice?: number | null;
    thumbnail?: string | null;
    category?: string | null;
    certificateIncluded?: boolean;
    reviewIncluded?: boolean;
    zoomIncluded?: boolean;
    affiliateEnabled?: boolean;
    checkoutLink?: string | null;
    affiliateCommission?: number;
  }): Promise<ProductWithUser> {
    return prisma.product.create({
      data: {
        user: { connect: { id: data.userId } },
        title: data.title,
        description: data.description,
        price: data.price,
        promoPrice: data.promoPrice,
        thumbnail: data.thumbnail,
        checkoutLink: data.checkoutLink,
        category: data.category,
        productType: data.productType,
        packageType: data.packageType,
        examCredits: data.examCredits,
        certificateIncluded: data.certificateIncluded,
        reviewIncluded: data.reviewIncluded,
        zoomIncluded: data.zoomIncluded,
        affiliateEnabled: data.affiliateEnabled,
        affiliateCommission: data.affiliateCommission,
      },
      select: SELECT_PRODUCT_WITH_USER,
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string | null;
      packageType?: string;
      productType?: string;
      examCredits?: number;
      price?: number;
      promoPrice?: number | null;
      thumbnail?: string | null;
      checkoutLink?: string | null;
      category?: string | null;
      certificateIncluded?: boolean;
      reviewIncluded?: boolean;
      zoomIncluded?: boolean;
      isFeatured?: boolean;
      isVisibleOnMicrosite?: boolean;
    }
  ): Promise<ProductWithUser | null> {
    return prisma.product.update({
      where: { id },
      data: data as any,
      select: SELECT_PRODUCT_WITH_USER,
    });
  }

  async archive(id: string): Promise<ProductWithUser | null> {
    return prisma.product.update({
      where: { id },
      data: { isArchived: true },
      select: SELECT_PRODUCT_WITH_USER,
    });
  }

  async unarchive(id: string): Promise<ProductWithUser | null> {
    return prisma.product.update({
      where: { id },
      data: { isArchived: false },
      select: SELECT_PRODUCT_WITH_USER,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.product.delete({ where: { id } });
  }

  async countByUser(userId: string): Promise<number> {
    return prisma.product.count({ where: { userId, isArchived: false } });
  }

  async countVisibleOnMicrosite(userId: string): Promise<number> {
    return prisma.product.count({
      where: {
        userId,
        isArchived: false,
        isVisibleOnMicrosite: true,
      },
    });
  }

  async toggleAffiliate(id: string, enabled: boolean): Promise<ProductWithUser | null> {
    return prisma.product.update({
      where: { id },
      data: { affiliateEnabled: enabled },
      select: SELECT_PRODUCT_WITH_USER,
    });
  }

  async toggleVisibility(id: string, visible: boolean): Promise<ProductWithUser | null> {
    return prisma.product.update({
      where: { id },
      data: { isVisibleOnMicrosite: visible },
      select: SELECT_PRODUCT_WITH_USER,
    });
  }

  async findWithAffiliateInfo(productId: string, referralCode: string) {
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
          select: { commissionPercent: true },
        },
      },
    });
  }

  async findAll(options?: {
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
    page?: number;
    limit?: number;
  }) {
    const { where, orderBy, page = 1, limit = 20 } = options || {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: SELECT_PRODUCT_BASIC,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllWithUsers(options?: {
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
    page?: number;
    limit?: number;
  }) {
    const { where, orderBy, page = 1, limit = 20 } = options || {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: SELECT_PRODUCT_WITH_USER,
      }),
      prisma.product.count({ where }),
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

export const productRepository = new ProductRepository();