import { requireUser } from "@/lib/requireUser";
import { productRepository } from "@/lib/repositories";
import { TierServiceClass } from "@/lib/services/TierService";

export async function GET() {
  try {
    const user = await requireUser();

    const products = await productRepository.findByUserId(user.id);

    // Get tier info for visibility limit
    const tierConfig = TierServiceClass.getConfig(user.sellerTier || "FREE");
    const maxMicrositeProducts = tierConfig.maxMicrositeProducts;

    // Count visible products
    const visibleCount = products.filter((p) => p.isVisibleOnMicrosite).length;

    return Response.json({
      products,
      tierInfo: {
        maxMicrositeProducts,
        visibleCount,
        isUnlimited: maxMicrositeProducts === -1,
      },
    });
  } catch {
    return Response.json({ products: [], tierInfo: null });
  }
}