import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Award, ArrowLeft, Download, BarChart3, CheckCircle2, BookOpen, Eye } from "lucide-react";
import { getStudentSession } from "@/lib/getStudentSession";
import { getSession } from "@/lib/session";

export default async function StudentResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Auth check
  const student = await getStudentSession();
  const session = await getSession();

  if (!student && !session) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Silakan login terlebih dahulu</p>
          <Link href="/student/login" className="text-blue-600 hover:underline">
            Login Sekarang
          </Link>
        </div>
      </main>
    );
  }

  const result = await prisma.examResult.findUnique({
    where: { id },
    include: {
      student: true,
      product: { select: { title: true, thumbnail: true, reviewIncluded: true, userId: true } },
    },
  });

  if (!result) return notFound();

  // Verify ownership: student owner, product owner, or admin
  const isStudentOwner = student && result.studentId === student.id;
  const isProductOwner = session && result.product.userId === session.userId;
  const isAdmin = session?.role === "ADMIN";

  if (!isStudentOwner && !isProductOwner && !isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Anda tidak memiliki akses ke hasil ini</p>
          <Link href="/student/dashboard" className="text-blue-600 hover:underline mt-2 block">
            Kembali ke Dashboard
          </Link>
        </div>
      </main>
    );
  }

  // Calculate score category
  const getScoreCategory = (score: number) => {
    if (score >= 550) return { label: "Excellent", color: "text-green-600", bg: "bg-green-100" };
    if (score >= 500) return { label: "Good", color: "text-blue-600", bg: "bg-blue-100" };
    if (score >= 450) return { label: "Average", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { label: "Needs Improvement", color: "text-red-600", bg: "bg-red-100" };
  };

  const category = getScoreCategory(result.totalScore);

  // Section percentages (approximate based on correct answers out of ~50 each)
  const maxPerSection = 50;
  const listeningPercent = Math.round((result.listeningCorrect / maxPerSection) * 100);
  const structurePercent = Math.round((result.structureCorrect / maxPerSection) * 100);
  const readingPercent = Math.round((result.readingCorrect / maxPerSection) * 100);

  return (
    <main className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            href="/student/dashboard"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Main Score Card */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-center text-white">
            <div className="inline-flex h-16 w-16 rounded-2xl bg-white/10 items-center justify-center mb-4">
              <Award className="h-8 w-8" />
            </div>
            <p className="text-slate-400 text-sm font-medium tracking-wider uppercase mb-2">
              TOEFL ITP Simulation Result
            </p>
            <h1 className="text-7xl font-bold mb-4">{result.totalScore}</h1>
            <p className="text-slate-300">
              Participant: <span className="text-white font-medium">{result.student.buyerName}</span>
            </p>
            <span className={`inline-block mt-4 px-4 py-1.5 rounded-full text-sm font-medium ${category.bg} ${category.color}`}>
              {category.label}
            </span>
          </div>

          {result.product && (
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                Paket: <span className="font-medium text-slate-700">{result.product.title}</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(result.createdAt).toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
        </div>

        {/* Section Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-50 rounded-xl p-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Detail per Section</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Listening */}
            <div className="bg-purple-50 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-purple-700">Listening</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  result.listeningCorrect >= 40 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                  {result.listeningCorrect >= 40 ? "Baik" : "Perlu latihan"}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold text-purple-900">{result.listeningCorrect}</p>
                <p className="text-sm text-purple-600 mb-1">/{maxPerSection}</p>
              </div>
              <div className="mt-3 h-2 bg-purple-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 transition-all"
                  style={{ width: `${Math.min(listeningPercent, 100)}%` }}
                />
              </div>
            </div>

            {/* Structure */}
            <div className="bg-blue-50 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-blue-700">Structure</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  result.structureCorrect >= 35 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                  {result.structureCorrect >= 35 ? "Baik" : "Perlu latihan"}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold text-blue-900">{result.structureCorrect}</p>
                <p className="text-sm text-blue-600 mb-1">/{maxPerSection}</p>
              </div>
              <div className="mt-3 h-2 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${Math.min(structurePercent, 100)}%` }}
                />
              </div>
            </div>

            {/* Reading */}
            <div className="bg-green-50 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-green-700">Reading</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  result.readingCorrect >= 40 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                  {result.readingCorrect >= 40 ? "Baik" : "Perlu latihan"}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold text-green-900">{result.readingCorrect}</p>
                <p className="text-sm text-green-600 mb-1">/{maxPerSection}</p>
              </div>
              <div className="mt-3 h-2 bg-green-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 transition-all"
                  style={{ width: `${Math.min(readingPercent, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {result.product?.reviewIncluded && (
            <Link
              href={`/student/result/${result.id}/review`}
              className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-green-700 transition-colors"
            >
              <Eye className="h-5 w-5" />
              Review Jawaban
            </Link>
          )}

          <Link
            href={`/api/student-certificate/${result.id}`}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            <Download className="h-5 w-5" />
            Download E-Certificate
          </Link>

          <Link
            href="/student/exam"
            className="inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-8 py-4 rounded-xl font-medium hover:bg-slate-200 transition-colors"
          >
            <CheckCircle2 className="h-5 w-5" />
            Try Again
          </Link>
        </div>

        {/* Tips */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Rekomendasi untuk Anda</h3>
          <ul className="space-y-3">
            {result.listeningCorrect < 40 && (
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-purple-500 mt-0.5">•</span>
                Tingkatkan kemampuan listening dengan sering mendengarkan audio berbahasa Inggris
              </li>
            )}
            {result.structureCorrect < 35 && (
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-blue-500 mt-0.5">•</span>
                Perbanyak latihan grammar dan structure untuk meningkatkan skor di section ini
              </li>
            )}
            {result.readingCorrect < 40 && (
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-green-500 mt-0.5">•</span>
                Latih kemampuan reading comprehension dengan membaca artikel berbahasa Inggris secara rutin
              </li>
            )}
            <li className="flex items-start gap-2 text-sm text-slate-600">
              <span className="text-slate-500 mt-0.5">•</span>
              Gunakan credit tersisa untuk practice dan terbiasa dengan format TOEFL
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}