export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/services/authService";
import { DollarSign, TrendingUp, ArrowRight, Gift, Calendar } from "lucide-react";

export default async function AffiliateEarningsPage() {
  const user = await getCurrentUser();

  const conversions = await prisma.affiliateConversion.findMany({
    where: {
      affiliateUserId: user?.id,
    },
    include: {
      order: {
        include: {
          product: { select: { title: true, price: true, promoPrice: true } },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalCommission = conversions.reduce((sum, item) => sum + item.commissionAmount, 0);
  const totalSales = conversions.length;
  const avgCommission = totalSales > 0 ? Math.round(totalCommission / totalSales) : 0;

  // Group by month
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  const thisMonthConversions = conversions.filter(c => new Date(c.createdAt) >= thisMonth);
  const thisMonthEarnings = thisMonthConversions.reduce((sum, c) => sum + c.commissionAmount, 0);

  return (
    <main className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Affiliate Earnings</h1>
        <p className="text-slate-500 mt-1">Track your commission earnings from affiliate sales</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
          <p className="text-slate-400 text-sm">Total Earnings</p>
          <p className="text-3xl font-bold mt-2">Rp {totalCommission.toLocaleString("id-ID")}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div className="bg-blue-50 rounded-xl p-3">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-500">This Month</p>
            <p className="text-2xl font-bold text-slate-900">Rp {thisMonthEarnings.toLocaleString("id-ID")}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div className="bg-green-50 rounded-xl p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-500">Total Sales</p>
            <p className="text-2xl font-bold text-slate-900">{totalSales}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div className="bg-purple-50 rounded-xl p-3">
              <Gift className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-500">Avg Commission</p>
            <p className="text-2xl font-bold text-slate-900">Rp {avgCommission.toLocaleString("id-ID")}</p>
          </div>
        </div>
      </div>

      {/* Conversion List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Recent Commissions</h2>
        </div>

        <div className="divide-y divide-slate-100">
          {conversions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <DollarSign className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Belum ada komisi</p>
              <p className="text-sm text-slate-400 mt-1">Mulai promosikan produk affiliate untuk mendapatkan komisi</p>
            </div>
          ) : (
            conversions.map((conv) => (
              <div key={conv.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{conv.order?.product?.title || "Unknown Product"}</p>
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <span>Ref: {conv.referralCode}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(conv.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    +Rp {conv.commissionAmount.toLocaleString("id-ID")}
                  </p>
                  <p className="text-xs text-slate-400">
                    dari Rp {(conv.order?.product?.promoPrice || conv.order?.product?.price || 0).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CTA */}
      {conversions.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Tingkatkan Earnings Anda</h3>
              <p className="text-blue-100 mt-1">Bagikan link affiliate Anda ke lebih banyak orang</p>
            </div>
            <a
              href="/user/my-affiliate-links"
              className="flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-medium hover:bg-blue-50 transition-colors"
            >
              Lihat Link Affiliate
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}
    </main>
  );
}