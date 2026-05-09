import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Package, User, CheckCircle2, Shield, MessageCircle, ArrowLeft, Star, Clock, Zap, BookOpen, ExternalLink } from "lucide-react";
import Link from "next/link";

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
    },
  });

  if (!product) return notFound();

  const isBundle = product.packageType === "BUNDLE";
  const hasDiscount = product.promoPrice && product.promoPrice < product.price;
  const discountPercent = hasDiscount ? Math.round((1 - product.promoPrice! / product.price) * 100) : 0;
  const checkoutUrl = `/checkout/${product.id}${ref ? `?ref=${ref}` : ""}`;

  return (
    <main className="min-h-screen pb-24 bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20">
      {/* Header with wave */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 pt-8 pb-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-5 left-10 w-80 h-80 bg-purple-400 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-2xl mx-auto px-4">
          <Link
            href={`/${product.user.username}`}
            className="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            @ {product.user.username}
          </Link>

          <div className="flex items-center gap-4 mb-4">
            {product.user.avatar ? (
              <img src={product.user.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-white/30" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                {product.user.name?.charAt(0).toUpperCase() || product.user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm text-blue-200">Seller</p>
              <p className="font-semibold text-white">@{product.user.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              {isBundle ? "BUNDLE" : "TOEFL SIMULATION"}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{product.title}</h1>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 50L60 45C120 40 240 30 360 35C480 40 600 60 720 65C840 70 960 60 1080 50C1200 40 1320 30 1380 25L1440 20V100H0V50Z" fill="#f8fafc" />
          </svg>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6">
        {/* Product Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Thumbnail */}
          {product.thumbnail && (
            <div className="relative h-56 overflow-hidden">
              <img
                src={product.thumbnail}
                className="w-full h-full object-cover"
                alt={product.title}
              />
              {!product.isArchived && (
                <div className="absolute top-4 right-4">
                  <span className="bg-emerald-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Tersedia
                  </span>
                </div>
              )}
              {hasDiscount && (
                <div className="absolute top-4 left-4">
                  <span className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                    -{discountPercent}% OFF
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="p-6">
            {/* Description */}
            {product.description && (
              <p className="text-slate-600 mb-6 leading-relaxed">{product.description}</p>
            )}

            {/* Features */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <p className="font-semibold text-slate-900">Yang termasuk:</p>
              </div>
              <div className="space-y-3">
                {isBundle ? (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <MessageCircle className="h-4.5 w-4.5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Personal Seller Fulfillment</p>
                        <p className="text-sm text-slate-500">Seller akan menghubungi setelah pembayaran</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                        <User className="h-4.5 w-4.5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Konsultasi Personal</p>
                        <p className="text-sm text-slate-500">1-on-1 session sesuai kebutuhan</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                        <Clock className="h-4.5 w-4.5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Jadwal Fleksibel</p>
                        <p className="text-sm text-slate-500">Scheduling setelah konfirmasi</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                        <Package className="h-4.5 w-4.5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{product.examCredits} TOEFL Simulation Credits</p>
                        <p className="text-sm text-slate-500">untuk mengerjakan simulasi TOEFL online</p>
                      </div>
                    </div>
                    {product.certificateIncluded && (
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                          <Star className="h-4.5 w-4.5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">Score Prediction Certificate</p>
                          <p className="text-sm text-slate-500">Sertifikat prediksi skor TOEFL</p>
                        </div>
                      </div>
                    )}
                    {product.reviewIncluded && (
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-4.5 w-4.5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">Answer Review / Discussion</p>
                          <p className="text-sm text-slate-500">Pembahasan jawaban dan技巧</p>
                        </div>
                      </div>
                    )}
                    {product.zoomIncluded && (
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                          <Zap className="h-4.5 w-4.5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">Zoom Mentoring Session</p>
                          <p className="text-sm text-slate-500">Sesi mentoring via Zoom</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Price & CTA */}
            <div className="border-t border-slate-100 pt-6">
              <div className="flex items-end justify-between mb-6">
                <div>
                  {hasDiscount ? (
                    <>
                      <p className="text-sm text-slate-500 mb-1">Harga Promo</p>
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl md:text-4xl font-bold text-slate-900">
                          Rp {product.promoPrice!.toLocaleString("id-ID")}
                        </span>
                        <span className="text-lg text-slate-400 line-through">
                          Rp {product.price.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                        <CheckCircle2 className="h-4 w-4" />
                        Hemat {Math.round((1 - product.promoPrice! / product.price) * 100)}%
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
              </div>

              {product.isArchived ? (
                <div className="bg-slate-100 text-slate-500 text-center py-4 rounded-xl font-semibold">
                  Program Ditutup
                </div>
              ) : (
                <a
                  href={checkoutUrl}
                  className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5"
                >
                  Checkout Sekarang
                  <ExternalLink className="h-5 w-5" />
                </a>
              )}

              <div className="flex items-center justify-center gap-5 mt-5 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  Secure Payment
                </span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Instant Access
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Seller Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mt-6 shadow-sm">
          <p className="text-sm text-slate-500 mb-3">Seller Profile</p>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {product.user.avatar ? (
                <img src={product.user.avatar} className="w-full h-full rounded-2xl object-cover" />
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
              className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Lihat Profile
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="fixed bottom-0 left-0 right-0 py-4 bg-white/90 backdrop-blur-md border-t border-slate-200 shadow-sm z-50">
          <p className="text-center text-sm text-slate-500">
            Powered by{" "}
            <a href="/" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              TOEFLLYNK
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}