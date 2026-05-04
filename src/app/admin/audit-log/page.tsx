"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  User,
  Calendar,
  Clock,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { AnimatedContainer } from "@/components/animations";
import Link from "next/link";

type AuditLog = {
  id: string;
  adminId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValue: any;
  newValue: any;
  ipAddress: string | null;
  userAgent: string | null;
  details: string | null;
  createdAt: string;
  admin: {
    id: string;
    name: string | null;
    email: string;
  };
};

const actionColors: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  LOGIN: "bg-purple-100 text-purple-700",
  LOGOUT: "bg-slate-100 text-slate-700",
  VIEW: "bg-slate-100 text-slate-700",
  EXPORT: "bg-amber-100 text-amber-700",
};

const actionIcons: Record<string, React.ElementType> = {
  CREATE: Plus,
  UPDATE: Edit,
  DELETE: Trash2,
  LOGIN: User,
  LOGOUT: User,
  VIEW: Eye,
  EXPORT: Download,
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    action: "",
    entityType: "",
    adminId: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewModal, setViewModal] = useState<AuditLog | null>(null);

  const take = 20;

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("take", String(take));
      params.set("skip", String(page * take));
      if (filters.action) params.set("action", filters.action);
      if (filters.entityType) params.set("entityType", filters.entityType);
      if (filters.adminId) params.set("adminId", filters.adminId);

      const res = await fetch(`/api/admin/audit-log?${params}`);
      const data = await res.json();

      if (data.success) {
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
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

  const entityTypes = [...new Set(logs.map((l) => l.entityType))];

  return (
    <main className="p-8 space-y-6">
      {/* Page Header */}
      <AnimatedContainer>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Audit Log</h1>
              <p className="text-slate-500">Track semua aktivitas admin</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchLogs}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </AnimatedContainer>

      {/* Stats */}
      <AnimatedContainer delay={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Logs", value: total, color: "text-slate-600" },
            { label: "Creates", value: logs.filter((l) => l.action === "CREATE").length, color: "text-green-600" },
            { label: "Updates", value: logs.filter((l) => l.action === "UPDATE").length, color: "text-blue-600" },
            { label: "Deletes", value: logs.filter((l) => l.action === "DELETE").length, color: "text-red-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </AnimatedContainer>

      {/* Filters */}
      <AnimatedContainer delay={0.2}>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search admin, entity..."
                  className="pl-12 pr-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                  onChange={(e) =>
                    setFilters({ ...filters, adminId: e.target.value })
                  }
                />
              </div>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
                <option value="VIEW">View</option>
                <option value="EXPORT">Export</option>
              </select>
              <select
                value={filters.entityType}
                onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Entities</option>
                {entityTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </AnimatedContainer>

      {/* Logs Table */}
      <AnimatedContainer delay={0.3}>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                    Timestamp
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                    Admin
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                    Action
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                    Entity
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                    Details
                  </th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Shield className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">Belum ada activity log</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const ActionIcon = actionIcons[log.action] || Eye;
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Clock className="h-4 w-4 text-slate-400" />
                            {formatDate(log.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-medium">
                              {log.admin.name?.[0] || log.admin.email[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {log.admin.name || "Admin"}
                              </p>
                              <p className="text-xs text-slate-500">{log.admin.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${actionColors[log.action]}`}>
                            <ActionIcon className="h-3 w-3" />
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{log.entityType}</p>
                            {log.entityId && (
                              <p className="text-xs text-slate-400 font-mono">{log.entityId.slice(0, 8)}...</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-600 line-clamp-1">{log.details || "-"}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setViewModal(log)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > take && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                Showing {page * take + 1} to {Math.min((page + 1) * take, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 rounded-xl border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={(page + 1) * take >= total}
                  className="px-4 py-2 rounded-xl border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </AnimatedContainer>

      {/* View Modal */}
      {viewModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setViewModal(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Audit Log Detail</h2>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Admin</p>
                  <p className="text-slate-900">{viewModal.admin.name || "Admin"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Action</p>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${actionColors[viewModal.action]}`}>
                    {viewModal.action}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Entity Type</p>
                  <p className="text-slate-900">{viewModal.entityType}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Entity ID</p>
                  <p className="text-slate-900 font-mono text-sm">{viewModal.entityId || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">IP Address</p>
                  <p className="text-slate-900">{viewModal.ipAddress || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Timestamp</p>
                  <p className="text-slate-900">{formatDate(viewModal.createdAt)}</p>
                </div>
              </div>

              {viewModal.details && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">Details</p>
                  <p className="text-slate-900">{viewModal.details}</p>
                </div>
              )}

              {viewModal.oldValue && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">Old Value</p>
                  <pre className="bg-red-50 rounded-xl p-4 text-xs text-red-800 overflow-x-auto">
                    {JSON.stringify(viewModal.oldValue, null, 2)}
                  </pre>
                </div>
              )}

              {viewModal.newValue && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">New Value</p>
                  <pre className="bg-green-50 rounded-xl p-4 text-xs text-green-800 overflow-x-auto">
                    {JSON.stringify(viewModal.newValue, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setViewModal(null)}
                className="w-full px-4 py-2 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}
