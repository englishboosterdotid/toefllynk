import { ProductType, PackageType, SellerTier } from "@/generated/prisma/enums";
import { productRepository, userRepository, type ProductWithUser } from "@/lib/repositories";
import { TierService, TierServiceClass } from "@/lib/services/TierService";

export async function getProductsByUser(userId: string): Promise<ProductWithUser[]> {
  return productRepository.findByUserId(userId);
}

export async function getArchivedProductsByUser(userId: string): Promise<ProductWithUser[]> {
  return productRepository.findArchivedByUserId(userId);
}

export async function getProductById(id: string): Promise<ProductWithUser | null> {
  return productRepository.findById(id);
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
  // Check tier limits before creating product
  const limitCheck = await TierService.checkProductLimit(data.userId);

  if (!limitCheck.canCreate) {
    const tierConfig = TierServiceClass.getConfig(limitCheck.currentTier);
    const productWord = limitCheck.productCount === 1 ? "produk" : "produk";
    const limitWord = limitCheck.isUnlimited ? "unlimited" : limitCheck.maxProducts;

    throw new Error(
      `Batas ${productWord} tercapai (${limitCheck.productCount}/${limitWord}). ` +
      `Upgrade ke ${limitCheck.currentTier === "FREE" ? "Mulai" : limitCheck.currentTier === "BASIC" ? "Berkembang" : "Bisnis"} untuk membuat lebih banyak produk. ` +
      `/user/subscription`
    );
  }

  return productRepository.create(data);
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
): Promise<ProductWithUser | null> {
  return productRepository.update(id, data);
}

export async function archiveProduct(id: string): Promise<ProductWithUser | null> {
  return productRepository.archive(id);
}

export async function unarchiveProduct(id: string): Promise<ProductWithUser | null> {
  return productRepository.unarchive(id);
}

export async function setMicrositeVisibility(
  productId: string,
  userId: string,
  visible: boolean
): Promise<{ success: boolean; message: string }> {
  // Get user's tier config
  const user = await productRepository.findByIdWithOwner(productId);

  if (!user) {
    throw new Error("Product not found");
  }

  if (user.user.id !== userId) {
    throw new Error("Unauthorized");
  }

  const tierConfig = TierServiceClass.getConfig(user.user.sellerTier as SellerTier);
  const maxVisible = tierConfig.maxMicrositeProducts;
  const isUnlimited = maxVisible === -1;

  // Count current visible products
  const currentVisible = await productRepository.countVisibleOnMicrosite(userId);

  // If trying to make visible and product is not currently visible
  if (visible && !user.isVisibleOnMicrosite) {
    if (!isUnlimited && currentVisible >= maxVisible) {
      return {
        success: false,
        message: `Batas produk di microsite tercapai (${currentVisible}/${maxVisible}). Upgrade ke tier lebih tinggi untuk menambah produk yang tampil.`,
      };
    }
  }

  // Update visibility
  await productRepository.toggleVisibility(productId, visible);

  return {
    success: true,
    message: visible
      ? "Produk akan tampil di microsite"
      : "Produk disembunyikan dari microsite",
  };
}

export async function getProductWithAffiliateInfo(productId: string, referralCode: string) {
  return productRepository.findWithAffiliateInfo(productId, referralCode);
}

export async function getPublicProducts(username: string) {
  const user = await userRepository.findByUsername(username);

  if (!user) return null;

  const products = await productRepository.findByUserId(user.id);

  return { user, products };
}

export async function getProductOwner(productId: string) {
  const product = await productRepository.findByIdWithOwner(productId);
  return product?.user || null;
}