export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/services/authService";
import { Copy, ExternalLink, Trash2, DollarSign, ShoppingCart, Package, TrendingUp, Users } from "lucide-react";

export default async function MyAffiliateLinksPage() {
  const user = await getCurrentUser();

  const links = await prisma.affiliateEnrollment.findMany({
    where: { affiliateUserId: user?.id },
    include: {
      product: {
        include: { settings: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get affiliate sales data
  const affiliateConversions = await prisma.affiliateConversion.findMany({
    where: { affiliateUserId: user?.id },
    select: {
      commissionAmount: true,
      createdAt: true,
      order: {
        select: {
          id: true,
          buyerName: true,
          product: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });

  // Calculate stats
  const totalSales = affiliateConversions.length;
  const totalCommission = affiliateConversions.reduce((sum, c) => sum + c.commissionAmount, 0);

  // Get unique products count
  const productIds = [...new Set(links.map((l) => l.productId))];
  const totalClicks = await prisma.affiliateClick.count({
    where: { referralCode: { in: links.map((l) => l.referralCode) } },
  });

  const micrositeUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/${user?.username}`;

  return (
    <main className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Affiliate Storefront</h1>
        <p className="text-slate-500 mt-1">Produk partner yang ditampilkan di microsite Anda</p>
      </div>

      {/* Main Link Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
        <p className="text-blue-100 text-sm font-medium">Your Main Selling Link</p>
        <p className="text-xl font-bold mt-2 font-mono break-all">{micrositeUrl}</p>
        <p className="text-blue-100 text-sm mt-2">Share link ini ke sosial media untuk mulai promosi</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div className="bg-purple-50 rounded-xl p-3">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-500">Total Products</p>
            <p className="text-3xl font-bold text-slate-900">{links.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div className="bg-blue-50 rounded-xl p-3">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-500">Total Clicks</p>
            <p className="text-3xl font-bold text-slate-900">{totalClicks}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div className="bg-green-50 rounded-xl p-3">
              <ShoppingCart className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-500">Total Sales</p>
            <p className="text-3xl font-bold text-slate-900">{totalSales}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div className="bg-orange-50 rounded-xl p-3">
              <DollarSign className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-500">Commission Earned</p>
            <p className="text-3xl font-bold text-slate-900">Rp {totalCommission.toLocaleString("id-ID")}</p>
          </div>
        </div>
      </div>

      {/* Links List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Your Affiliate Products</h2>

        {links.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-lg text-slate-500">Belum ada link affiliate</p>
            <p className="text-sm text-slate-400 mt-1">Kunjungi Affiliate Marketplace untuk mengambil produk</p>
            <a
              href="/user/affiliate-marketplace"
              className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Browse Marketplace <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ) : (
          links.map((link) => {
            const referralUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/ref/${link.referralCode}/${link.productId}`;
            const isActive = !link.product.settings?.isArchived;

            return (
              <div key={link.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-6">
                  {/* Product Header */}
                  <div className="flex gap-6 mb-6">
                    {link.product.thumbnail && (
                      <div className="h-32 w-48 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                        <img src={link.product.thumbnail} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">{link.product.title}</h3>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                            {link.product.description || "No description"}
                          </p>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                          isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {isActive ? "Active" : "Closed"}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center gap-4">
                        <p className="text-2xl font-bold text-slate-900">
                          Rp {(link.product.settings?.promoPrice || link.product.price).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Referral URL */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 mb-1">Your Referral URL</p>
                        <p className="text-sm font-mono text-blue-600 break-all">{referralUrl}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="text-green-600 font-medium">
                        Commission: {link.commissionPercent}%
                      </span>
                      <span className="text-slate-400">|</span>
                      <span className="text-slate-500">
                        {new Date(link.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                  <a
                    href={referralUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Preview Link
                  </a>
                  <form action="/api/affiliate/remove" method="POST" className="inline">
                    <input type="hidden" name="enrollmentId" value={link.id} />
                    <button className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </form>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CTA */}
      {links.length > 0 && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Tambahkan Lebih Banyak Produk</h3>
              <p className="text-green-100 mt-1">Perluas inventory affiliate Anda untuk meningkatkan peluang sales</p>
            </div>
            <a
              href="/user/affiliate-marketplace"
              className="flex items-center gap-2 bg-white text-green-600 px-6 py-3 rounded-xl font-medium hover:bg-green-50 transition-colors"
            >
              Browse Marketplace
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}
    </main>
  );
}