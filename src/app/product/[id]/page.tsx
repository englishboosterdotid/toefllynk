import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Package, User, CheckCircle2, Shield, MessageCircle, ArrowLeft, Star, Clock } from "lucide-react";
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
  const checkoutUrl = `/checkout/${product.id}${ref ? `?ref=${ref}` : ""}`;

  return (
    <main className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Link
            href={`/${product.user.username}`}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke @{product.user.username}
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Seller</p>
              <p className="font-medium">@{product.user.username}</p>
            </div>
          </div>

          <p className="text-blue-400 font-semibold text-sm mb-2">
            {isBundle ? "BUNDLE PACKAGE" : "TOEFL SIMULATION PACKAGE"}
          </p>
          <h1 className="text-3xl font-bold">{product.title}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6">
        {/* Product Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          {/* Thumbnail */}
          {product.thumbnail && (
            <div className="relative h-64">
              <img
                src={product.thumbnail}
                className="w-full h-full object-cover"
                alt={product.title}
              />
              {!product.isArchived && (
                <div className="absolute top-4 right-4">
                  <span className="bg-green-500 text-white text-xs font-medium px-4 py-1.5 rounded-full shadow">
                    Tersedia
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="p-6">
            {/* Description */}
            <p className="text-slate-600 mb-6">{product.description}</p>

            {/* Features */}
            <div className="bg-slate-50 rounded-2xl p-5 mb-6">
              <p className="text-sm font-semibold text-slate-900 mb-4">Yang termasuk:</p>
              <div className="space-y-3">
                {isBundle ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                        <MessageCircle className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">Personal Seller Fulfillment</p>
                        <p className="text-xs text-slate-500">Seller akan menghubungi Anda setelah pembayaran</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">Konsultasi / Mentoring Personal</p>
                        <p className="text-xs text-slate-500">1-on-1 session sesuai kebutuhan</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">Jadwal Fleksibel</p>
                        <p className="text-xs text-slate-500">Scheduling setelah konfirmasi pembayaran</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Package className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{product.examCredits} TOEFL Simulation Credits</p>
                        <p className="text-xs text-slate-500">untuk mengerjakan simulasi TOEFL</p>
                      </div>
                    </div>
                    {product.certificateIncluded && (
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                          <Star className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">Score Prediction Certificate</p>
                          <p className="text-xs text-slate-500">Sertifikat prediksi skor TOEFL</p>
                        </div>
                      </div>
                    )}
                    {product.reviewIncluded && (
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">Answer Review / Discussion</p>
                          <p className="text-xs text-slate-500">Pembahasan jawaban dan技巧</p>
                        </div>
                      </div>
                    )}
                    {product.zoomIncluded && (
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">Zoom Mentoring Session</p>
                          <p className="text-xs text-slate-500">Sesi mentoring via Zoom</p>
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
                  {product.promoPrice && product.promoPrice < product.price ? (
                    <>
                      <p className="text-sm text-slate-500">Harga Promo</p>
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-bold text-slate-900">
                          Rp {product.promoPrice.toLocaleString("id-ID")}
                        </span>
                        <span className="text-lg text-slate-400 line-through">
                          Rp {product.price.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <span className="inline-block mt-1 text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded">
                        Hemat {Math.round((1 - product.promoPrice / product.price) * 100)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-slate-500">Harga</p>
                      <span className="text-3xl font-bold text-slate-900">
                        Rp {product.price.toLocaleString("id-ID")}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {product.isArchived ? (
                <div className="bg-slate-100 text-slate-500 text-center py-4 rounded-xl font-medium">
                  Program Ditutup
                </div>
              ) : (
                <a
                  href={checkoutUrl}
                  className="block text-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors shadow-lg shadow-blue-600/25"
                >
                  Checkout Sekarang
                </a>
              )}

              <div className="flex items-center justify-center gap-4 mt-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  Secure Payment
                </span>
                <span>•</span>
                <span>Instant Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Seller Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mt-6">
          <p className="text-sm text-slate-500 mb-3">Seller Profile</p>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {product.user.name?.charAt(0).toUpperCase() || product.user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">{product.user.name || product.user.username}</p>
              <p className="text-sm text-slate-500">@{product.user.username}</p>
            </div>
            <Link
              href={`/${product.user.username}`}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Lihat Profile
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8">
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