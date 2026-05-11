import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Package, MessageCircle, CheckCircle2, ExternalLink, Zap, BookOpen, Star, Award, Users } from "lucide-react";
import Link from "next/link";
import { TierServiceClass } from "@/lib/services/TierService";
import { MicrositeViewTracker } from "@/components/MicrositeViewTracker";

export default async function PublicMicrosite({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      micrositeSettings: true,
      profile: {
        select: {
          headline: true,
          bio: true,
          whatsapp: true,
          ctaText: true,
          sellerTier: true,
        },
      },
    },
  });

  if (!user) return notFound();

  const sellerTier = user.profile?.sellerTier || "FREE";
  const tierConfig = TierServiceClass.getConfig(sellerTier);
  const maxProducts = tierConfig.maxMicrositeProducts;
  const productLimit = maxProducts === -1 ? 100 : maxProducts;

  const settings = user.micrositeSettings;
  const showPoweredBy = settings?.showPoweredBy !== false;
  const removeLynkLogo = settings?.removeLynkLogo === true;
  const hasSocialLinks = settings?.socialInstagram || settings?.socialFacebook || settings?.socialTwitter || settings?.socialYoutube;

  const ownProducts = await prisma.product.findMany({
    where: {
      userId: user.id,
      settings: {
        isArchived: false,
        isVisibleOnMicrosite: true,
      },
    },
    orderBy: [{ createdAt: "desc" }],
    include: { settings: true },
  });

  const sortedProducts = ownProducts.sort((a, b) => {
    const aFeatured = a.settings?.isFeatured || false;
    const bFeatured = b.settings?.isFeatured || false;
    if (aFeatured && !bFeatured) return -1;
    if (!aFeatured && bFeatured) return 1;
    return 0;
  }).slice(0, productLimit);

  const affiliateLinks = await prisma.affiliateEnrollment.findMany({
    where: {
      affiliateUserId: user.id,
      product: {
        settings: {
          isArchived: false,
          isVisibleOnMicrosite: true,
        },
      },
    },
    include: { product: { include: { settings: true } } },
    orderBy: { createdAt: "desc" },
  });

  const remainingSlots = productLimit - sortedProducts.length;
  const affiliateItems = remainingSlots > 0
    ? affiliateLinks.slice(0, remainingSlots).map((l) => ({
        product: l.product,
        referralCode: l.referralCode,
        commissionPercent: l.commissionPercent,
      }))
    : [];

  const hasProducts = sortedProducts.length > 0;
  const hasAffiliateProducts = affiliateItems.length > 0;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Track microsite view */}
      <MicrositeViewTracker userId={user.id} />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
          {/* Avatar & Info */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative mb-6">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white/20 shadow-2xl"
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white/20 shadow-2xl">
                  <span className="text-4xl md:text-5xl font-bold text-white">
                    {user.name?.charAt(0).toUpperCase() || username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-400 rounded-full border-4 border-slate-900" />
            </div>

            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
              {user.profile?.headline || user.name || `@${username}`}
            </h1>
            {user.profile?.bio && (
              <p className="text-blue-200 text-base md:text-lg max-w-lg mt-2 leading-relaxed">
                {user.profile.bio}
              </p>
            )}

            {/* Badge */}
            <div className="mt-4 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Award className="h-4 w-4 text-amber-400" />
              <span className="text-white text-sm font-medium">{tierConfig.displayName} Seller</span>
            </div>
          </div>

          {/* Social Links */}
          {hasSocialLinks && (
            <div className="flex items-center justify-center gap-3 mb-8">
              {settings?.socialInstagram && (
                <a href={`https://instagram.com/${settings.socialInstagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              )}
              {settings?.socialFacebook && (
                <a href={settings.socialFacebook.startsWith('http') ? settings.socialFacebook : `https://facebook.com/${settings.socialFacebook}`} target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              )}
              {settings?.socialTwitter && (
                <a href={settings.socialTwitter.startsWith('http') ? settings.socialTwitter : `https://x.com/${settings.socialTwitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              )}
              {settings?.socialYoutube && (
                <a href={settings.socialYoutube.startsWith('http') ? settings.socialYoutube : `https://youtube.com/${settings.socialYoutube}`} target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              )}
              {settings?.socialTiktok && (
                <a href={settings.socialTiktok.startsWith('http') ? settings.socialTiktok : `https://tiktok.com/@${settings.socialTiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                </a>
              )}
              {settings?.socialLinkedin && (
                <a href={settings.socialLinkedin.startsWith('http') ? settings.socialLinkedin : `https://linkedin.com/in/${settings.socialLinkedin}`} target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              )}
            </div>
          )}

          {/* CTA Button */}
          {user.profile?.whatsapp && (
            <div className="flex justify-center">
              <a
                href={`https://wa.me/${user.profile.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105"
              >
                <MessageCircle className="h-6 w-6" />
                {user.profile.ctaText || "Hubungi via WhatsApp"}
              </a>
            </div>
          )}

          {/* Contact Info */}
          {(settings?.contactEmail || settings?.contactPhone || settings?.contactAddress) && (
            <div className="mt-6 text-center text-blue-200 text-sm space-y-1">
              {settings?.contactEmail && (
                <p>{settings.contactEmail}</p>
              )}
              {settings?.contactPhone && (
                <p>{settings.contactPhone}</p>
              )}
              {settings?.contactAddress && (
                <p className="max-w-md mx-auto">{settings.contactAddress}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        {hasProducts && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900">Produk Unggulan</h2>
                <p className="text-sm text-slate-500">{sortedProducts.length} paket tersedia</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProducts.map((product) => {
                const s = product.settings;
                const promoPrice = s?.promoPrice;
                const hasDiscount = promoPrice && promoPrice < product.price;
                const discountPercent = hasDiscount ? Math.round((1 - promoPrice! / product.price) * 100) : 0;
                const packageType = s?.packageType || "INDIVIDUAL";

                return (
                  <Link
                    key={product.id}
                    href={`/${username}/${product.id}`}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300"
                  >
                    {/* Thumbnail */}
                    {product.thumbnail ? (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={product.thumbnail}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          alt={product.title}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        {hasDiscount && (
                          <div className="absolute top-3 left-3">
                            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                              -{discountPercent}%
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                          <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                            {packageType === "INDIVIDUAL" ? "TOEFL" : "Bundle"}
                          </span>
                          <span className="bg-emerald-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Tersedia
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Package className="h-16 w-16 text-white/50" />
                      </div>
                    )}

                    <div className="p-5">
                      <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {product.title}
                      </h3>

                      {product.description && (
                        <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                          {product.description}
                        </p>
                      )}

                      {/* Features */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {s?.certificateIncluded && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full">
                            <Star className="h-3 w-3" />
                            Sertifikat
                          </span>
                        )}
                        {s?.reviewIncluded && (
                          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs font-medium px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                            Review
                          </span>
                        )}
                        {s?.zoomIncluded && (
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                            <Zap className="h-3 w-3" />
                            Zoom
                          </span>
                        )}
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div>
                          {hasDiscount ? (
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-bold text-slate-900">
                                Rp {promoPrice!.toLocaleString("id-ID")}
                              </span>
                              <span className="text-sm text-slate-400 line-through">
                                Rp {product.price.toLocaleString("id-ID")}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xl font-bold text-slate-900">
                              Rp {product.price.toLocaleString("id-ID")}
                            </span>
                          )}
                        </div>
                        <span className="text-blue-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                          Lihat
                          <ExternalLink className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Affiliate Products */}
        {hasAffiliateProducts && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900">Produk Lainnya</h2>
                <p className="text-sm text-slate-500">Pilihan produk</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {affiliateItems.map((item) => {
                const s = item.product.settings;
                const price = s?.promoPrice || item.product.price;

                return (
                  <Link
                    key={item.product.id}
                    href={`/${username}/${item.product.id}?ref=${item.referralCode}`}
                    className="group bg-white rounded-2xl border border-purple-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-purple-300 transition-all duration-300"
                  >
                    {item.product.thumbnail && (
                      <div className="relative h-40 overflow-hidden">
                        <img
                          src={item.product.thumbnail}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          alt={item.product.title}
                        />
                        <div className="absolute top-3 right-3">
                          <span className="bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Affiliate
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="p-4">
                      <h3 className="text-base font-bold text-slate-900 mb-1 line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {item.product.title}
                      </h3>
                      <p className="text-slate-500 text-sm mb-3 line-clamp-1">
                        {item.product.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold text-slate-900">
                            Rp {price.toLocaleString("id-ID")}
                          </span>
                          <span className="ml-2 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                            {item.commissionPercent}% komisi
                          </span>
                        </div>
                        <span className="text-purple-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                          Ambil
                          <ExternalLink className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasProducts && !hasAffiliateProducts && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-5">
              <BookOpen className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Belum Ada Paket</h3>
            <p className="text-slate-500">Seller belum menambahkan paket TOEFL</p>
          </div>
        )}
      </div>

      {/* Sticky Footer */}
      {!removeLynkLogo && showPoweredBy && (
        <div className="fixed bottom-0 left-0 right-0 py-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-sm z-50">
          <p className="text-center text-xs text-slate-500">
            Powered by{" "}
            <a href="/" className="font-semibold text-blue-600 hover:text-blue-700">
              TOEFLLYNK
            </a>
          </p>
        </div>
      )}

      {/* Spacer for sticky footer */}
      <div className="h-12" />
    </main>
  );
}