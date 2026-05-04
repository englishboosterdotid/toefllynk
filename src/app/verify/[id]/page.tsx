import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CheckCircle2, Award, Calendar, User, TrendingUp } from "lucide-react";

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await prisma.examResult.findUnique({
    where: { id },
    include: {
      student: true,
      product: { select: { title: true } },
    },
  });

  if (!result) return notFound();

  const date = new Date(result.createdAt);
  const formattedDate = date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const getScoreCategory = (score: number) => {
    if (score >= 550) return { label: "Excellent", color: "text-green-600", bg: "bg-green-100", border: "border-green-300" };
    if (score >= 500) return { label: "Good", color: "text-blue-600", bg: "bg-blue-100", border: "border-blue-300" };
    if (score >= 450) return { label: "Average", color: "text-yellow-600", bg: "bg-yellow-100", border: "border-yellow-300" };
    return { label: "Needs Improvement", color: "text-red-600", bg: "bg-red-100", border: "border-red-300" };
  };

  const category = getScoreCategory(result.totalScore);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Verification Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 font-medium text-sm">
            <CheckCircle2 className="h-5 w-5" />
            Verified Certificate
          </div>
        </div>

        {/* Certificate Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-center text-white">
            <Award className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">TOEFL ITP Simulation</h1>
            <p className="text-blue-200">Certificate of Completion</p>
            <div className={`inline-block mt-4 px-4 py-1 rounded-full text-sm font-medium bg-white/20`}>
              {category.label}
            </div>
          </div>

          {/* Body */}
          <div className="p-8">
            {/* Student Info */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 text-slate-500 mb-2">
                <User className="h-4 w-4" />
                <span className="text-sm">Certificate Holder</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900">{result.student.buyerName}</h2>
              {result.student.buyerEmail && (
                <p className="text-slate-500 mt-1">{result.student.buyerEmail}</p>
              )}
            </div>

            {/* Score Display */}
            <div className="bg-slate-50 rounded-2xl p-6 mb-6">
              <div className="text-center mb-6">
                <p className="text-sm text-slate-500 mb-2">Predicted TOEFL Score</p>
                <p className={`text-6xl font-black ${category.color}`}>{result.totalScore}</p>
              </div>

              {/* Section Scores */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-purple-700">{result.listeningCorrect}</p>
                  <p className="text-xs text-purple-600 mt-1">Listening</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-700">{result.structureCorrect}</p>
                  <p className="text-xs text-blue-600 mt-1">Structure</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-700">{result.readingCorrect}</p>
                  <p className="text-xs text-green-600 mt-1">Reading</p>
                </div>
              </div>
            </div>

            {/* Meta Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Date of Examination</span>
                </div>
                <span className="font-medium text-slate-900">{formattedDate}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-500">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">Category</span>
                </div>
                <span className={`font-medium ${category.color}`}>{category.label}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2 text-slate-500">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm">Certificate ID</span>
                </div>
                <span className="font-mono text-sm text-slate-600">{id.slice(0, 12)}...</span>
              </div>
            </div>

            {/* Footer Note */}
            <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-sm text-amber-800 text-center">
                This certificate was issued through TOEFL Lynk Platform.
                <br />
                <span className="text-xs text-amber-600">Generated on {new Date().toLocaleDateString("id-ID")}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}