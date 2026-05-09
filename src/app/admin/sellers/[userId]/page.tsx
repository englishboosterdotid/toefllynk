"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Crown, Star, Users, TrendingUp, Calendar, AlertTriangle, Check } from "lucide-react";
import { useRouter } from "next/navigation";

type SellerTier = "FREE" | "PRO" | "BUSINESS";

interface TierHistory {
  id: string;
  oldTier: SellerTier | null;
  newTier: SellerTier;
  changedBy: string;
  reason: string | null;
  feeOverride: number | null;
  createdAt: string;
}

interface SellerData {
  user: {
    id: string;
    name: string | null;
    email: string;
    username: string;
    avatar: string | null;
    whatsapp: string | null;
    sellerTier: SellerTier;
    subscriptionStart: string | null;
    subscriptionEnd: string | null;
    customFeeRate: number | null;
    tierChangedAt: string | null;
    tierChangeReason: string | null;
    productCount: number;
    orderCount: number;
    createdAt: string;
  };
  tierInfo: {
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
  };
  tierHistory: TierHistory[];
  lastChangedByAdmin: { id: string; name: string | null; email: string } | null;
}

const tierConfig: Record<SellerTier, { label: string; color: string; bg: string; icon: any }> = {
  FREE: { label: "Coba", color: "text-slate-600", bg: "bg-slate-100", icon: Star },
  PRO: { label: "Berkembang", color: "text-purple-600", bg: "bg-purple-100", icon: TrendingUp },
  BUSINESS: { label: "Bisnis", color: "text-amber-600", bg: "bg-amber-100", icon: Crown },
};

const tierOptions: SellerTier[] = ["FREE", "PRO", "BUSINESS"];

export default function SellerDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const router = useRouter();
  const [data, setData] = useState<SellerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    tier: "FREE" as SellerTier,
    reason: "",
    feeOverride: "",
    extendDays: "30",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/admin/seller-tiers/${userId}`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
          setForm({
            tier: result.data.user.sellerTier,
            reason: "",
            feeOverride: result.data.user.customFeeRate?.toString() || "",
            extendDays: "30",
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/seller-tiers/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: form.tier,
          reason: form.reason || undefined,
          feeOverride: form.feeOverride ? parseInt(form.feeOverride) : null,
          extendDays: form.tier !== "FREE" ? parseInt(form.extendDays) : undefined,
        }),
      });

      const result = await res.json();

      if (result.success) {
        setMessage({ type: "success", text: "Tier berhasil diupdate" });
        // Refresh data
        const refresh = await fetch(`/api/admin/seller-tiers/${userId}`);
        const refreshData = await refresh.json();
        if (refreshData.success) {
          setData(refreshData.data);
        }
      } else {
        setMessage({ type: "error", text: result.message || "Gagal update tier" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Terjadi kesalahan" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="h-64 bg-slate-200 rounded" />
          <div className="h-48 bg-slate-200 rounded" />
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="p-6">
        <div className="bg-white rounded-xl p-12 text-center">
          <p className="text-slate-500">Seller tidak ditemukan</p>
          <Link href="/admin/sellers" className="text-blue-600 hover:underline mt-4 inline-block">
            Kembali ke daftar
          </Link>
        </div>
      </main>
    );
  }

  const { user, tierInfo, tierHistory } = data;
  const currentConfig = tierConfig[user.sellerTier];

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <Link
        href="/admin/sellers"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Daftar Seller
      </Link>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* User Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name || ""} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center">
              <span className="text-2xl font-bold text-slate-500">
                {(user.name || user.username).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">{user.name || user.username}</h1>
            <p className="text-slate-500">{user.email}</p>
            {user.whatsapp && <p className="text-slate-500 text-sm">WhatsApp: {user.whatsapp}</p>}
            <p className="text-slate-400 text-sm mt-1">@{user.username}</p>
          </div>
          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${currentConfig.bg} ${currentConfig.color}`}>
            <currentConfig.icon className="h-4 w-4" />
            {currentConfig.label}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div>
            <p className="text-sm text-slate-500">Products</p>
            <p className="text-xl font-bold text-slate-900">{user.productCount}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Orders</p>
            <p className="text-xl font-bold text-slate-900">{user.orderCount}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Platform Fee</p>
            <p className="text-xl font-bold text-slate-900">
              {user.customFeeRate !== null ? `${user.customFeeRate}%` : `${tierInfo.platformFee}%`}
              {user.customFeeRate !== null && (
                <span className="text-xs text-slate-400 ml-1">(override)</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Subscription</p>
            <p className="text-xl font-bold text-slate-900">
              {user.subscriptionEnd ? (
                new Date(user.subscriptionEnd) > new Date() ? (
                  new Date(user.subscriptionEnd).toLocaleDateString("id-ID")
                ) : (
                  <span className="text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Expired
                  </span>
                )
              ) : (
                <span className="text-slate-400">N/A</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Tier Management Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Ubah Tier</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tier</label>
            <select
              value={form.tier}
              onChange={(e) => setForm({ ...form, tier: e.target.value as SellerTier })}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            >
              {tierOptions.map((tier) => (
                <option key={tier} value={tier}>
                  {tierConfig[tier].label} ({tier === "FREE" ? "Free" : tier === "PRO" ? "5%" : "3%"} fee)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Override Fee (%)</label>
            <input
              type="number"
              min="0"
              max="20"
              value={form.feeOverride}
              onChange={(e) => setForm({ ...form, feeOverride: e.target.value })}
              placeholder="Kosongkan untuk gunakan default tier"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">0-20%. Kosongkan untuk gunakan fee default tier</p>
          </div>

          {form.tier !== "FREE" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Perpanjang (hari)</label>
              <input
                type="number"
                min="1"
                value={form.extendDays}
                onChange={(e) => setForm({ ...form, extendDays: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Alasan</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Alasan perubahan tier (opsional)"
              rows={2}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving || form.tier === user.sellerTier}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Menyimpan...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Simpan Perubahan
              </>
            )}
          </button>
        </form>
      </div>

      {/* Tier Features */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Fitur {tierInfo.displayName}</h2>
        <ul className="space-y-2">
          {tierInfo.features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2 text-slate-600">
              <Check className="h-4 w-4 text-green-500" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Tier History */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Riwayat Tier</h2>
        {tierHistory.length === 0 ? (
          <p className="text-slate-500 text-sm">Belum ada riwayat perubahan tier</p>
        ) : (
          <div className="space-y-3">
            {tierHistory.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {log.oldTier && (
                      <>
                        <span className={`text-xs font-medium ${tierConfig[log.oldTier]?.color || "text-slate-500"}`}>
                          {tierConfig[log.oldTier]?.label || log.oldTier}
                        </span>
                        <span className="text-slate-400">→</span>
                      </>
                    )}
                    <span className={`text-xs font-medium ${tierConfig[log.newTier]?.color || "text-slate-500"}`}>
                      {tierConfig[log.newTier]?.label || log.newTier}
                    </span>
                  </div>
                  {log.reason && <p className="text-sm text-slate-600 mt-1">{log.reason}</p>}
                  {log.feeOverride !== null && (
                    <p className="text-xs text-slate-500">Fee override: {log.feeOverride}%</p>
                  )}
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(log.createdAt).toLocaleString("id-ID", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
