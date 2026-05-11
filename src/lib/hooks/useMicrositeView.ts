"use client";

import { useEffect } from "react";

/**
 * React hook to track microsite view on component mount
 */
export function useMicrositeView(userId: string) {
  useEffect(() => {
    if (!userId) return;

    fetch("/api/analytics/microsite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    }).catch((err) => {
      console.error("Failed to track microsite view:", err);
    });
  }, [userId]);
}
