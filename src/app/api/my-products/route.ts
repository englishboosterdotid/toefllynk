import { requireUser } from "@/lib/requireUser";
import { TierServiceClass } from "@/lib/services/TierService";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireUser();

    const products = await prisma.product.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { settings: true },
    });

    // Get tier info for visibility limit
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      select: { sellerTier: true },
    });
    const sellerTier = profile?.sellerTier || "FREE";
    const tierConfig = TierServiceClass.getConfig(sellerTier);
    const maxMicrositeProducts = tierConfig.maxMicrositeProducts;

    // Count visible products (exclude archived)
    const visibleCount = products.filter((p) => !p.settings?.isArchived && p.settings?.isVisibleOnMicrosite).length;

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