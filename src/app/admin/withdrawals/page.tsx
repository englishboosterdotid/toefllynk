"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  Filter,
  DollarSign,
  Users,
} from "lucide-react";

interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  status: string;
  notes: string | null;
  createdAt: string;
  processedAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    username: string;
  };
}

interface Stats {
  pendingCount: number;
  totalPendingAmount: number;
  totalApprovedAmount: number;
  totalRequests: number;
}

export default function AdminWithdrawalsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchWithdrawals();
  }, [filter]);

  const fetchWithdrawals = async () => {
    try {
      const url = filter === "all" ? "/api/admin/withdrawals" : `/api/admin/withdrawals?status=${filter}`;
      const res = await fetch(url);

      if (res.ok) {
        const data = await res.json();
        setRequests(data.data.requests);
        setStats(data.data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch withdrawals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: "APPROVE" | "REJECT" | "COMPLETE") => {
    setActionLoading(id);
    setMessage(null);

    try {
      const notes = prompt(`Enter notes for ${action.toLowerCase()}ing this withdrawal (optional):`);

      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: data.message });
        fetchWithdrawals();
        setSelectedRequest(null);
      } else {
        setMessage({ type: "error", text: data.error || "Action failed" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Terjadi kesalahan" });
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString("id-ID")}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const STATUS_CONFIG = {
    PENDING: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: Clock },
    APPROVED: { label: "Approved", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
    REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700", icon: XCircle },
    COMPLETED: { label: "Completed", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  };

  if (loading) {
    return (
      <main className="p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </main>
    );
  }

  return (
    <main className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Penarikan Dana</h1>
          <p className="text-slate-500 mt-1">Kelola permintaan penarikan affiliate</p>
        </div>
        <button
          onClick={fetchWithdrawals}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Clock className="h-6 w-6 opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              {stats?.pendingCount || 0} request
            </span>
          </div>
          <p className="text-2xl font-bold">
            {stats ? formatCurrency(stats.totalPendingAmount) : "-"}
          </p>
          <p className="text-xs text-amber-100 mt-1">Pending Amount</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-100 rounded-xl p-2">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900">
            {stats ? formatCurrency(stats.totalApprovedAmount) : "-"}
          </p>
          <p className="text-xs text-slate-500 mt-1">Total Disbursed</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-100 rounded-xl p-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900">
            {stats?.totalRequests || 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">Total Requests</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-purple-100 rounded-xl p-2">
              <Wallet className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900">
            {stats ? formatCurrency(stats.totalPendingAmount + stats.totalApprovedAmount) : "-"}
          </p>
          <p className="text-xs text-slate-500 mt-1">Total Processed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Filter className="h-5 w-5 text-slate-400" />
        <div className="flex gap-2">
          {["all", "PENDING", "APPROVED", "REJECTED", "COMPLETED"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f === "all" ? "Semua" : STATUS_CONFIG[f as keyof typeof STATUS_CONFIG]?.label || f}
            </button>
          ))}
        </div>
      </div>

      {/* Withdrawal List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">User</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Amount</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Bank Info</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Date</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Wallet className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Belum Ada Request</h3>
                    <p className="text-slate-500">Tidak ada permintaan penarikan</p>
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const config = STATUS_CONFIG[req.status as keyof typeof STATUS_CONFIG];
                  const IconComponent = config.icon;

                  return (
                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">{req.user.name || req.user.username}</p>
                          <p className="text-sm text-slate-500">{req.user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-lg font-bold text-green-600">{formatCurrency(req.amount)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-700">{req.bankName}</p>
                        <p className="text-sm text-slate-500">{req.bankAccount}</p>
                        <p className="text-xs text-slate-400">{req.bankHolder}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                          <IconComponent className="h-3.5 w-3.5" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-500">{formatDate(req.createdAt)}</p>
                        {req.processedAt && (
                          <p className="text-xs text-slate-400">Processed: {formatDate(req.processedAt)}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {req.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleAction(req.id, "APPROVE")}
                                disabled={actionLoading === req.id}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                              >
                                {actionLoading === req.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                )}
                                Approve
                              </button>
                              <button
                                onClick={() => handleAction(req.id, "REJECT")}
                                disabled={actionLoading === req.id}
                                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                              >
                                {actionLoading === req.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5" />
                                )}
                                Reject
                              </button>
                            </>
                          )}
                          {req.status === "APPROVED" && (
                            <button
                              onClick={() => handleAction(req.id, "COMPLETE")}
                              disabled={actionLoading === req.id}
                              className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                            >
                              {actionLoading === req.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                              Mark Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Withdrawal Details</h2>

            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-500">User</p>
                <p className="font-semibold text-slate-900">
                  {selectedRequest.user.name || selectedRequest.user.username}
                </p>
                <p className="text-sm text-slate-500">{selectedRequest.user.email}</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-500">Amount</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedRequest.amount)}</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-500 mb-2">Bank Information</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Bank</p>
                    <p className="font-medium text-slate-900">{selectedRequest.bankName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Account</p>
                    <p className="font-medium text-slate-900">{selectedRequest.bankAccount}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-400">Holder Name</p>
                    <p className="font-medium text-slate-900">{selectedRequest.bankHolder}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                    STATUS_CONFIG[selectedRequest.status as keyof typeof STATUS_CONFIG].color
                  }`}>
                    {STATUS_CONFIG[selectedRequest.status as keyof typeof STATUS_CONFIG].label}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Requested</p>
                  <p className="font-medium text-slate-900">{formatDate(selectedRequest.createdAt)}</p>
                </div>
              </div>

              {selectedRequest.notes && (
                <div className="bg-amber-50 rounded-xl p-4">
                  <p className="text-sm text-slate-500">Notes</p>
                  <p className="font-medium text-slate-900">{selectedRequest.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 text-slate-600 hover:text-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}