"use client";

import { useEffect } from "react";

interface AffiliateTrackerProps {
  referralCode: string;
  productId: string;
}

export function AffiliateTracker({ referralCode, productId }: AffiliateTrackerProps) {
  useEffect(() => {
    // Record the click in the background
    fetch("/api/affiliate/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralCode, productId }),
    }).catch((err) => {
      console.error("[AffiliateTracker] Failed to track click:", err);
    });
  }, [referralCode, productId]);

  return null;
}
