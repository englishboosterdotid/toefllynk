import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { AnimatedContainer } from "@/components/animations";
import { Crown, Star, TrendingUp, Check, AlertTriangle, X } from "lucide-react";

type SellerTier = "FREE" | "PRO" | "BUSINESS";

const tierConfig: Record<SellerTier, { label: string; color: string; bg: string; icon: any }> = {
  FREE: { label: "Coba", color: "text-slate-600", bg: "bg-slate-100", icon: Star },
  PRO: { label: "Berkembang", color: "text-purple-600", bg: "bg-purple-100", icon: TrendingUp },
  BUSINESS: { label: "Bisnis", color: "text-amber-600", bg: "bg-amber-100", icon: Crown },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pending", color: "text-amber-600", bg: "bg-amber-100" },
  ACTIVE: { label: "Active", color: "text-green-600", bg: "bg-green-100" },
  EXPIRED: { label: "Expired", color: "text-red-600", bg: "bg-red-100" },
  CANCELLED: { label: "Cancelled", color: "text-slate-600", bg: "bg-slate-100" },
};

export default async function AdminSubscriptionsPage() {
  await requireAdmin();

  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Get user info for each subscription
  const userIds = subscriptions.map((s) => s.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      avatar: true,
      profile: {
        select: { sellerTier: true },
      },
    },
  });

  const userMap = new Map(users.map((u) => [u.id, {
    ...u,
    sellerTier: u.profile?.sellerTier || "FREE" as SellerTier,
  }]));

  // Stats
  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter((s) => s.status === "ACTIVE").length,
    pending: subscriptions.filter((s) => s.status === "PENDING").length,
    expired: subscriptions.filter((s) => s.status === "EXPIRED").length,
  };

  const tierStats = {
    FREE: users.filter((u) => (u.profile?.sellerTier || "FREE") === "FREE").length,
    PRO: users.filter((u) => u.profile?.sellerTier === "PRO").length,
    BUSINESS: users.filter((u) => u.profile?.sellerTier === "BUSINESS").length,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <main className="p-6">
      <AnimatedContainer>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Subscriptions</h1>
          <p className="text-slate-500">Manage seller subscriptions and tiers</p>
        </div>
      </AnimatedContainer>

      {/* Stats */}
      <AnimatedContainer delay={0.1}>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500 mb-1">Total Subscriptions</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-green-600 mb-1">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-amber-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-red-600 mb-1">Expired</p>
            <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
          </div>
        </div>
      </AnimatedContainer>

      {/* Tier Distribution */}
      <AnimatedContainer delay={0.15}>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {(Object.keys(tierConfig) as SellerTier[]).map((tier) => {
            const config = tierConfig[tier];
            return (
              <div key={tier} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-lg ${config.bg}`}>
                    <config.icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{tierStats[tier]}</p>
                <p className="text-xs text-slate-500">sellers</p>
              </div>
            );
          })}
        </div>
      </AnimatedContainer>

      {/* Subscriptions Table */}
      <AnimatedContainer delay={0.2}>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Current Tier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Started</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Expires</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Transaction ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      No subscriptions found
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => {
                    const user = userMap.get(sub.userId);
                    const status = statusConfig[sub.status] || statusConfig.PENDING;
                    const tierStyle = tierConfig[sub.tier as SellerTier] || tierConfig.FREE;

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                              {user?.avatar ? (
                                <img src={user.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                              ) : (
                                (user?.name || user?.username || "?").charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{user?.name || user?.username || "Unknown"}</p>
                              <p className="text-xs text-slate-500">{user?.email || "-"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tierStyle.bg} ${tierStyle.color}`}>
                            <tierStyle.icon className="h-3 w-3" />
                            {tierStyle.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tierStyle.bg} ${tierStyle.color}`}>
                            {tierConfig[sub.tier as SellerTier]?.label || sub.tier}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {formatCurrency(sub.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                            {sub.status === "ACTIVE" ? (
                              <Check className="h-3 w-3" />
                            ) : sub.status === "EXPIRED" ? (
                              <X className="h-3 w-3" />
                            ) : sub.status === "PENDING" ? (
                              <AlertTriangle className="h-3 w-3" />
                            ) : null}
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {sub.startedAt
                            ? new Date(sub.startedAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {sub.expiresAt
                            ? new Date(sub.expiresAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 font-mono">
                          {sub.transactionId || "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AnimatedContainer>
    </main>
  );
}
