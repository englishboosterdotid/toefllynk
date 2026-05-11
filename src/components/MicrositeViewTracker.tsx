"use client";

import { useMicrositeView } from "@/lib/hooks/useMicrositeView";

interface MicrositeViewTrackerProps {
  userId: string;
}

export function MicrositeViewTracker({ userId }: MicrositeViewTrackerProps) {
  useMicrositeView(userId);
  return null;
}
