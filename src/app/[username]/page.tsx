import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Package, MessageCircle, Star, CheckCircle2, ExternalLink, Zap, Shield, BookOpen } from "lucide-react";
import Link from "next/link";

export default async function PublicMicrosite({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      products: {
        where: { isArchived: false },
      },
      affiliateLinks: {
        where: {
          product: { isArchived: false },
        },
        include: {
          product: true,
        },
      },
    },
  });

  if (!user) return notFound();

  const hasProducts = user.products.length > 0;
  const hasAffiliateProducts = user.affiliateLinks.length > 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50/30">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          {user.avatar ? (
            <img
              src={user.avatar}
              className="w-28 h-28 rounded-full mx-auto mb-6 object-cover border-4 border-white/20 shadow-xl"
            />
          ) : (
            <div className="w-28 h-28 rounded-full mx-auto mb-6 bg-white/20 flex items-center justify-center">
              <span className="text-4xl font-bold">{user.name?.charAt(0).toUpperCase() || username.charAt(0).toUpperCase()}</span>
            </div>
          )}

          <h1 className="text-3xl font-bold mb-3">{user.headline || user.name}</h1>
          <p className="text-blue-100 text-lg max-w-md mx-auto">{user.bio}</p>

          {user.whatsapp && (
            <a
              href={`https://wa.me/${user.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-8 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full font-medium transition-all shadow-lg shadow-green-500/25"
            >
              <MessageCircle className="h-5 w-5" />
              {user.ctaText || "Hubungi via WhatsApp"}
            </a>
          )}
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        {hasProducts && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Paket TOEFL</h2>
                <p className="text-sm text-slate-500">Pilihan paket simulasi TOEFL</p>
              </div>
            </div>

            <div className="space-y-4">
              {user.products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all"
                >
                  {product.thumbnail && (
                    <div className="relative h-48">
                      <img
                        src={product.thumbnail}
                        className="w-full h-full object-cover"
                        alt={product.title}
                      />
                      <div className="absolute top-4 right-4">
                        <span className="bg-green-500 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                          Tersedia
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs text-blue-600 font-semibold mb-1">
                          {product.packageType === "BUNDLE" ? "BUNDLE PACKAGE" : "TOEFL SIMULATION"}
                        </p>
                        <h3 className="text-xl font-bold text-slate-900">{product.title}</h3>
                      </div>
                    </div>

                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>

                    {/* Features */}
                    <div className="space-y-2 mb-5">
                      <p className="text-sm font-medium text-slate-700">Yang termasuk:</p>
                      {product.packageType === "BUNDLE" ? (
                        <div className="space-y-1">
                          <p className="text-sm text-slate-600 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" /> Manual Seller Fulfillment
                          </p>
                          <p className="text-sm text-slate-600 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" /> Personal Mentoring / Consultation
                          </p>
                          <p className="text-sm text-slate-600 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" /> Jadwal ditentukan setelah pembayaran
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-slate-600 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" /> {product.examCredits} TOEFL Simulation Credits
                          </p>
                          {product.certificateIncluded && (
                            <p className="text-sm text-slate-600 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" /> Score Prediction Certificate
                            </p>
                          )}
                          {product.reviewIncluded && (
                            <p className="text-sm text-slate-600 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" /> Answer Review / Discussion
                            </p>
                          )}
                          {product.zoomIncluded && (
                            <p className="text-sm text-slate-600 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" /> Zoom Mentoring Session
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Price & CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div>
                        {product.promoPrice && product.promoPrice < product.price ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900">
                              Rp {product.promoPrice.toLocaleString("id-ID")}
                            </span>
                            <span className="text-sm text-slate-400 line-through">
                              Rp {product.price.toLocaleString("id-ID")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-2xl font-bold text-slate-900">
                            Rp {product.price.toLocaleString("id-ID")}
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/product/${product.id}`}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                      >
                        Lihat Detail
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Affiliate Products Section */}
        {hasAffiliateProducts && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Partner Packages</h2>
                <p className="text-sm text-slate-500">Rekomendasi paket dari partner affiliate</p>
              </div>
            </div>

            <div className="space-y-4">
              {user.affiliateLinks.map((link) => (
                <div
                  key={link.id}
                  className="bg-white rounded-2xl border border-purple-100 overflow-hidden shadow-sm hover:shadow-lg transition-all"
                >
                  {link.product.thumbnail && (
                    <div className="relative h-40">
                      <img
                        src={link.product.thumbnail}
                        className="w-full h-full object-cover"
                        alt={link.product.title}
                      />
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <span className="bg-purple-600 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                          Affiliate
                        </span>
                        <span className="bg-green-500 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                          Tersedia
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{link.product.title}</h3>
                      </div>
                    </div>

                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                      {link.product.description}
                    </p>

                    {/* Price & CTA */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-xl font-bold text-slate-900">
                          Rp {(link.product.promoPrice || link.product.price).toLocaleString("id-ID")}
                        </span>
                        <span className="ml-2 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded">
                          {link.commissionPercent}% komisi
                        </span>
                      </div>
                      <Link
                        href={`/ref/${link.referralCode}/${link.productId}`}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
                      >
                        Ambil Paket
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasProducts && !hasAffiliateProducts && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Belum Ada Paket</h3>
            <p className="text-slate-500">Seller belum menambahkan paket TOEFL</p>
          </div>
        )}

        {/* Powered By */}
        <div className="text-center mt-12 pb-8">
          <p className="text-sm text-slate-400">
            Powered by{" "}
            <a href="/" className="font-medium text-blue-600 hover:underline">
              TOEFLLYNK
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}