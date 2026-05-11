export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/services/authService";
import { OrderStatus } from "@/generated/prisma/enums";
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, Users, ArrowRight, Calendar } from "lucide-react";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();

  const products = await prisma.product.findMany({
    where: { userId: user?.id },
    include: { settings: true },
  });

  const productIds = products.map((p) => p.id);

  const orders = await prisma.order.findMany({
    where: { productId: { in: productIds } },
    include: {
      product: {
        include: { settings: true },
      },
      affiliateConversion: { select: { commissionAmount: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const affiliateOrders = orders.filter((o) => o.referralCode);
  const successOrders = orders.filter((o) => o.status === OrderStatus.COMPLETED);
  const pendingOrders = orders.filter((o) => o.status === OrderStatus.PENDING);

  const totalRevenue = successOrders.reduce((sum, order) => {
    return sum + (order.product?.settings?.promoPrice || order.product?.price || 0);
  }, 0);

  const totalAffiliateCommission = successOrders.reduce((sum, order) => {
    return sum + (order.affiliateConversion?.commissionAmount || 0);
  }, 0);

  const netRevenue = totalRevenue - totalAffiliateCommission;

  // Get orders by day (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    date.setHours(0, 0, 0, 0);
    return date;
  });

  const ordersByDay = last7Days.map((date) => {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    const dayOrders = orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= date && orderDate < nextDate;
    });
    return {
      date,
      count: dayOrders.length,
      revenue: dayOrders.filter(o => o.status === OrderStatus.COMPLETED).reduce((sum, o) => sum + (o.product?.settings?.promoPrice || o.product?.price || 0), 0),
    };
  });

  const maxOrders = Math.max(...ordersByDay.map(d => d.count), 1);

  return (
    <main className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Sales Analytics</h1>
        <p className="text-slate-500 mt-1">Track your sales performance and revenue</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div className="bg-blue-50 rounded-xl p-3">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-500">Total Orders</p>
            <p className="text-3xl font-bold text-slate-900">{orders.length}</p>
            <p className="text-xs text-slate-400 mt-1">{successOrders.length} completed</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div className="bg-green-50 rounded-xl p-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-500">Total Revenue</p>
            <p className="text-2xl font-bold text-slate-900">Rp {totalRevenue.toLocaleString("id-ID")}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div className="bg-purple-50 rounded-xl p-3">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-500">Affiliate Sales</p>
            <p className="text-2xl font-bold text-slate-900">{affiliateOrders.length}</p>
            <p className="text-xs text-slate-400 mt-1">{affiliateOrders.filter(o => o.status === OrderStatus.COMPLETED).length} completed</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div className="bg-orange-50 rounded-xl p-3">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-500">Net Revenue</p>
            <p className="text-2xl font-bold text-slate-900">Rp {netRevenue.toLocaleString("id-ID")}</p>
            <p className="text-xs text-slate-400 mt-1">After affiliate: -Rp {totalAffiliateCommission.toLocaleString("id-ID")}</p>
          </div>
        </div>
      </div>

      {/* Chart - Last 7 Days */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Orders (Last 7 Days)</h2>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-500" /> Orders
            </span>
          </div>
        </div>

        <div className="flex items-end gap-4 h-40">
          {ordersByDay.map((day, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col items-center gap-1">
                <span className="text-xs text-slate-500">{day.count}</span>
                <div
                  className="w-full bg-blue-500 rounded-t-lg transition-all"
                  style={{ height: `${Math.max((day.count / maxOrders) * 100, 4)}%` }}
                />
              </div>
              <span className="text-xs text-slate-400">
                {day.date.toLocaleDateString("id-ID", { weekday: "short" })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
          <a href="/user/orders" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            View All <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="divide-y divide-slate-100">
          {orders.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Belum ada order</p>
            </div>
          ) : (
            orders.slice(0, 8).map((order) => (
              <div key={order.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
                  {order.product?.thumbnail ? (
                    <img src={order.product.thumbnail} className="h-full w-full object-cover" />
                  ) : (
                    <ShoppingCart className="h-6 w-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{order.product?.title || "Unknown"}</p>
                  <p className="text-sm text-slate-500">{order.buyerName}</p>
                </div>
                <div className="text-center">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                    order.status === OrderStatus.COMPLETED
                      ? "bg-green-100 text-green-700"
                      : order.status === OrderStatus.PENDING
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-slate-100 text-slate-700"
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
                  <p className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                    <Calendar className="h-3 w-3" />
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
    </main>
  );
}