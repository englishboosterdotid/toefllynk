import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { ProductService } from "@/lib/services/ProductService";
import { headers } from "next/headers";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const formData = await req.formData();
    const productId = formData.get("productId") as string;
    const visible = formData.get("visible") === "true";

    if (!productId) {
      return NextResponse.redirect(new URL("/user/products?error=product_required", req.url));
    }

    const result = await ProductService.toggleMicrositeVisibility(productId, user.id, visible);

    // Check if limit exceeded
    if (!result.success) {
      return NextResponse.redirect(new URL(`/user/products?error=max_microsite&message=${encodeURIComponent(result.message || "Batas tercapai")}`, req.url));
    }

    // Redirect back to products page
    const headersList = await headers();
    const referer = headersList.get("referer") || "/user/products";
    return NextResponse.redirect(new URL(referer, req.url));
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.redirect(new URL("/user/products?error=unauthorized", req.url));
    }
    console.error("Toggle visibility error:", error);
    return NextResponse.redirect(new URL("/user/products?error=server_error", req.url));
  }
}
