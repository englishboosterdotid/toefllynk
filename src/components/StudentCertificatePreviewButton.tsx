"use client";

import { Eye } from "lucide-react";

interface StudentCertificatePreviewButtonProps {
  resultId: string;
  studentName: string;
}

export function StudentCertificatePreviewButton({ resultId, studentName }: StudentCertificatePreviewButtonProps) {
  const openPreview = async () => {
    try {
      const response = await fetch(`/api/student-certificate/${resultId}`);

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
    <button
      onClick={openPreview}
      className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-green-700 transition-colors"
    >
      <Eye className="h-5 w-5" />
      Preview E-Certificate
    </button>
  );
}