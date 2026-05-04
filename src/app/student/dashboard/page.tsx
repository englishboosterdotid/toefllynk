import prisma from "@/lib/prisma";
import { getStudentSession } from "@/lib/getStudentSession";
import Link from "next/link";
import { BookOpen, Award, CreditCard, ArrowRight, Clock, Target, TrendingUp, LogOut } from "lucide-react";
import { LogoutButton } from "./LogoutButton";

export default async function StudentDashboardPage() {
  const student = await getStudentSession();

  if (!student) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Session Invalid</h1>
          <p className="text-slate-500">Silakan login terlebih dahulu</p>
          <Link href="/student/login" className="inline-block mt-4 text-blue-600 hover:underline">
            Login Sekarang
          </Link>
        </div>
      </main>
    );
  }

  const credits = await prisma.studentExamCredit.findMany({
    where: { studentId: student.id },
  });

  const totalAvailable = credits.reduce((sum, item) => sum + (item.totalCredit - item.usedCredit), 0);

  const results = await prisma.examResult.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const latestResult = results[0];

  // Calculate average score
  const avgScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.totalScore, 0) / results.length)
    : 0;

  return (
    <main className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">TOEFLLYNK</h1>
              <p className="text-xs text-slate-400">Student Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:block">{student.buyerEmail}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Selamat Datang, {student.buyerName}!</h1>
          <p className="text-slate-500 mt-1">Siap untuk latihan TOEFL hari ini?</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start justify-between">
              <div className="bg-blue-50 rounded-xl p-3">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-500">Exam Credits Tersedia</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{totalAvailable}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start justify-between">
              <div className="bg-green-50 rounded-xl p-3">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <Target className="h-5 w-5 text-green-500" />
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-500">Tes Selesai</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{results.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start justify-between">
              <div className="bg-purple-50 rounded-xl p-3">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <Clock className="h-5 w-5 text-purple-500" />
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-500">Rata-rata Skor</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{avgScore || "-"}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start justify-between">
              <div className="bg-orange-50 rounded-xl p-3">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
              <Award className="h-5 w-5 text-orange-500" />
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-500">Skor Tertinggi</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {results.length > 0 ? Math.max(...results.map(r => r.totalScore)) : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Start Exam CTA */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Mulai Simulasi TOEFL</h2>
              <p className="text-blue-100 mt-2">Uji kemampuan bahasa Inggris Anda dengan simulasi TOEFL ITP</p>
            </div>
            {totalAvailable > 0 ? (
              <Link
                href="/student/exam"
                className="flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-medium hover:bg-blue-50 transition-colors"
              >
                Start Exam
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <div className="bg-white/20 px-6 py-3 rounded-xl text-white/80">
                Tidak ada credit tersedia
              </div>
            )}
          </div>
        </div>

        {/* Upgrade Banner */}
        {!student.userId && (
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2">Jadilah Partner TOEFLLYNK</h2>
                <p className="text-slate-300">
                  Upgrade ke akun partner dan mulai earn komisi affiliate
                </p>
              </div>
              <Link
                href={`/student/upgrade/${student.id}`}
                className="flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-medium hover:bg-slate-100 transition-colors"
              >
                Upgrade Akun
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Recent Results */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Hasil Terbaru</h2>
            <Link href="/student/results" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Lihat Semua
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {results.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500">
                <Target className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>Belum ada hasil tes</p>
                <p className="text-sm text-slate-400 mt-1">Mulai tes untuk melihat hasil di sini</p>
              </div>
            ) : (
              results.map((result) => (
                <Link
                  key={result.id}
                  href={`/student/result/${result.id}`}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {result.totalScore}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">Skor Total: {result.totalScore}</p>
                    <p className="text-sm text-slate-500">
                      L: {result.listeningCorrect} | S: {result.structureCorrect} | R: {result.readingCorrect}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">
                      {new Date(result.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}