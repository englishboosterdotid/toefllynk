"use client";

import Link from "next/link";
import { Eye, Download, CheckCircle2 } from "lucide-react";
import { StudentCertificatePreviewButton } from "@/components/StudentCertificatePreviewButton";

interface StudentResultActionsProps {
  resultId: string;
  studentName: string;
  reviewIncluded: boolean;
}

export function StudentResultActions({ resultId, studentName, reviewIncluded }: StudentResultActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      {reviewIncluded && (
        <Link
          href={`/student/result/${resultId}/review`}
          className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-green-700 transition-colors"
        >
          <Eye className="h-5 w-5" />
          Review Jawaban
        </Link>
      )}

      <StudentCertificatePreviewButton
        resultId={resultId}
        studentName={studentName}
      />

      <a
        href={`/api/student-certificate/${resultId}`}
        className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-blue-700 transition-colors"
        download
      >
        <Download className="h-5 w-5" />
        Download E-Certificate
      </a>

      <Link
        href="/student/exam"
        className="inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-8 py-4 rounded-xl font-medium hover:bg-slate-200 transition-colors"
      >
        <CheckCircle2 className="h-5 w-5" />
        Try Again
      </Link>
    </div>
  );
}