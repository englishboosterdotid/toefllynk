import { Prisma, ProductType, PackageType } from "@/generated/prisma/client";
import { BaseRepository } from "./base.repository";
import prisma from "@/lib/prisma";

const SELECT_PRODUCT_WITH_USER = {
  id: true,
  userId: true,
  title: true,
  description: true,
  price: true,
  thumbnail: true,
  category: true,
  productType: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
      profile: {
        select: {
          headline: true,
        },
      },
    },
  },
  settings: true,
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
  thumbnail: true,
  category: true,
  productType: true,
  createdAt: true,
  settings: true,
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
          select: {
            id: true,
            profile: {
              select: { sellerTier: true, customFeeRate: true },
            },
          },
        },
        settings: true,
      },
    });
  }

  async findByUserId(userId: string, includeArchived = false): Promise<ProductWithUser[]> {
    return prisma.product.findMany({
      where: {
        userId,
        ...(includeArchived ? {} : { settings: { isArchived: false } }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            profile: {
              select: {
                headline: true,
              },
            },
          },
        },
        settings: true,
        _count: {
          select: {
            orders: true,
            affiliateEnrollments: true,
          },
        },
      },
    });
  }

  async findArchivedByUserId(userId: string): Promise<ProductWithUser[]> {
    return prisma.product.findMany({
      where: { userId, settings: { isArchived: true } },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            profile: {
              select: {
                headline: true,
              },
            },
          },
        },
        settings: true,
        _count: {
          select: {
            orders: true,
            affiliateEnrollments: true,
          },
        },
      },
    });
  }

  async findVisibleOnMicrosite(userId: string): Promise<ProductWithUser[]> {
    return prisma.product.findMany({
      where: {
        userId,
        settings: {
          isArchived: false,
          isVisibleOnMicrosite: true,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            profile: {
              select: {
                headline: true,
              },
            },
          },
        },
        settings: true,
        _count: {
          select: {
            orders: true,
            affiliateEnrollments: true,
          },
        },
      },
    });
  }

  async findFeaturedByUser(userId: string, limit = 10): Promise<ProductWithUser[]> {
    return prisma.product.findMany({
      where: {
        userId,
        settings: {
          isArchived: false,
          isFeatured: true,
        },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            profile: {
              select: {
                headline: true,
              },
            },
          },
        },
        settings: true,
        _count: {
          select: {
            orders: true,
            affiliateEnrollments: true,
          },
        },
      },
    });
  }

  async create(data: {
    userId: string;
    title: string;
    description?: string | null;
    productType?: ProductType;
    price: number;
    thumbnail?: string | null;
    category?: string | null;
    // Settings
    packageType?: PackageType;
    examCredits?: number;
    certificateIncluded?: boolean;
    reviewIncluded?: boolean;
    zoomIncluded?: boolean;
    affiliateEnabled?: boolean;
    checkoutLink?: string | null;
    affiliateCommission?: number;
    promoPrice?: number | null;
  }): Promise<ProductWithUser> {
    return prisma.product.create({
      data: {
        user: { connect: { id: data.userId } },
        title: data.title,
        description: data.description,
        price: data.price,
        thumbnail: data.thumbnail,
        category: data.category,
        productType: data.productType,
        settings: {
          create: {
            packageType: data.packageType,
            examCredits: data.examCredits || 1,
            certificateIncluded: data.certificateIncluded ?? true,
            reviewIncluded: data.reviewIncluded ?? false,
            zoomIncluded: data.zoomIncluded ?? false,
            affiliateEnabled: data.affiliateEnabled ?? false,
            affiliateCommission: data.affiliateCommission || 10,
            checkoutLink: data.checkoutLink,
            promoPrice: data.promoPrice,
          },
        },
      },
      select: SELECT_PRODUCT_WITH_USER,
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string | null;
      productType?: string;
      price?: number;
      thumbnail?: string | null;
      category?: string | null;
    }
  ): Promise<ProductWithUser | null> {
    return prisma.product.update({
      where: { id },
      data: data as any,
      select: SELECT_PRODUCT_WITH_USER,
    });
  }

  async updateSettings(
    productId: string,
    data: {
      packageType?: PackageType;
      examCredits?: number;
      certificateIncluded?: boolean;
      reviewIncluded?: boolean;
      zoomIncluded?: boolean;
      affiliateEnabled?: boolean;
      affiliateCommission?: number;
      checkoutLink?: string | null;
      promoPrice?: number | null;
      isFeatured?: boolean;
      isVisibleOnMicrosite?: boolean;
      isArchived?: boolean;
    }
  ) {
    return prisma.productSettings.upsert({
      where: { productId },
      create: { productId, ...data },
      update: data,
    });
  }

  async archive(id: string): Promise<ProductWithUser | null> {
    return prisma.productSettings.upsert({
      where: { productId: id },
      create: { productId: id, isArchived: true },
      update: { isArchived: true },
    }).then(() => prisma.product.findUnique({ where: { id }, select: SELECT_PRODUCT_WITH_USER }));
  }

  async unarchive(id: string): Promise<ProductWithUser | null> {
    return prisma.productSettings.update({
      where: { productId: id },
      data: { isArchived: false },
    }).then(() => prisma.product.findUnique({ where: { id }, select: SELECT_PRODUCT_WITH_USER }));
  }

  async delete(id: string): Promise<void> {
    await prisma.product.delete({ where: { id } });
  }

  async countByUser(userId: string): Promise<number> {
    return prisma.product.count({
      where: {
        userId,
        settings: { isArchived: false },
      },
    });
  }

  async countVisibleOnMicrosite(userId: string): Promise<number> {
    return prisma.product.count({
      where: {
        userId,
        settings: {
          isArchived: false,
          isVisibleOnMicrosite: true,
        },
      },
    });
  }

  async toggleAffiliate(id: string, enabled: boolean): Promise<ProductWithUser | null> {
    await prisma.productSettings.upsert({
      where: { productId: id },
      create: { productId: id, affiliateEnabled: enabled },
      update: { affiliateEnabled: enabled },
    });
    return prisma.product.findUnique({ where: { id }, select: SELECT_PRODUCT_WITH_USER });
  }

  async toggleVisibility(id: string, visible: boolean): Promise<ProductWithUser | null> {
    await prisma.productSettings.upsert({
      where: { productId: id },
      create: { productId: id, isVisibleOnMicrosite: visible },
      update: { isVisibleOnMicrosite: visible },
    });
    return prisma.product.findUnique({ where: { id }, select: SELECT_PRODUCT_WITH_USER });
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
            profile: {
              select: {
                headline: true,
                ctaText: true,
                whatsapp: true,
              },
            },
          },
        },
        affiliateEnrollments: {
          where: { referralCode },
          select: { commissionPercent: true },
        },
        settings: true,
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
        include: { settings: true },
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
