"use client";

import { useEffect } from "react";

/**
 * React hook to track product view on component mount
 */
export function useProductView(productId: string) {
  useEffect(() => {
    if (!productId) return;

    // Track view via API
    fetch("/api/analytics/product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    }).catch((err) => {
      console.error("Failed to track product view:", err);
    });
  }, [productId]);
}

/**
 * Track product view on click/redirect
 */
export async function trackProductClick(productId: string): Promise<void> {
  try {
    await fetch("/api/analytics/product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
  } catch (err) {
    console.error("Failed to track product click:", err);
  }
}