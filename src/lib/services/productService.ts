/**
 * Product Service
 * Centralized service for product operations
 * Uses normalized schema pattern: Product + ProductSettings
 */

import prisma from "@/lib/prisma";
import { ProductType, PackageType, SellerTier } from "@/generated/prisma/enums";
import { TierService, TierServiceClass } from "./TierService";
import type { ProductWithUser } from "@/lib/repositories/product.repository";

export interface ProductSettingsData {
  promoPrice?: number | null;
  checkoutLink?: string | null;
  packageType?: PackageType;
  examCredits?: number;
  certificateIncluded?: boolean;
  reviewIncluded?: boolean;
  zoomIncluded?: boolean;
  affiliateEnabled?: boolean;
  affiliateCommission?: number;
  isArchived?: boolean;
  isVisibleOnMicrosite?: boolean;
  isFeatured?: boolean;
}

export interface CreateProductParams {
  userId: string;
  title: string;
  description?: string | null;
  price: number;
  thumbnail?: string | null;
  category?: string | null;
  productType?: ProductType;
  settings?: ProductSettingsData;
}

export interface UpdateProductParams {
  title?: string;
  description?: string | null;
  price?: number;
  thumbnail?: string | null;
  category?: string | null;
  productType?: ProductType;
  settings?: ProductSettingsData;
}

class ProductServiceClass {
  /**
   * Get product with settings
   */
  async getProduct(productId: string) {
    return prisma.product.findUnique({
      where: { id: productId },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true },
        },
        settings: true,
      },
    });
  }

  /**
   * Get product with owner profile info
   */
  async getProductWithOwner(productId: string) {
    return prisma.product.findUnique({
      where: { id: productId },
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
                whatsapp: true,
                sellerTier: true,
                customFeeRate: true,
              },
            },
          },
        },
        settings: true,
      },
    });
  }

  /**
   * Create product with default settings
   */
  async createProduct(params: CreateProductParams) {
    // Check tier limits before creating product
    const limitCheck = await TierService.checkProductLimit(params.userId);

    if (!limitCheck.canCreate) {
      const tierConfig = TierServiceClass.getConfig(limitCheck.currentTier);
      const productWord = limitCheck.productCount === 1 ? "produk" : "produk";
      const limitWord = limitCheck.isUnlimited ? "unlimited" : limitCheck.maxProducts;

      throw new Error(
        `Batas ${productWord} tercapai (${limitCheck.productCount}/${limitWord}). ` +
        `Upgrade ke ${limitCheck.currentTier === "FREE" ? "Mulai" : "Bisnis"} untuk membuat lebih banyak produk. ` +
        `/user/subscription`
      );
    }

    return prisma.product.create({
      data: {
        userId: params.userId,
        title: params.title,
        description: params.description,
        price: params.price,
        thumbnail: params.thumbnail,
        category: params.category,
        productType: params.productType || ProductType.TOEFL_SIMULATION,
        settings: {
          create: {
            promoPrice: params.settings?.promoPrice,
            checkoutLink: params.settings?.checkoutLink,
            packageType: params.settings?.packageType,
            examCredits: params.settings?.examCredits || 1,
            certificateIncluded: params.settings?.certificateIncluded ?? true,
            reviewIncluded: params.settings?.reviewIncluded ?? false,
            zoomIncluded: params.settings?.zoomIncluded ?? false,
            affiliateEnabled: params.settings?.affiliateEnabled ?? false,
            affiliateCommission: params.settings?.affiliateCommission || 10,
            isArchived: params.settings?.isArchived ?? false,
            isVisibleOnMicrosite: params.settings?.isVisibleOnMicrosite ?? true,
            isFeatured: params.settings?.isFeatured ?? false,
          },
        },
      },
      include: { settings: true },
    });
  }

  /**
   * Update product basic info
   */
  async updateProduct(productId: string, data: Omit<UpdateProductParams, "settings">) {
    return prisma.product.update({
      where: { id: productId },
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        thumbnail: data.thumbnail,
        category: data.category,
        productType: data.productType,
      },
    });
  }

  /**
   * Update product settings
   */
  async updateSettings(productId: string, data: ProductSettingsData) {
    return prisma.productSettings.upsert({
      where: { productId },
      create: { productId, ...data },
      update: data,
    });
  }

  /**
   * Update product with settings
   */
  async updateProductWithSettings(productId: string, data: UpdateProductParams) {
    const { settings, ...productData } = data;

    return prisma.$transaction(async (tx) => {
      // Update product basic info
      if (Object.keys(productData).length > 0) {
        await tx.product.update({
          where: { id: productId },
          data: productData,
        });
      }

      // Update settings if provided
      if (settings) {
        await tx.productSettings.upsert({
          where: { productId },
          create: { productId, ...settings },
          update: settings,
        });
      }

      // Return updated product
      return tx.product.findUnique({
        where: { id: productId },
        include: { settings: true },
      });
    });
  }

  /**
   * Get effective price (promo price or regular price)
   */
  async getEffectivePrice(productId: string): Promise<number> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { settings: { select: { promoPrice: true } } },
    });

    if (!product) return 0;
    return product.settings?.promoPrice ?? product.price;
  }

  /**
   * Get exam credits for a product
   */
  async getExamCredits(productId: string): Promise<number> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { settings: { select: { examCredits: true } } },
    });

    return product?.settings?.examCredits ?? 1;
  }

  /**
   * Archive product
   */
  async archiveProduct(productId: string) {
    return prisma.productSettings.upsert({
      where: { productId },
      create: { productId, isArchived: true },
      update: { isArchived: true },
    });
  }

  /**
   * Unarchive product
   */
  async unarchiveProduct(productId: string) {
    return prisma.productSettings.update({
      where: { productId },
      data: { isArchived: false },
    });
  }

  /**
   * Toggle visibility on microsite
   */
  async toggleMicrositeVisibility(productId: string, userId: string, visible: boolean) {
    // Get user's tier config from profile
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
      select: { sellerTier: true },
    });

    const sellerTier = profile?.sellerTier || "FREE";
    const tierConfig = TierServiceClass.getConfig(sellerTier);
    const maxVisible = tierConfig.maxMicrositeProducts;
    const isUnlimited = maxVisible === -1;

    // Count current visible products
    const currentVisible = await prisma.product.count({
      where: {
        userId,
        settings: { isArchived: false, isVisibleOnMicrosite: true },
      },
    });

    // If trying to make visible and product is not currently visible
    if (visible && currentVisible >= maxVisible && !isUnlimited) {
      return {
        success: false,
        message: `Batas produk di microsite tercapai (${currentVisible}/${maxVisible}). Upgrade ke tier lebih tinggi untuk menambah produk yang tampil.`,
      };
    }

    // Update visibility
    await prisma.productSettings.upsert({
      where: { productId },
      create: { productId, isVisibleOnMicrosite: visible },
      update: { isVisibleOnMicrosite: visible },
    });

    return {
      success: true,
      message: visible
        ? "Produk akan tampil di microsite"
        : "Produk disembunyikan dari microsite",
    };
  }

  /**
   * Toggle affiliate
   */
  async toggleAffiliate(productId: string, enabled: boolean) {
    return prisma.productSettings.upsert({
      where: { productId },
      create: { productId, affiliateEnabled: enabled },
      update: { affiliateEnabled: enabled },
    });
  }

  /**
   * Toggle featured
   */
  async toggleFeatured(productId: string, featured: boolean) {
    return prisma.productSettings.upsert({
      where: { productId },
      create: { productId, isFeatured: featured },
      update: { isFeatured: featured },
    });
  }

  /**
   * Get products for a user
   */
  async getProductsByUser(userId: string, includeArchived = false) {
    return prisma.product.findMany({
      where: {
        userId,
        ...(includeArchived ? {} : { settings: { isArchived: false } }),
      },
      orderBy: { createdAt: "desc" },
      include: { settings: true },
    });
  }

  /**
   * Get visible products for microsite
   */
  async getVisibleProducts(userId: string) {
    return prisma.product.findMany({
      where: {
        userId,
        settings: { isArchived: false, isVisibleOnMicrosite: true },
      },
      orderBy: { createdAt: "desc" },
      include: { settings: true },
    });
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(userId: string, limit = 10) {
    return prisma.product.findMany({
      where: {
        userId,
        settings: { isArchived: false, isFeatured: true },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { settings: true },
    });
  }

  /**
   * Count products for a user
   */
  async countProducts(userId: string): Promise<number> {
    return prisma.product.count({
      where: { userId, settings: { isArchived: false } },
    });
  }

  /**
   * Count visible products on microsite
   */
  async countVisibleProducts(userId: string): Promise<number> {
    return prisma.product.count({
      where: {
        userId,
        settings: { isArchived: false, isVisibleOnMicrosite: true },
      },
    });
  }

  /**
   * Delete product
   */
  async deleteProduct(productId: string) {
    return prisma.product.delete({
      where: { id: productId },
    });
  }

  /**
   * Get public products by username
   */
  async getPublicProducts(username: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, name: true, username: true, avatar: true },
    });

    if (!user) return null;

    const products = await prisma.product.findMany({
      where: {
        userId: user.id,
        settings: { isArchived: false, isVisibleOnMicrosite: true },
      },
      orderBy: { createdAt: "desc" },
      include: { settings: true },
    });

    return { user, products };
  }
}

export const ProductService = new ProductServiceClass();
