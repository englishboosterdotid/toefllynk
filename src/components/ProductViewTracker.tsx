"use client";

import { useProductView } from "@/lib/hooks/useProductView";

interface ProductViewTrackerProps {
  productId: string;
}

export function ProductViewTracker({ productId }: ProductViewTrackerProps) {
  useProductView(productId);
  return null;
}
