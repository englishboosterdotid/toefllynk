export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/services/authService";
import { OrderStatus } from "@/generated/prisma/enums";
import { OrdersTable } from "./OrdersTable";
import {
  ShoppingCart,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  TrendingUp,
  Percent,
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
      product: {
        include: { settings: true },
      },
      affiliateConversion: true,
      adminFee: true,
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
    (sum, o) => sum + (o.product?.settings?.promoPrice || o.product?.price || 0),
    0
  );
  const totalAffiliateCommission = completedOrders.reduce(
    (sum, o) => sum + (o.affiliateConversion?.commissionAmount || 0),
    0
  );
  const totalPlatformFee = completedOrders.reduce(
    (sum, o) => sum + (o.adminFee?.feeAmount || 0),
    0
  );
  const netOwnSales = totalRevenue - totalAffiliateCommission - totalPlatformFee;

  // Calculate withdrawals
  const userWithdrawals = await prisma.withdrawalRequest.findMany({
    where: { userId: user?.id },
  });
  const totalWithdrawn = userWithdrawals
    .filter((w) => w.status === "COMPLETED")
    .reduce((sum, w) => sum + w.amount, 0);
  const pendingAmount = userWithdrawals
    .filter((w) => w.status === "PENDING")
    .reduce((sum, w) => sum + w.amount, 0);

  // Get affiliate earnings from other users' products
  const affiliateEarnings = await prisma.affiliateConversion.aggregate({
    where: { affiliateUserId: user?.id },
    _sum: { commissionAmount: true },
  });
  const totalAffiliateEarnings = affiliateEarnings._sum.commissionAmount || 0;

  // Available = Net Own Sales - Sudah Dicairkan - Pending + Affiliate Earnings
  const availableBalance = netOwnSales - totalWithdrawn - pendingAmount + totalAffiliateEarnings;

  // Order stats
  const totalOrders = orders.length;
  const completedCount = completedOrders.length;
  const cancelledCount = cancelledOrders.length;

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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Available Balance */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="h-6 w-6 opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              Tersedia
            </span>
          </div>
          <p className="text-2xl font-bold">
            Rp {availableBalance.toLocaleString("id-ID")}
          </p>
          <p className="text-xs text-green-100 mt-1">Available</p>
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
            Gross ({completedOrders.length})
          </p>
        </div>

        {/* Net Own Sales */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-100 rounded-xl p-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900">
            Rp {netOwnSales.toLocaleString("id-ID")}
          </p>
          <p className="text-xs text-slate-500 mt-1">Penjualan Bersih</p>
        </div>

        {/* Affiliate Earnings */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-amber-100 rounded-xl p-2">
              <Percent className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900">
            Rp {totalAffiliateEarnings.toLocaleString("id-ID")}
          </p>
          <p className="text-xs text-slate-500 mt-1">Komisi Affiliate</p>
        </div>

        {/* Pending Withdrawal */}
        <div className="bg-white rounded-2xl border border-amber-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-amber-100 rounded-xl p-2">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            {pendingAmount > 0 && (
              <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                !
              </span>
            )}
          </div>
          <p className="text-xl font-bold text-slate-900">
            Rp {pendingAmount.toLocaleString("id-ID")}
          </p>
          <p className="text-xs text-slate-500 mt-1">Pending Withdrawal</p>
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
            <Clock className="h-4 w-4 text-slate-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">
              {pendingOrders.length}
            </p>
            <p className="text-xs text-slate-500">Pending</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
          <div className="bg-green-100 rounded-lg p-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">
              {completedCount}
            </p>
            <p className="text-xs text-slate-500">Completed</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
          <div className="bg-red-100 rounded-lg p-2">
            <XCircle className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">
              {cancelledCount}
            </p>
            <p className="text-xs text-slate-500">Cancelled</p>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <OrdersTable orders={orders} />
    </main>
  );
}