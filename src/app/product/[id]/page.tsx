import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Package, CheckCircle2, Shield, ArrowLeft, Star, Zap, BookOpen, ExternalLink, BadgeCheck, Clock, Users } from "lucide-react";
import Link from "next/link";
import { AffiliateTracker } from "@/components/AffiliateTracker";
import { ProductViewTracker } from "@/components/ProductViewTracker";

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { id } = await params;
  const { ref } = await searchParams;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      user: true,
      settings: true,
      affiliateEnrollments: ref ? {
        where: { referralCode: ref },
        include: { affiliateUser: { select: { username: true } } },
        take: 1,
      } : false,
    },
  });

  if (!product) return notFound();

  const isValidAffiliate = ref && product.affiliateEnrollments && product.affiliateEnrollments.length > 0;
  const affiliateInfo = isValidAffiliate ? product.affiliateEnrollments?.[0] as any : null;

  const promoPrice = product.settings?.promoPrice;
  const hasDiscount = promoPrice !== null && promoPrice !== undefined && promoPrice < product.price;
  const discountPercent = hasDiscount ? Math.round((1 - promoPrice! / product.price) * 100) : 0;

  const checkoutUrl = `/checkout/${product.id}${ref ? `?ref=${ref}` : ""}`;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Track affiliate click */}
      {ref && <AffiliateTracker referralCode={ref} productId={id} />}

      {/* Track product view */}
      <ProductViewTracker productId={id} />

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="max-w-4xl mx-auto px-4 pt-8 pb-16">
          <Link
            href={`/${product.user.username}`}
            className="inline-flex items-center gap-2 text-blue-300 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke @{product.user.username}</span>
          </Link>

          {/* Product Owner */}
          <div className="flex items-start gap-5 mb-6">
            {product.user.avatar ? (
              <img src={product.user.avatar} className="w-14 h-14 rounded-full object-cover border-2 border-white/30" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg border-2 border-white/30">
                {product.user.name?.charAt(0).toUpperCase() || product.user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <p className="text-white/70 text-sm">Seller</p>
                <span className="bg-emerald-500 text-white text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                  <BadgeCheck className="h-3 w-3" />
                  Verified
                </span>
              </div>
              <p className="font-semibold text-white">@{product.user.username}</p>
              {isValidAffiliate && affiliateInfo && (
                <p className="text-emerald-400 text-sm mt-1 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Direkomendasikan oleh @{affiliateInfo.affiliateUser.username}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              TOEFL Simulation
            </span>
            {!product.settings?.isArchived && (
              <span className="bg-emerald-500/20 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Tersedia
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">{product.title}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8">
        {/* Product Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mb-6">
          {/* Thumbnail */}
          {product.thumbnail && (
            <div className="relative h-64 md:h-80 overflow-hidden">
              <img
                src={product.thumbnail}
                className="w-full h-full object-cover"
                alt={product.title}
              />
              {hasDiscount && (
                <div className="absolute top-4 left-4">
                  <span className="bg-red-500 text-white text-lg font-bold px-4 py-2 rounded-full shadow-lg">
                    -{discountPercent}% OFF
                  </span>
                </div>
              )}
              {product.settings?.isArchived && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold">Program Ditutup</span>
                </div>
              )}
            </div>
          )}

          <div className="p-6 md:p-8">
            {/* Description */}
            {product.description && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-900 mb-3">Deskripsi</h3>
                <p className="text-slate-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Features */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Yang Termasuk</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-100">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{product.settings?.examCredits ?? 1}x TOEFL Simulation</p>
                    <p className="text-sm text-slate-500">Credit untuk mengerjakan simulasi</p>
                  </div>
                </div>

                {product.settings?.certificateIncluded && (
                  <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-100">
                    <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                      <Star className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Score Certificate</p>
                      <p className="text-sm text-slate-500">Sertifikat prediksi skor</p>
                    </div>
                  </div>
                )}

                {product.settings?.reviewIncluded && (
                  <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-100">
                    <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Answer Review</p>
                      <p className="text-sm text-slate-500">Pembahasan jawaban lengkap</p>
                    </div>
                  </div>
                )}

                {product.settings?.zoomIncluded && (
                  <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-100">
                    <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                      <Zap className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Zoom Mentoring</p>
                      <p className="text-sm text-slate-500">Sesi bimbingan langsung</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Price & CTA */}
            <div className="border-t border-slate-100 pt-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-6">
                <div>
                  {hasDiscount ? (
                    <>
                      <p className="text-sm text-slate-500 mb-1">Harga Promo</p>
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl md:text-4xl font-bold text-slate-900">
                          Rp {promoPrice!.toLocaleString("id-ID")}
                        </span>
                        <span className="text-lg text-slate-400 line-through">
                          Rp {product.price.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                        <CheckCircle2 className="h-4 w-4" />
                        Hemat {discountPercent}%
                      </span>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-slate-500 mb-1">Harga</p>
                      <span className="text-3xl md:text-4xl font-bold text-slate-900">
                        Rp {product.price.toLocaleString("id-ID")}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-blue-500" />
                    Akses Selamanya
                  </span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span className="flex items-center gap-1.5">
                    <BadgeCheck className="h-4 w-4 text-emerald-500" />
                    Instant Access
                  </span>
                </div>
              </div>

              {product.settings?.isArchived ? (
                <div className="bg-slate-100 text-slate-500 text-center py-4 rounded-xl font-semibold">
                  Program Ditutup
                </div>
              ) : (
                <a
                  href={checkoutUrl}
                  className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:scale-[1.02]"
                >
                  Beli Sekarang
                  <ExternalLink className="h-5 w-5" />
                </a>
              )}

              <div className="flex items-center justify-center gap-6 mt-5 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  Payment Secure
                </span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  Garansi 7 Hari
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Seller Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <p className="text-sm text-slate-500 mb-4">Tentang Seller</p>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg overflow-hidden">
              {product.user.avatar ? (
                <img src={product.user.avatar} className="w-full h-full object-cover" />
              ) : (
                product.user.name?.charAt(0).toUpperCase() || product.user.username.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900 text-lg">{product.user.name || product.user.username}</p>
              <p className="text-sm text-slate-500">@{product.user.username}</p>
            </div>
            <Link
              href={`/${product.user.username}`}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
            >
              Lihat Microsite
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="fixed bottom-0 left-0 right-0 py-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-sm z-50">
          <p className="text-center text-xs text-slate-500">
            Powered by{" "}
            <a href="/" className="font-semibold text-blue-600 hover:text-blue-700">
              TOEFLLYNK
            </a>
          </p>
        </div>

        {/* Spacer for sticky footer */}
        <div className="h-12" />
      </div>
    </main>
  );
}