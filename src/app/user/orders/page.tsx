export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/services/authService";
import { OrderStatus, PackageType } from "@/generated/prisma/enums";
import { OrdersTable } from "./OrdersTable";
import {
  ShoppingCart,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
} from "lucide-react";

export default async function OrdersPage() {
  const user = await getCurrentUser();

  const orders = await prisma.order.findMany({
    where: {
      product: {
        userId: user?.id,
      },
    },
    include: {
      product: true,
      affiliateConversion: true,
      student: {
        include: {
          credits: true,
          results: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate stats
  const pendingOrders = orders.filter((o) => o.status === OrderStatus.PENDING);
  const completedOrders = orders.filter((o) => o.status === OrderStatus.COMPLETED);
  const cancelledOrders = orders.filter((o) => o.status === OrderStatus.CANCELLED);
  const totalRevenue = completedOrders.reduce(
    (sum, o) => sum + (o.product?.promoPrice || o.product?.price || 0),
    0
  );
  const totalAffiliateCommission = completedOrders.reduce(
    (sum, o) => sum + (o.affiliateConversion?.commissionAmount || 0),
    0
  );
  const netRevenue = totalRevenue - totalAffiliateCommission;

  // Student stats - count unique students with remaining credits
  const studentAccounts = await prisma.studentAccount.findMany({
    where: {
      ownerUserId: user?.id,
    },
    include: {
      credits: true,
    },
  });

  const totalStudents = studentAccounts.length;
  const activeStudents = studentAccounts.filter((student) => {
    const remainingCredits = student.credits.reduce(
      (sum, c) => sum + (c.totalCredit - c.usedCredit),
      0
    );
    return remainingCredits > 0;
  }).length;

  // Test stats
  const totalTests = completedOrders.reduce(
    (sum, o) => sum + (o.student?.results.length || 0),
    0
  );
  const avgScore = completedOrders.reduce((sum, o) => {
    const results = o.student?.results || [];
    if (results.length === 0) return sum;
    const latestScore = results[0]?.totalScore || 0;
    return sum + latestScore;
  }, 0) / (completedOrders.filter((o) => o.student?.results.length).length || 1);

  return (
    <main className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Orders & Analytics</h1>
        <p className="text-slate-500 mt-1">
          Monitor sales, student progress, and revenue
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="h-6 w-6 opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              Net
            </span>
          </div>
          <p className="text-2xl font-bold">
            Rp {netRevenue.toLocaleString("id-ID")}
          </p>
          <p className="text-xs text-green-100 mt-1">Net Revenue</p>
        </div>

        {/* Gross Revenue */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-purple-100 rounded-xl p-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900">
            Rp {totalRevenue.toLocaleString("id-ID")}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Gross ({completedOrders.length} orders)
          </p>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-amber-100 rounded-xl p-2">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            {pendingOrders.length > 0 && (
              <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                {pendingOrders.length}
              </span>
            )}
          </div>
          <p className="text-xl font-bold text-slate-900">
            {pendingOrders.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Pending Payment</p>
        </div>

        {/* Students */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-100 rounded-xl p-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900">
            {activeStudents}/{totalStudents}
          </p>
          <p className="text-xs text-slate-500 mt-1">Active Students</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
          <div className="bg-slate-100 rounded-lg p-2">
            <ShoppingCart className="h-4 w-4 text-slate-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">
              {orders.length}
            </p>
            <p className="text-xs text-slate-500">Total Orders</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
          <div className="bg-slate-100 rounded-lg p-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">
              {completedOrders.length}
            </p>
            <p className="text-xs text-slate-500">Completed</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
          <div className="bg-slate-100 rounded-lg p-2">
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">{totalTests}</p>
            <p className="text-xs text-slate-500">Tests Taken</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
          <div className="bg-slate-100 rounded-lg p-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">
              {Math.round(avgScore)}
            </p>
            <p className="text-xs text-slate-500">Avg Score</p>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <OrdersTable orders={orders} />
    </main>
  );
}