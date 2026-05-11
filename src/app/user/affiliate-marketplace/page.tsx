export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/services/authService";

export default async function AffiliateMarketplacePage() {
  const user = await getCurrentUser();

  // Get products that have affiliate enabled
  const products = await prisma.product.findMany({
    where: {
      settings: {
        isArchived: false,
        affiliateEnabled: true,
      },
      userId: {
        not: user?.id,
      },
    },
    include: {
      user: {
        select: { id: true, name: true, username: true, avatar: true },
      },
      settings: {
        select: { promoPrice: true, affiliateCommission: true },
      },
      affiliateEnrollments: {
        where: {
          affiliateUserId: user?.id,
        },
        select: {
          commissionPercent: true,
          affiliateUserId: true,
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Filter out products the user is already enrolled in
  const availableProducts = products.filter(
    (product) => product.affiliateEnrollments.length === 0
  );

  return (
    <main>
      <h1 className="text-3xl font-bold mb-6">Affiliate Marketplace</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
              {product.thumbnail && (
                <img
                  src={product.thumbnail}
                  className="w-full h-40 object-cover rounded-xl mb-4"
                />
              )}

              <p className="text-sm text-blue-500 font-medium mb-2">
                @{product.user?.username}
              </p>
              <h3 className="text-xl font-bold text-slate-900">{product.title}</h3>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                {product.description}
              </p>
              <div className="mt-4">
                <p className="font-semibold text-lg text-slate-900">
                  Rp {(product.settings?.promoPrice || product.price).toLocaleString("id-ID")}
                </p>
                <p className="text-green-600 font-medium">
                  Commission: {product.settings?.affiliateCommission ?? 10}%
                </p>
              </div>

              <form action="/api/affiliate/join" method="POST">
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="ownerUserId" value={product.userId} />
                <input type="hidden" name="commissionPercent" value={product.settings?.affiliateCommission || 10} />
                <button className="mt-4 w-full bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors">
                  Ambil Link Affiliate
                </button>
              </form>
            </div>
          ))}
        {availableProducts.length === 0 && (
          <div className="col-span-3 bg-white rounded-3xl p-10 text-center text-gray-500 border border-slate-200">
            <p className="text-lg mb-2">Tidak ada program affiliate yang tersedia saat ini.</p>
            <p className="text-sm">Cek kembali nanti atau buat program affiliate Anda sendiri.</p>
          </div>
        )}
      </div>
    </main>
  );
}