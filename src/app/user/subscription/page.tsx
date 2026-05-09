"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { Crown, Star, TrendingUp, Check, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { AnimatedContainer } from "@/components/animations";

type SellerTier = "FREE" | "PRO" | "BUSINESS";

interface TierInfo {
  tier: SellerTier;
  tierConfig: {
    name: string;
    displayName: string;
    platformFee: number;
    withdrawalFee: number;
    maxProducts: number;
    maxMicrositeProducts: number;
    features: string[];
    isUnlimited: boolean;
    hasCustomDomain: boolean;
    hasRemoveLynkLogo: boolean;
    hasWhiteLabel: boolean;
    hasAPIAccess: boolean;
    customerDatabaseLimit: number;
    hasExportCustomer: boolean;
    emailMarketingLimit: number;
  };
  effectiveFeeRate: number;
  withdrawalFeeRate: number;
  productCount: number;
  micrositeVisibleCount: number;
  maxMicrositeProducts: number;
  subscriptionStatus: "ACTIVE" | "EXPIRED" | "GRACE_PERIOD" | "NONE";
  subscriptionEnd: string | null;
  daysUntilExpiry: number | null;
  customFeeRate: number | null;
  canUpgrade: boolean;
  upgradeTo: SellerTier | null;
}

const tierConfig: Record<SellerTier, { label: string; color: string; bg: string; icon: any }> = {
  FREE: { label: "Coba", color: "text-slate-600", bg: "bg-slate-100", icon: Star },
  PRO: { label: "Berkembang", color: "text-purple-600", bg: "bg-purple-100", icon: TrendingUp },
  BUSINESS: { label: "Bisnis", color: "text-amber-600", bg: "bg-amber-100", icon: Crown },
};

const plans = [
  {
    tier: "FREE" as SellerTier,
    name: "Coba",
    price: 0,
    period: "Selamanya",
    description: "Gratis untuk memulai",
    features: [
      "3 Produk untuk dijual",
      "3 Produk di microsite",
      "Affiliate System",
      "Midtrans Payment",
      "Basic Analytics",
    ],
  },
  {
    tier: "PRO" as SellerTier,
    name: "Berkembang",
    price: 79000,
    period: "30 hari",
    description: "Untuk growing business",
    popular: true,
    features: [
      "Unlimited Produk",
      "15 Produk di microsite",
      "Custom Certificate",
      "Promo/Discount Code",
      "Custom Domain",
      "Basic Theme Custom",
      "Customer Database (500)",
      "Export Customer Data",
      "Email Marketing (1.000/bulan)",
      "API Access",
    ],
  },
  {
    tier: "BUSINESS" as SellerTier,
    name: "Bisnis",
    price: 199000,
    period: "30 hari",
    description: "Untuk scale besar",
    features: [
      "Unlimited Produk",
      "Unlimited Microsite",
      "Full Theme Custom",
      "Custom Footer/Header",
      "Remove Lynk Logo",
      "Customer Database (Unlimited)",
      "Email Marketing (10.000/bulan)",
      "Webhook Integration",
    ],
  },
];

export default function SubscriptionPage() {
  const searchParams = useSearchParams();
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<SellerTier | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const upgradeStatus = searchParams.get("upgrade");
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    const fetchTierInfo = async () => {
      try {
        const res = await fetch("/api/me");
        const data = await res.json();
        if (data.user?.sellerTier) {
          // Fetch extended tier info
          const tierRes = await fetch("/api/user/tier-info");
          const tierData = await tierRes.json();
          if (tierData.success) {
            setTierInfo(tierData.data);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTierInfo();
  }, []);

  useEffect(() => {
    if (upgradeStatus === "success") {
      setMessage({ type: "success", text: "Upgrade berhasil! Selamat menikmati fitur premium." });
    } else if (upgradeStatus === "error") {
      setMessage({ type: "error", text: "Upgrade gagal. Silakan coba lagi." });
    } else if (upgradeStatus === "pending") {
      setMessage({ type: "success", text: "Pembayaran sedang diproses." });
    }
  }, [upgradeStatus]);

  const handleUpgrade = async (targetTier: SellerTier) => {
    setUpgrading(targetTier);
    setMessage(null);

    try {
      // Cleanup old pending subscriptions first
      await fetch("/api/seller/upgrade/reset", { method: "POST" });

      const res = await fetch("/api/seller/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetTier }),
      });

      const data = await res.json();

      if (data.success && data.token) {
        // Use Snap popup mode
        if (typeof window !== "undefined" && (window as any).snap) {
          (window as any).snap.pay(data.token, {
            onSuccess: function (result: any) {
              console.log("Payment success:", result);
              window.location.href = `/user/subscription?upgrade=success&orderId=${result.order_id}`;
            },
            onPending: function (result: any) {
              console.log("Payment pending:", result);
              window.location.href = `/user/subscription?upgrade=pending&orderId=${result.order_id}`;
            },
            onError: function (result: any) {
              console.error("Payment error:", result);
              setMessage({ type: "error", text: "Pembayaran gagal. Silakan coba lagi." });
              setUpgrading(null);
            },
            onClose: function () {
              console.log("Snap popup closed");
              setUpgrading(null);
            },
          });
        } else {
          // Fallback to redirect if Snap not loaded
          window.location.href = data.redirectUrl || `/user/subscription?upgrade=pending`;
        }
      } else {
        setMessage({ type: "error", text: data.message || "Gagal initiate upgrade" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Terjadi kesalahan" });
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/4" />
            <div className="h-32 bg-slate-200 rounded" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-slate-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  const currentTier = tierInfo?.tier || "FREE";
  const currentConfig = tierConfig[currentTier];

  return (
    <main className="p-6">
      <div className="max-w-4xl mx-auto">
        {message && (
          <AnimatedContainer>
            <div
              className={`mb-6 p-4 rounded-xl ${
                message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          </AnimatedContainer>
        )}

        {/* Current Plan */}
        {tierInfo && (
          <AnimatedContainer delay={0.1}>
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Plan Saat Ini</p>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${currentConfig.bg}`}>
                      <currentConfig.icon className={`h-5 w-5 ${currentConfig.color}`} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{currentConfig.label}</h2>
                      <p className="text-slate-400 text-sm">
                        {tierInfo.effectiveFeeRate}% platform fee
                        {tierInfo.customFeeRate !== null && (
                          <span className="ml-2">(custom rate)</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {tierInfo.subscriptionStatus === "EXPIRED" ? (
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium">Expired</span>
                    </div>
                  ) : tierInfo.subscriptionEnd ? (
                    <>
                      <p className="text-slate-400 text-sm">Berakhir</p>
                      <p className="font-medium">
                        {new Date(tierInfo.subscriptionEnd).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      {tierInfo.daysUntilExpiry !== null && tierInfo.daysUntilExpiry <= 7 && tierInfo.daysUntilExpiry > 0 && (
                        <p className="text-amber-400 text-sm mt-1">
                          {tierInfo.daysUntilExpiry} hari lagi
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-green-400">
                      <Check className="h-5 w-5" />
                      <span className="font-medium">Active</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-700">
                <div>
                  <p className="text-slate-400 text-sm">Products</p>
                  <p className="text-xl font-bold">
                    {tierInfo.productCount} / {tierInfo.tierConfig.maxProducts === -1 ? "∞" : tierInfo.tierConfig.maxProducts}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Platform Fee</p>
                  <p className="text-xl font-bold">{tierInfo.effectiveFeeRate}%</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Status</p>
                  <p className="text-xl font-bold capitalize">{tierInfo.subscriptionStatus.toLowerCase().replace("_", " ")}</p>
                </div>
              </div>
            </div>
          </AnimatedContainer>
        )}

        {/* Pricing Plans */}
        <AnimatedContainer delay={0.2}>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Pilih Plan</h2>
          <p className="text-slate-500 mb-6">Upgrade untuk membuka lebih banyak fitur</p>
        </AnimatedContainer>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan, index) => {
            const config = tierConfig[plan.tier];
            const isCurrent = plan.tier === currentTier;
            const tierOrder = { FREE: 0, PRO: 1, BUSINESS: 2 };
            const isDowngrade = tierOrder[plan.tier] < tierOrder[currentTier as SellerTier];

            return (
              <AnimatedContainer key={plan.tier} delay={0.1 * (index + 1)}>
                <div
                  className={`relative bg-white rounded-xl border-2 p-6 ${
                    plan.popular
                      ? "border-blue-500 ring-2 ring-blue-500/20"
                      : isCurrent
                      ? "border-green-500"
                      : "border-slate-200"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                        Populer
                      </span>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                        Current
                      </span>
                    </div>
                  )}

                  <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color} mb-4`}>
                    <config.icon className="h-3 w-3" />
                    {config.label}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-sm text-slate-500 mb-4">{plan.description}</p>

                  <div className="mb-4">
                    <span className="text-3xl font-bold text-slate-900">
                      Rp {plan.price.toLocaleString("id-ID")}
                    </span>
                    <span className="text-slate-500 text-sm">/{plan.period}</span>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpgrade(plan.tier)}
                    disabled={
                      upgrading !== null ||
                      isCurrent ||
                      isDowngrade ||
                      plan.tier === "FREE"
                    }
                    className={`w-full py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      isCurrent
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : isDowngrade
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : plan.tier === "FREE"
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {upgrading === plan.tier ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : isCurrent ? (
                      "Plan Aktif"
                    ) : isDowngrade ? (
                      "Tidak tersedia"
                    ) : plan.tier === "FREE" ? (
                      "Gratis"
                    ) : (
                      <>
                        Upgrade
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </AnimatedContainer>
            );
          })}
        </div>

        {/* FAQ */}
        <AnimatedContainer delay={0.5}>
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Pertanyaan Umum</h3>
            <div className="space-y-4">
              <details className="bg-white rounded-xl border border-slate-200 p-4">
                <summary className="font-medium text-slate-900 cursor-pointer">Bagaimana sistem langganan bekerja?</summary>
                <p className="text-slate-600 text-sm mt-2">
                  Setiap upgrade berlaku untuk 30 hari. Langganan akan otomatis diperpanjang kecuali Anda membatalkan.
                </p>
              </details>
              <details className="bg-white rounded-xl border border-slate-200 p-4">
                <summary className="font-medium text-slate-900 cursor-pointer">Bisakah saya downgrade?</summary>
                <p className="text-slate-600 text-sm mt-2">
                  Ya, Anda bisa downgrade kapan saja. Perubahan akan berlaku di periode berikutnya.
                </p>
              </details>
              <details className="bg-white rounded-xl border border-slate-200 p-4">
                <summary className="font-medium text-slate-900 cursor-pointer">Bagaimana dengan produk yang sudah saya buat?</summary>
                <p className="text-slate-600 text-sm mt-2">
                  Produk Anda tidak akan dihapus saat downgrade. Anda hanya tidak bisa membuat produk baru melebihi batas tier baru.
                </p>
              </details>
            </div>
          </div>
        </AnimatedContainer>
      </div>

      {/* Midtrans Snap JS */}
      <Script
        src={process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
          ? "https://app.midtrans.com/snap/snap.js"
          : "https://app.sandbox.midtrans.com/snap/snap.js"
        }
        strategy="lazyOnload"
        onLoad={() => {
          if (process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY) {
            (window as any).snap.embedToken = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
          }
        }}
      />
    </main>
  );
}
