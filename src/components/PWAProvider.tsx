"use client";

import { useEffect } from "react";

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register service worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("[PWA] Service Worker registered:", registration.scope);

            // Check for updates
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                    // New content available, prompt user to refresh
                    console.log("[PWA] New content available, refresh to update");
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error("[PWA] Service Worker registration failed:", error);
          });
      });
    }

    // Handle install prompt
    let deferredPrompt: BeforeInstallPromptEvent | null = null;

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;

      // You can show your own install button here
      // or let the browser handle it with the A2HS banner
    });

    window.addEventListener("appinstalled", () => {
      console.log("[PWA] App installed");
      deferredPrompt = null;
      // Track installation analytics here
    });

    // Detect if running as PWA
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) {
      console.log("[PWA] Running as standalone app");
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", () => {});
    };
  }, []);

  return <>{children}</>;
}

// Type for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
  preventDefault(): void;
}

// Hook for PWA install prompt
export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("[PWA] User accepted install");
    } else {
      console.log("[PWA] User dismissed install");
    }

    setDeferredPrompt(null);
    setCanInstall(false);
  };

  return { canInstall, install };
}

// Add missing import
import { useState } from "react";