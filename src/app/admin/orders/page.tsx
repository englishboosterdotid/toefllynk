import prisma from "@/lib/prisma";
import Link from "next/link";
import { ShoppingCart, Search, Eye, Filter, Download, ArrowUpRight } from "lucide-react";
import { AnimatedContainer } from "@/components/animations";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      product: { select: { title: true, thumbnail: true, price: true, promoPrice: true } },
      student: { select: { buyerName: true, buyerEmail: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
    REFUNDED: "bg-purple-100 text-purple-700",
  };

  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString("id-ID")}`;
  };

  return (
    <main className="p-8 space-y-6">
      {/* Page Header */}
      <AnimatedContainer>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Orders</h1>
            <p className="mt-1 text-slate-500">Kelola pesanan dan transaksi</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </AnimatedContainer>

      {/* Stats Cards */}
      <AnimatedContainer delay={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Orders", value: orders.length, color: "blue" },
            { label: "Pending", value: orders.filter(o => o.status === "PENDING").length, color: "yellow" },
            { label: "Completed", value: orders.filter(o => o.status === "COMPLETED").length, color: "green" },
            { label: "Revenue", value: `Rp ${orders.filter(o => o.status === "COMPLETED").reduce((acc, o) => acc + (o.product?.promoPrice || o.product?.price || 0), 0).toLocaleString("id-ID")}`, color: "purple" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${
                stat.color === "blue" ? "text-blue-600" :
                stat.color === "yellow" ? "text-yellow-600" :
                stat.color === "green" ? "text-green-600" :
                "text-purple-600"
              }`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </AnimatedContainer>

      {/* Filters */}
      <AnimatedContainer delay={0.2}>
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or order ID..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select className="px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </AnimatedContainer>

      {/* Orders Table */}
      <AnimatedContainer delay={0.3}>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Order ID</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Customer</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Product</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Amount</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <ShoppingCart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">Belum Ada Pesanan</h3>
                      <p className="text-slate-500">Pesanan akan muncul setelah customer melakukan pembayaran</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-slate-600">{order.id.slice(0, 8)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{order.student?.buyerName || order.buyerName}</p>
                        <p className="text-sm text-slate-500">{order.student?.buyerEmail || order.buyerEmail || "N/A"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                            {order.product?.thumbnail ? (
                              <img src={order.product.thumbnail} className="h-full w-full object-cover" alt="" />
                            ) : (
                              <ShoppingCart className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <span className="font-medium text-slate-900">{order.product?.title || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-900">
                          {formatPrice(order.product?.promoPrice || order.product?.price || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || "bg-slate-100 text-slate-700"}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AnimatedContainer>
    </main>
  );
}
