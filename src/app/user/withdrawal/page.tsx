"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowDownToLine,
  AlertCircle,
  Loader2,
  RefreshCw,
  History,
  Banknote,
  TrendingUp,
  Percent,
} from "lucide-react";

interface BalanceData {
  grossRevenue: number;
  totalAffiliateCommission: number;
  netOwnSales: number;
  platformFees: number;
  totalAffiliateEarnings: number;
  totalWithdrawn: number;
  pendingAmount: number;
  availableBalance: number;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  status: string;
  notes: string | null;
  createdAt: string;
  processedAt: string | null;
}

interface BankInfo {
  bankName: string | null;
  bankAccount: string | null;
  bankHolder: string | null;
}

const STATUS_CONFIG = {
  PENDING: { label: "Menunggu", color: "bg-amber-100 text-amber-700", icon: Clock },
  APPROVED: { label: "Disetujui", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
  REJECTED: { label: "Ditolak", color: "bg-red-100 text-red-700", icon: XCircle },
  COMPLETED: { label: "Selesai", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
};

export default function WithdrawalPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [showBankForm, setShowBankForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankForm, setBankForm] = useState({
    bankName: "",
    bankAccount: "",
    bankHolder: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [balanceRes, bankRes] = await Promise.all([
        fetch("/api/withdrawal"),
        fetch("/api/withdrawal/bank-info"),
      ]);

      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setBalanceData(balanceData.data.balance);
        setRequests(balanceData.data.requests);
      }

      if (bankRes.ok) {
        const bankData = await bankRes.json();
        if (bankData.data) {
          setBankInfo(bankData.data);
          setBankForm({
            bankName: bankData.data.bankName || "",
            bankAccount: bankData.data.bankAccount || "",
            bankHolder: bankData.data.bankHolder || "",
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBankInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/withdrawal/bank-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bankForm),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Rekening berhasil disimpan" });
        setShowBankForm(false);
        setBankInfo(data.data);
      } else {
        setMessage({ type: "error", text: data.error || "Gagal menyimpan" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Terjadi kesalahan" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/withdrawal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: withdrawAmount,
          bankName: bankInfo?.bankName || bankForm.bankName,
          bankAccount: bankInfo?.bankAccount || bankForm.bankAccount,
          bankHolder: bankInfo?.bankHolder || bankForm.bankHolder,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Permintaan penarikan berhasil diajukan" });
        setShowWithdrawForm(false);
        setWithdrawAmount("");
        fetchData();
      } else {
        setMessage({ type: "error", text: data.error || "Gagal mengajukan penarikan" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Terjadi kesalahan" });
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount == null) return "-";
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

  const hasBankInfo = bankInfo?.bankName && bankInfo?.bankAccount && bankInfo?.bankHolder;

  if (loading) {
    return (
      <main className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Penarikan Dana</h1>
        <p className="text-slate-500 mt-1">Kelola saldo dan ajukan penarikan komisi affiliate</p>
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

      {/* Balance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Banknote className="h-5 w-5 opacity-80" />
          </div>
          <p className="text-lg font-bold">
            {balanceData ? formatCurrency(balanceData.availableBalance) : "-"}
          </p>
          <p className="text-xs text-green-100 mt-1">Tersedia</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-100 rounded-xl p-2">
              <Wallet className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900">
            {balanceData ? formatCurrency(balanceData.grossRevenue) : "-"}
          </p>
          <p className="text-xs text-slate-500 mt-1">Penjualan Gross</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-amber-100 rounded-xl p-2">
              <TrendingUp className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900">
            {balanceData ? formatCurrency(balanceData.netOwnSales) : "-"}
          </p>
          <p className="text-xs text-slate-500 mt-1">Penjualan Bersih</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-purple-100 rounded-xl p-2">
              <ArrowDownToLine className="h-4 w-4 text-purple-600" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900">
            {balanceData ? formatCurrency(balanceData.totalAffiliateEarnings) : "-"}
          </p>
          <p className="text-xs text-slate-500 mt-1">Komisi Affiliate (+)</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-orange-100 rounded-xl p-2">
              <Percent className="h-4 w-4 text-orange-600" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900">
            {balanceData ? formatCurrency(balanceData.totalAffiliateCommission) : "-"}
          </p>
          <p className="text-xs text-slate-500 mt-1">Komisi Affiliator (-)</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-red-100 rounded-xl p-2">
              <Banknote className="h-4 w-4 text-red-600" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900">
            {balanceData ? formatCurrency(balanceData.platformFees) : "-"}
          </p>
          <p className="text-xs text-slate-500 mt-1">Platform Fee (-)</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-amber-100 rounded-xl p-2">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900">
            {balanceData ? formatCurrency(balanceData.pendingAmount) : "-"}
          </p>
          <p className="text-xs text-slate-500 mt-1">Pending (-)</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-100 rounded-xl p-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900">
            {balanceData ? formatCurrency(balanceData.totalWithdrawn) : "-"}
          </p>
          <p className="text-xs text-slate-500 mt-1">Sudah Dicairkan (-)</p>
        </div>
      </div>

      {/* Bank Info Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-xl p-3">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Informasi Rekening</h2>
              <p className="text-sm text-slate-500">Rekening tujuan penarikan</p>
            </div>
          </div>
          <button
            onClick={() => setShowBankForm(!showBankForm)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {showBankForm ? "Batal" : bankInfo?.bankName ? "Ubah" : "Tambah"}
          </button>
        </div>

        {showBankForm ? (
          <form onSubmit={handleSaveBankInfo} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Bank</label>
                <input
                  type="text"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  placeholder="Contoh: BCA"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Rekening</label>
                <input
                  type="text"
                  value={bankForm.bankAccount}
                  onChange={(e) => setBankForm({ ...bankForm, bankAccount: e.target.value })}
                  placeholder="1234567890"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Pemilik</label>
                <input
                  type="text"
                  value={bankForm.bankHolder}
                  onChange={(e) => setBankForm({ ...bankForm, bankHolder: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBankForm(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-900"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan Rekening
              </button>
            </div>
          </form>
        ) : bankInfo?.bankName ? (
          <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{bankInfo.bankName}</p>
                <p className="text-sm text-slate-500">{bankInfo.bankAccount}</p>
                <p className="text-xs text-slate-400">{bankInfo.bankHolder}</p>
              </div>
            </div>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p>Belum ada informasi rekening</p>
            <p className="text-sm text-slate-400 mt-1">Tambahkan rekening untuk mengajukan penarikan</p>
          </div>
        )}
      </div>

      {/* Withdrawal Button */}
      {hasBankInfo && balanceData && balanceData.availableBalance >= 50000 && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Ajukan Penarikan</h3>
              <p className="text-blue-100 mt-1">
                Minimum penarikan Rp 50.000
              </p>
            </div>
            <button
              onClick={() => setShowWithdrawForm(!showWithdrawForm)}
              className="flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-medium hover:bg-blue-50 transition-colors"
            >
              <ArrowDownToLine className="h-4 w-4" />
              {showWithdrawForm ? "Batal" : "Cairkan Sekarang"}
            </button>
          </div>

          {showWithdrawForm && (
            <form onSubmit={handleWithdraw} className="mt-6 bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-blue-100 mb-1">Jumlah Penarikan</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="50000"
                    max={balanceData.availableBalance}
                    min="50000"
                    className="w-full px-4 py-3 rounded-xl text-slate-900 font-semibold"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Ajukan
                </button>
              </div>
              <p className="text-xs text-blue-100 mt-2">
                Saldo tersedia: {formatCurrency(balanceData.availableBalance)}
              </p>
            </form>
          )}
        </div>
      )}

      {/* Minimum info */}
      {hasBankInfo && balanceData && balanceData.availableBalance < 50000 && balanceData.availableBalance > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <p className="text-amber-800 text-sm">
            Saldo Anda kurang dari minimum penarikan (Rp 50.000). Tetap promosikan produk untuk menambah komisi.
          </p>
        </div>
      )}

      {/* No bank info notice */}
      {!hasBankInfo && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <p className="text-amber-800 text-sm">
            Tambahkan informasi rekening di atas untuk bisa mengajukan penarikan.
          </p>
        </div>
      )}

      {/* Withdrawal History */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <History className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900">Riwayat Penarikan</h2>
        </div>

        {requests.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <History className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Belum ada riwayat penarikan</p>
            <p className="text-sm text-slate-400 mt-1">Riwayat penarikan akan muncul di sini</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((req) => {
              const config = STATUS_CONFIG[req.status as keyof typeof STATUS_CONFIG];
              const IconComponent = config.icon;

              return (
                <div key={req.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${config.color}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {formatCurrency(req.amount)}
                        </p>
                        <p className="text-sm text-slate-500">
                          {req.bankName} - {req.bankAccount}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatDate(req.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                        {config.label}
                      </span>
                      {req.notes && (
                        <p className="text-xs text-slate-500 mt-1">{req.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}