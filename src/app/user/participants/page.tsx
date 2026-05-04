export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/requireUser";
import Link from "next/link";
import { Users, CreditCard, Target, ShoppingCart, TrendingUp, ArrowRight, Mail, Phone } from "lucide-react";

export default async function ParticipantsPage() {
  const user = await requireUser();

  const students = await prisma.studentAccount.findMany({
    where: {
      ownerUserId: user.id,
    },
    include: {
      user: true,
      credits: true,
      results: {
        orderBy: { createdAt: "desc" },
      },
      orders: {
        include: { product: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalStudents = students.length;
  const totalCredits = students.reduce((sum, s) => sum + s.credits.reduce((a, c) => a + c.totalCredit, 0), 0);
  const totalUsedCredits = students.reduce((sum, s) => sum + s.credits.reduce((a, c) => a + c.usedCredit, 0), 0);
  const avgScore = students.length > 0
    ? Math.round(students.reduce((sum, s) => sum + (s.results[0]?.totalScore || 0), 0) / students.filter(s => s.results.length > 0).length) || 0
    : 0;

  const getHealthColor = (status: string) => {
    switch (status) {
      case "ACTIVE USER": return "bg-green-100 text-green-700";
      case "UPSELL POTENTIAL": return "bg-yellow-100 text-yellow-700";
      case "CREDIT EMPTY": return "bg-red-100 text-red-700";
      default: return "bg-blue-100 text-blue-700";
    }
  };

  return (
    <main className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Student CRM Center</h1>
        <p className="text-slate-500 mt-1">Monitor student activity, score progress, and upsell opportunities</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div className="bg-blue-50 rounded-xl p-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-500">Total Students</p>
            <p className="text-3xl font-bold text-slate-900">{totalStudents}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div className="bg-purple-50 rounded-xl p-3">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-500">Available Credits</p>
            <p className="text-3xl font-bold text-slate-900">{totalCredits - totalUsedCredits}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div className="bg-green-50 rounded-xl p-3">
              <Target className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-500">Avg Score</p>
            <p className="text-3xl font-bold text-slate-900">{avgScore || "-"}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div className="bg-orange-50 rounded-xl p-3">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-500">Upsell Potential</p>
            <p className="text-3xl font-bold text-slate-900">
              {students.filter(s => !s.userId || s.results[0]?.totalScore < 450 || s.credits.reduce((a, c) => a + (c.totalCredit - c.usedCredit), 0) <= 0).length}
            </p>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="space-y-4">
        {students.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-lg text-slate-500">Belum ada student</p>
            <p className="text-sm text-slate-400">Student akan muncul setelah ada pembelian paket</p>
          </div>
        ) : (
          students.map((student) => {
            const totalCredit = student.credits.reduce((sum, c) => sum + c.totalCredit, 0);
            const usedCredit = student.credits.reduce((sum, c) => sum + c.usedCredit, 0);
            const remainingCredit = totalCredit - usedCredit;
            const latestScore = student.results[0]?.totalScore || null;
            const completedTests = student.results.length;
            const lastOrder = student.orders[0];

            let health = "NEW STUDENT";
            if (completedTests > 0 && remainingCredit > 0) health = "ACTIVE USER";
            if (remainingCredit <= 0) health = "CREDIT EMPTY";
            if (latestScore && latestScore < 450) health = "UPSELL POTENTIAL";

            return (
              <div key={student.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                        {student.buyerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{student.buyerName}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {student.buyerEmail}</span>
                          {student.buyerWhatsapp && (
                            <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {student.buyerWhatsapp}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getHealthColor(health)}`}>
                        {health}
                      </span>
                      {student.userId && (
                        <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Affiliate Partner
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Credits Left</p>
                      <p className="text-2xl font-bold text-slate-900">{remainingCredit}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Completed Tests</p>
                      <p className="text-2xl font-bold text-slate-900">{completedTests}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Latest Score</p>
                      <p className="text-2xl font-bold text-slate-900">{latestScore || "-"}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Last Purchase</p>
                      <p className="text-sm font-semibold text-slate-900 truncate">{lastOrder?.product.title || "-"}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-slate-500">Access Token:</span>
                      <code className="ml-2 text-blue-600 font-mono">{student.accessToken}</code>
                    </div>
                    <Link
                      href={`/user/student-access/${student.id}`}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      Resend Access <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Action Suggestions */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 flex-wrap">
                  {remainingCredit <= 0 && (
                    <span className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm">
                      <ShoppingCart className="h-4 w-4" /> Suggest New Package
                    </span>
                  )}
                  {latestScore && latestScore < 450 && (
                    <span className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-full text-sm">
                      <Target className="h-4 w-4" /> Offer Intensive Mentoring
                    </span>
                  )}
                  {!student.userId && (
                    <span className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm">
                      <TrendingUp className="h-4 w-4" /> Potential Affiliate Upgrade
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}