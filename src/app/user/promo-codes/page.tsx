"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Tag, Copy, Trash2, Edit2, Check, X, Percent, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PromoCode {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minPurchase: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  startDate: string;
  endDate: string | null;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED" | "USED_UP";
  createdAt: string;
  _count?: { redemptions: number };
}

export default function PromoCodesPage() {
  const router = useRouter();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    type: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    value: "",
    minPurchase: "",
    maxDiscount: "",
    usageLimit: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const res = await fetch("/api/user/promo-codes");
      if (res.status === 403) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }
      const data = await res.json();
      setPromoCodes(data.promoCodes || []);
      setHasAccess(true);
    } catch (error) {
      console.error("Failed to fetch promo codes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.code || !formData.value) {
      setMessage({ type: "error", text: "Kode dan nilai diskon harus diisi" });
      return;
    }

    try {
      const res = await fetch("/api/user/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.code,
          type: formData.type,
          value: parseInt(formData.value),
          minPurchase: formData.minPurchase ? parseInt(formData.minPurchase) : 0,
          maxDiscount: formData.maxDiscount ? parseInt(formData.maxDiscount) : null,
          usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: "Kode promo berhasil dibuat" });
        setShowCreateForm(false);
        setFormData({
          code: "",
          type: "PERCENTAGE",
          value: "",
          minPurchase: "",
          maxDiscount: "",
          usageLimit: "",
          startDate: "",
          endDate: "",
        });
        fetchPromoCodes();
      } else {
        setMessage({ type: "error", text: data.error || "Gagal membuat kode promo" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Terjadi kesalahan" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus kode promo ini?")) return;

    try {
      const res = await fetch(`/api/user/promo-codes/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: "Kode promo berhasil dihapus" });
        fetchPromoCodes();
      } else {
        setMessage({ type: "error", text: data.error || "Gagal menghapus" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Terjadi kesalahan" });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      const res = await fetch(`/api/user/promo-codes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: `Status diubah ke ${newStatus === "ACTIVE" ? "Aktif" : "Nonaktif"}` });
        fetchPromoCodes();
      }
    } catch (error) {
      setMessage({ type: "error", text: "Terjadi kesalahan" });
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setMessage({ type: "success", text: "Kode berhasil disalin" });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-700">Aktif</Badge>;
      case "INACTIVE":
        return <Badge className="bg-gray-100 text-gray-700">Nonaktif</Badge>;
      case "EXPIRED":
        return <Badge className="bg-red-100 text-red-700">Kadaluarsa</Badge>;
      case "USED_UP":
        return <Badge className="bg-amber-100 text-amber-700">Habis</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-32 bg-slate-200 rounded" />
          <div className="h-32 bg-slate-200 rounded" />
        </div>
      </main>
    );
  }

  if (!hasAccess) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">Upgrade Diperlukan</CardTitle>
            <CardDescription className="text-amber-700">
              Kode promo memerlukan langganan PRO atau BUSINESS.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/user/subscription")}>
              Upgrade Sekarang
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kode Promo</h1>
          <p className="text-slate-500">Kelola kode promo dan diskon untuk produk Anda</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Buat Kode Promo
        </Button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Buat Kode Promo Baru</CardTitle>
            <CardDescription>Masukkan detail kode promo Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Kode Promo</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })}
                  placeholder="DISKON20"
                  className="font-mono"
                />
              </div>
              <div>
                <Label>Tipe Diskon</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant={formData.type === "PERCENTAGE" ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, type: "PERCENTAGE" })}
                    size="sm"
                  >
                    <Percent className="h-4 w-4 mr-1" />
                    Persen
                  </Button>
                  <Button
                    type="button"
                    variant={formData.type === "FIXED" ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, type: "FIXED" })}
                    size="sm"
                  >
                    <DollarSign className="h-4 w-4 mr-1" />
                    Fixed (Rp)
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="value">{formData.type === "PERCENTAGE" ? "Persentase (%)" : "Nominal (Rp)"}</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder={formData.type === "PERCENTAGE" ? "20" : "50000"}
                />
              </div>
              <div>
                <Label htmlFor="minPurchase">Min. Pembelian (Rp)</Label>
                <Input
                  id="minPurchase"
                  type="number"
                  value={formData.minPurchase}
                  onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxDiscount">Max. Diskon (Rp)</Label>
                <Input
                  id="maxDiscount"
                  type="number"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                  placeholder="Kosong = tanpa batas"
                />
              </div>
              <div>
                <Label htmlFor="usageLimit">Batas Penggunaan</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  placeholder="Kosong = unlimited"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Tanggal Mulai</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Tanggal Berakhir</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreate}>Simpan</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>Batal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Promo Codes List */}
      <div className="space-y-4">
        {promoCodes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Tag className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">Belum ada kode promo</p>
              <p className="text-sm text-slate-400">Buat kode promo pertama Anda</p>
            </CardContent>
          </Card>
        ) : (
          promoCodes.map((promo) => (
            <Card key={promo.id} className={promo.status === "INACTIVE" ? "opacity-60" : ""}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-xl">
                      <Tag className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-lg font-bold text-slate-900">{promo.code}</code>
                        <button
                          onClick={() => copyToClipboard(promo.code)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span>
                          {promo.type === "PERCENTAGE" ? `${promo.value}%` : `Rp ${promo.value.toLocaleString("id-ID")}`}
                        </span>
                        {promo.maxDiscount && <span>Max Rp {promo.maxDiscount.toLocaleString("id-ID")}</span>}
                        {promo.minPurchase > 0 && <span>Min Rp {promo.minPurchase.toLocaleString("id-ID")}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-700">
                        {promo.usageCount} / {promo.usageLimit || "∞"}
                      </p>
                      <p className="text-xs text-slate-400">penggunaan</p>
                    </div>
                    {getStatusBadge(promo.status)}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(promo.id, promo.status)}
                      >
                        {promo.status === "ACTIVE" ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(promo.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-400">
                  {promo.startDate && `Aktif: ${formatDate(promo.startDate)}`}
                  {promo.endDate && ` - ${formatDate(promo.endDate)}`}
                  {!promo.startDate && !promo.endDate && "Selalu aktif"}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </main>
  );
}