"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield, Package, CheckCircle2 } from "lucide-react";

declare global {
  interface Window {
    snap: {
      pay: (token: string, options?: object) => void;
    };
  }
}

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  promoPrice: number | null;
  thumbnail: string | null;
  examCredits: number;
  certificateIncluded: boolean;
  reviewIncluded: boolean;
  zoomIncluded: boolean;
  packageType: string | null;
  user: {
    name: string | null;
    username: string;
  };
  isArchived: boolean;
}

interface CheckoutClientProps {
  product: Product;
  referral?: string;
}

export default function CheckoutClient({ product, referral }: CheckoutClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapLoaded, setSnapLoaded] = useState(false);

  const isBundle = product.packageType === "BUNDLE";
  const displayPrice = product.promoPrice || product.price;

  // Load Midtrans Snap.js script
  useEffect(() => {
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";

    if (!clientKey) {
      console.warn("Midtrans client key not configured");
      return;
    }

    // Set client key before loading Snap.js
    (window as any).midtrans = (window as any).midtrans || {};
    (window as any).midtrans.clientKey = clientKey;

    // Use sandbox or production URL based on environment
    const snapUrl = isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";

    const script = document.createElement("script");
    script.src = snapUrl;
    script.async = true;
    script.onload = () => {
      // Set client key
      (window as any).snap = (window as any).snap || {};
      (window as any).snap.environment = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
        ? "production"
        : "sandbox";
      setSnapLoaded(true);
    };
    script.onerror = () => {
      console.error("Failed to load Midtrans Snap.js");
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      document.head.removeChild(script);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const buyerName = formData.get("buyerName") as string;
    const buyerEmail = formData.get("buyerEmail") as string;
    const buyerWhatsapp = formData.get("buyerWhatsapp") as string;

    try {
      // Step 1: Create order and get snap token
      const response = await fetch("/api/payment/snap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          buyerName,
          buyerEmail,
          buyerWhatsapp,
          referralCode: referral || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      const data = await response.json();

      // Step 2: Open Midtrans Snap modal
      if (data.snapToken) {
        window.snap.pay(data.snapToken, {
          onSuccess: (result: any) => {
            console.log("Payment success:", result);
            // Redirect to success page
            router.push(`/order/success?orderId=${data.orderId}&status=success`);
          },
          onPending: (result: any) => {
            console.log("Payment pending:", result);
            router.push(`/order/pending?orderId=${data.orderId}&status=pending`);
          },
          onError: (result: any) => {
            console.error("Payment error:", result);
            setError("Payment failed. Please try again.");
            setLoading(false);
          },
          onClose: () => {
            console.log("Customer closed the popup without finishing payment");
            setLoading(false);
          },
        });
      } else if (data.redirectUrl) {
        // Fallback: redirect to Midtrans page
        window.location.href = data.redirectUrl;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (product.isArchived) {
    return (
      <main className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-lg p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Program Ditutup</h1>
          <p className="text-slate-500 mb-6">
            Maaf, paket TOEFL ini sudah tidak menerima student order baru.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50/50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        {/* Back button */}
        <Link
          href={`/product/${product.id}`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <h1 className="text-2xl font-bold">Checkout</h1>
            <p className="text-blue-100 mt-1">Lengkapi form di bawah untuk memesan</p>
          </div>

          {/* Product Summary */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex gap-4">
              {product.thumbnail && (
                <div className="h-20 w-28 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={product.thumbnail} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-xs text-blue-600 font-semibold mb-1">
                  {isBundle ? "BUNDLE PACKAGE" : "TOEFL SIMULATION"}
                </p>
                <h2 className="text-lg font-bold text-slate-900">{product.title}</h2>
                <p className="text-sm text-slate-500 line-clamp-1 mt-1">{product.description}</p>
              </div>
            </div>

            {/* Features */}
            <div className="mt-4 bg-slate-50 rounded-xl p-4 space-y-2">
              {isBundle ? (
                <>
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" /> Personal Seller Fulfillment
                  </p>
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" /> Konsultasi / Mentoring Personal
                  </p>
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" /> Jadwal Fleksibel
                  </p>
                </>
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

            {/* Price */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">Total Harga</span>
              <div className="text-right">
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
                    Rp {displayPrice.toLocaleString("id-ID")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                name="buyerName"
                placeholder="Masukkan nama lengkap Anda"
                className="w-full border border-slate-200 rounded-xl p-3.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                name="buyerEmail"
                type="email"
                placeholder="nama@email.com"
                className="w-full border border-slate-200 rounded-xl p-3.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">
                WhatsApp <span className="text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                name="buyerWhatsapp"
                placeholder="08xxxxxxxxxx"
                className="w-full border border-slate-200 rounded-xl p-3.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <p className="text-xs text-slate-400">Akan digunakan untuk konfirmasi order</p>
            </div>

            {/* Submit */}
            <div className="pt-4 space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-4 rounded-xl font-semibold transition-colors shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Bayar Sekarang"
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  Secure Payment
                </span>
                <span>•</span>
                <span>Powered by Midtrans</span>
              </div>
            </div>
          </form>
        </div>

        {/* Seller Info */}
        <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500 mb-3">Order akan diproses oleh</p>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              {product.user.name?.charAt(0).toUpperCase() || product.user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{product.user.name || product.user.username}</p>
              <p className="text-sm text-slate-500">@{product.user.username}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}