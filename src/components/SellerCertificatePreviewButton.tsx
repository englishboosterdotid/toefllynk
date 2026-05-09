"use client";

import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SellerCertificatePreviewButtonProps {
  template: {
    title: string;
    subtitle: string;
    showLogo: boolean;
    logoUrl: string | null;
    backgroundImage: string | null;
    footerText?: string | null;
    validityDays?: number | null;
  };
}

export function SellerCertificatePreviewButton({ template }: SellerCertificatePreviewButtonProps) {
  const openPreview = async () => {
    try {
      const response = await fetch("/api/student-certificate/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate preview");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Open in new tab
      window.open(url, "_blank");
    } catch (error) {
      console.error("Preview error:", error);
      alert("Gagal memuat preview");
    }
  };

  return (
    <Button variant="outline" onClick={openPreview}>
      <Eye className="h-4 w-4 mr-2" />
      Preview Template
    </Button>
  );
}