"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Filter, ChevronRight, Crown, Star, Users, TrendingUp } from "lucide-react";

type SellerTier = "FREE" | "PRO" | "BUSINESS";

interface Seller {
  id: string;
  name: string | null;
  email: string;
  username: string;
  avatar: string | null;
  sellerTier: SellerTier;
  subscriptionEnd: string | null;
  productCount: number;
  createdAt: string;
}

const tierConfig: Record<SellerTier, { label: string; color: string; bg: string; icon: any }> = {
  FREE: { label: "Coba", color: "text-slate-600", bg: "bg-slate-100", icon: Star },
  PRO: { label: "Berkembang", color: "text-purple-600", bg: "bg-purple-100", icon: TrendingUp },
  BUSINESS: { label: "Bisnis", color: "text-amber-600", bg: "bg-amber-100", icon: Crown },
};

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<SellerTier | "ALL">("ALL");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [stats, setStats] = useState<Record<string, number>>({});

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (tierFilter !== "ALL") params.set("tier", tierFilter);

      const res = await fetch(`/api/admin/seller-tiers?${params}`);
      const data = await res.json();

      if (data.success) {
        setSellers(data.sellers);
        setPagination({
          page: data.pagination.page,
          totalPages: data.pagination.totalPages,
          total: data.pagination.total,
        });
        setStats(data.stats.tierDistribution || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [pagination.page, tierFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((p) => ({ ...p, page: 1 }));
    fetchSellers();
  };

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Seller Management</h1>
          <p className="text-slate-500">Kelola tier dan langganan seller</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {(Object.keys(tierConfig) as SellerTier[]).map((tier) => {
          const config = tierConfig[tier];
          return (
            <div
              key={tier}
              className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:border-slate-300 transition-colors"
              onClick={() => setTierFilter(tierFilter === tier ? "ALL" : tier)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${config.bg}`}>
                  <config.icon className={`h-4 w-4 ${config.color}`} />
                </div>
                <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats[tier] || 0}</p>
              <p className="text-xs text-slate-500">sellers</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, email, atau username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as SellerTier | "ALL")}
            className="px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none"
          >
            <option value="ALL">Semua Tier</option>
            {(Object.keys(tierConfig) as SellerTier[]).map((tier) => (
              <option key={tier} value={tier}>
                {tierConfig[tier].label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Filter className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Seller</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Tier</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Products</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Joined</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-slate-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4" colSpan={5}>
                    <div className="h-10 bg-slate-100 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : sellers.length === 0 ? (
              <tr>
                <td className="px-6 py-12 text-center text-slate-500" colSpan={5}>
                  Tidak ada seller ditemukan
                </td>
              </tr>
            ) : (
              sellers.map((seller) => {
                const config = tierConfig[seller.sellerTier];
                return (
                  <tr key={seller.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {seller.avatar ? (
                          <img
                            src={seller.avatar}
                            alt={seller.name || seller.username}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-slate-500">
                              {(seller.name || seller.username).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900">{seller.name || seller.username}</p>
                          <p className="text-sm text-slate-500">{seller.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                        <config.icon className="h-3 w-3" />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{seller.productCount}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {new Date(seller.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/sellers/${seller.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Manage
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 rounded border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Prev
              </button>
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 rounded border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
