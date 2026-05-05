import { requireUser } from "@/lib/requireUser";
import { createProduct } from "@/lib/services/productService";
import { ProductType, PackageType } from "@/generated/prisma/enums";
import { cache, CacheKeys } from "@/lib/cache";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const user = await requireUser();

    const packageTypeValue = formData.get("packageType") as string;
    const productTypeValue = formData.get("productType") as string;
    const categoryValue = formData.get("category") as string;

    const certificateIncluded = formData.get("certificateIncluded");
    const reviewIncluded = formData.get("reviewIncluded");
    const zoomIncluded = formData.get("zoomIncluded");
    const affiliateEnabled = formData.get("affiliateEnabled");

    await createProduct({
      userId: user.id,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      packageType: packageTypeValue as PackageType,
      productType: productTypeValue as ProductType,
      examCredits: Number(formData.get("examCredits")) || 1,
      price: Number(formData.get("price")),
      promoPrice: Number(formData.get("promoPrice")) || null,
      thumbnail: formData.get("thumbnail") as string,
      category: categoryValue || null,
      certificateIncluded: certificateIncluded === "true" || certificateIncluded === "on",
      reviewIncluded: reviewIncluded === "true" || reviewIncluded === "on",
      zoomIncluded: zoomIncluded === "true" || zoomIncluded === "on",
      affiliateEnabled: affiliateEnabled === "true" || affiliateEnabled === "on",
    });
    
    // Invalidate products cache
    cache.delete(CacheKeys.PRODUCTS);

    return Response.json({ success: true, message: "Produk berhasil dibuat" });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 400 });
  }
}
