import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  FileText,
  Monitor,
  BarChart3,
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BarChart,
} from "lucide-react";
import { AnimatedContainer } from "@/components/animations";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Counts
  const totalUsers = await prisma.user.count();
  const totalProducts = await prisma.product.count();
  const totalOrders = await prisma.order.count();
  const totalStudents = await prisma.studentAccount.count();
  const totalConversions = await prisma.affiliateConversion.count();
  const totalResults = await prisma.examResult.count();

  // Orders stats
  const completedOrders = await prisma.order.count({ where: { status: "COMPLETED" } });
  const pendingOrders = await prisma.order.count({ where: { status: "PENDING" } });

  // Revenue
  const fees = await prisma.adminPlatformFee.aggregate({ _sum: { feeAmount: true } });
  const totalRevenue = fees._sum.feeAmount || 0;

  // Recent orders
  const recentOrders = await prisma.order.findMany({
    include: {
      product: {
        include: { settings: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Recent exam results
  const recentResults = await prisma.examResult.findMany({
    include: { student: { select: { buyerName: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Active sessions
  const activeSessions = await prisma.examSession.count({ where: { status: "IN_PROGRESS" } });
  const sessionsWithWarnings = await prisma.examActivityLog.groupBy({
    by: ["sessionId"],
    where: { activityType: { in: ["TAB_SWITCH", "FULLSCREEN_EXIT"] } },
  });

  const colorClasses: Record<string, { bg: string; text: string; icon: string; border: string }> = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", icon: "bg-blue-100", border: "border-blue-200" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", icon: "bg-purple-100", border: "border-purple-200" },
    green: { bg: "bg-green-50", text: "text-green-600", icon: "bg-green-100", border: "border-green-200" },
    orange: { bg: "bg-orange-50", text: "text-orange-600", icon: "bg-orange-100", border: "border-orange-200" },
    red: { bg: "bg-red-50", text: "text-red-600", icon: "bg-red-100", border: "border-red-200" },
  };

  return (
    <main className="p-8 space-y-8">
      {/* Page Header */}
      <AnimatedContainer>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="mt-1 text-slate-500">Selamat datang di panel administrasi TOEFL Lynk</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/exam-monitoring"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Monitor className="h-4 w-4" />
              Live Monitor
            </Link>
          </div>
        </div>
      </AnimatedContainer>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <AnimatedContainer delay={0.1}>
          <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-lg ${colorClasses.blue.bg} flex items-center justify-center mb-3`}>
              <Users className={`h-5 w-5 ${colorClasses.blue.text}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalUsers.toLocaleString("id-ID")}</p>
            <p className="text-sm text-slate-500">Total Users</p>
          </div>
        </AnimatedContainer>

        <AnimatedContainer delay={0.1}>
          <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-lg ${colorClasses.green.bg} flex items-center justify-center mb-3`}>
              <Package className={`h-5 w-5 ${colorClasses.green.text}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalProducts.toLocaleString("id-ID")}</p>
            <p className="text-sm text-slate-500">Products</p>
          </div>
        </AnimatedContainer>

        <AnimatedContainer delay={0.1}>
          <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-lg ${colorClasses.purple.bg} flex items-center justify-center mb-3`}>
              <CheckCircle2 className={`h-5 w-5 ${colorClasses.purple.text}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalStudents.toLocaleString("id-ID")}</p>
            <p className="text-sm text-slate-500">Students</p>
          </div>
        </AnimatedContainer>

        <AnimatedContainer delay={0.1}>
          <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-lg ${colorClasses.orange.bg} flex items-center justify-center mb-3`}>
              <ShoppingCart className={`h-5 w-5 ${colorClasses.orange.text}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalOrders.toLocaleString("id-ID")}</p>
            <p className="text-sm text-slate-500">Orders</p>
          </div>
        </AnimatedContainer>

        <AnimatedContainer delay={0.1}>
          <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-lg ${colorClasses.blue.bg} flex items-center justify-center mb-3`}>
              <FileText className={`h-5 w-5 ${colorClasses.blue.text}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalResults.toLocaleString("id-ID")}</p>
            <p className="text-sm text-slate-500">Exam Results</p>
          </div>
        </AnimatedContainer>

        <AnimatedContainer delay={0.1}>
          <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-lg ${colorClasses.green.bg} flex items-center justify-center mb-3`}>
              <DollarSign className={`h-5 w-5 ${colorClasses.green.text}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalConversions.toLocaleString("id-ID")}</p>
            <p className="text-sm text-slate-500">Affiliate Sales</p>
          </div>
        </AnimatedContainer>
      </div>

      {/* Revenue & Status Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Card */}
        <AnimatedContainer delay={0.2}>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white lg:col-span-2">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-slate-400 text-sm">Platform Fee Revenue</p>
                <p className="text-4xl font-bold mt-2">
                  Rp {totalRevenue.toLocaleString("id-ID")}
                </p>
                <div className="flex items-center gap-2 mt-2 text-green-400 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span>+12.5% from last month</span>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <BarChart className="h-8 w-8" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-sm text-slate-400">Completed Orders</p>
                <p className="text-2xl font-bold mt-1">{completedOrders}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-sm text-slate-400">Pending Orders</p>
                <p className="text-2xl font-bold mt-1">{pendingOrders}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-sm text-slate-400">Total Exams</p>
                <p className="text-2xl font-bold mt-1">{totalResults}</p>
              </div>
            </div>
          </div>
        </AnimatedContainer>

        {/* Live Monitor Quick View */}
        <AnimatedContainer delay={0.2}>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Exam Status</h3>
              <Link href="/admin/exam-monitoring" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View All
              </Link>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium text-slate-700">Active Exams</span>
                </div>
                <span className="text-lg font-bold text-green-700">{activeSessions}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-slate-700">With Warnings</span>
                </div>
                <span className="text-lg font-bold text-amber-700">{sessionsWithWarnings.length}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Award className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-slate-700">Total Attempts</span>
                </div>
                <span className="text-lg font-bold text-blue-700">{totalResults}</span>
              </div>
            </div>

            <Link
              href="/admin/exam-monitoring"
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all"
            >
              <Monitor className="h-4 w-4" />
              Open Live Monitor
            </Link>
          </div>
        </AnimatedContainer>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <AnimatedContainer delay={0.3}>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
              <Link href="/admin/orders" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                View All <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentOrders.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>Belum ada pesanan</p>
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
                      {order.product?.thumbnail ? (
                        <img src={order.product.thumbnail} className="h-full w-full object-cover" alt="" />
                      ) : (
                        <Package className="h-6 w-6 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{order.product?.title || "Unknown Product"}</p>
                      <p className="text-sm text-slate-500">{order.buyerName}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        order.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : order.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {order.status}
                      </span>
                      {order.referralCode && (
                        <p className="text-xs text-slate-400 mt-1">Ref: {order.referralCode}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        Rp {(order.product?.settings?.promoPrice || order.product?.price || 0).toLocaleString("id-ID")}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(order.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </AnimatedContainer>

        {/* Recent Exam Results */}
        <AnimatedContainer delay={0.3}>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Recent Exam Results</h2>
              <Link href="/admin/analytics" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                View All <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentResults.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>Belum ada hasil ujian</p>
                </div>
              ) : (
                recentResults.map((result) => (
                  <div key={result.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                      {result.totalScore}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{result.student.buyerName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">L: {result.listeningCorrect}</span>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">S: {result.structureCorrect}</span>
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">R: {result.readingCorrect}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        result.totalScore >= 550
                          ? "bg-green-100 text-green-700"
                          : result.totalScore >= 500
                          ? "bg-blue-100 text-blue-700"
                          : result.totalScore >= 450
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {result.totalScore >= 550 ? "Excellent" : result.totalScore >= 500 ? "Good" : result.totalScore >= 450 ? "Average" : "Needs Work"}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(result.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </AnimatedContainer>
      </div>

      {/* Quick Links */}
      <AnimatedContainer delay={0.4}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/questions"
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Questions</p>
              <p className="text-sm text-slate-500">Manage question bank</p>
            </div>
          </Link>

          <Link
            href="/admin/products"
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all group"
          >
            <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Products</p>
              <p className="text-sm text-slate-500">Manage products</p>
            </div>
          </Link>

          <Link
            href="/admin/analytics"
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-green-300 hover:shadow-md transition-all group"
          >
            <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Analytics</p>
              <p className="text-sm text-slate-500">View statistics</p>
            </div>
          </Link>

          <Link
            href="/leaderboard"
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all group"
          >
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <Award className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Leaderboard</p>
              <p className="text-sm text-slate-500">View rankings</p>
            </div>
          </Link>
        </div>
      </AnimatedContainer>
    </main>
  );
}