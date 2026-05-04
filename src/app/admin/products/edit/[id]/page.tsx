"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  Package,
  Image as ImageIcon,
  Sparkles,
  FileText,
  Loader2,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedContainer } from "@/components/animations";
import { FileUpload } from "@/components/ui/FileUpload";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Product = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  promoPrice: number | null;
  thumbnail: string | null;
  checkoutLink: string | null;
  category: string | null;
  productType: string;
  examCredits: number;
  certificateIncluded: boolean;
  reviewIncluded: boolean;
  zoomIncluded: boolean;
  affiliateEnabled: boolean;
  affiliateCommission: number;
  isArchived: boolean;
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    promoPrice: "",
    thumbnail: "",
    checkoutLink: "",
    category: "",
    productType: "TOEFL_SIMULATION",
    examCredits: "1",
    certificateIncluded: true,
    reviewIncluded: false,
    zoomIncluded: false,
    affiliateEnabled: false,
    affiliateCommission: "10",
    isArchived: false,
  });

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/admin/products/${productId}`);
      const data = await res.json();

      if (data.success && data.product) {
        const p = data.product;
        setForm({
          title: p.title || "",
          description: p.description || "",
          price: String(p.price) || "",
          promoPrice: p.promoPrice ? String(p.promoPrice) : "",
          thumbnail: p.thumbnail || "",
          checkoutLink: p.checkoutLink || "",
          category: p.category || "",
          productType: p.productType || "TOEFL_SIMULATION",
          examCredits: String(p.examCredits) || "1",
          certificateIncluded: p.certificateIncluded ?? true,
          reviewIncluded: p.reviewIncluded ?? false,
          zoomIncluded: p.zoomIncluded ?? false,
          affiliateEnabled: p.affiliateEnabled ?? false,
          affiliateCommission: String(p.affiliateCommission) || "10",
          isArchived: p.isArchived ?? false,
        });
      } else {
        setError("Produk tidak ditemukan");
      }
    } catch (err) {
      setError("Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/admin/products");
      } else {
        setError(data.message || "Gagal menyimpan produk");
      }
    } catch (err) {
      setError("Terjadi kesalahan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm("Apakah Anda yakin ingin mengarsipkan produk ini?")) return;

    setIsArchiving(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, isArchived: true }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/admin/products");
      } else {
        setError(data.message || "Gagal mengarsipkan produk");
      }
    } catch (err) {
      setError("Terjadi kesalahan");
    } finally {
      setIsArchiving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-500">Memuat data...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8 space-y-8">
      {/* Page Header */}
      <AnimatedContainer>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Edit Produk</h1>
            <p className="mt-1 text-slate-500">Edit paket ujian TOEFL</p>
          </div>
        </div>
      </AnimatedContainer>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3"
        >
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800 font-medium">{error}</span>
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <AnimatedContainer>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Informasi Dasar</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Nama Produk</Label>
                  <Input
                    id="title"
                    placeholder="TOEFL Simulation Premium"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <textarea
                    id="description"
                    rows={4}
                    placeholder="Deskripsi produk..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Harga (Rp)</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="299000"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="promoPrice">Harga Promo (Rp)</Label>
                    <Input
                      id="promoPrice"
                      type="number"
                      placeholder="199000"
                      value={form.promoPrice}
                      onChange={(e) => setForm({ ...form, promoPrice: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </AnimatedContainer>

          {/* Media & Links */}
          <AnimatedContainer delay={0.1}>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-100">
                  <ImageIcon className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Media & Link</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Product Thumbnail</Label>
                  <FileUpload
                    folder="products/thumbnails/"
                    accept="image/*"
                    maxSize={5}
                    currentValue={form.thumbnail}
                    onUploadComplete={(result) => {
                      setForm({ ...form, thumbnail: result.url });
                    }}
                    onUploadError={(err) => setError(err)}
                  />
                  <p className="text-xs text-slate-400">Or paste URL below</p>
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={form.thumbnail}
                    onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkoutLink">Checkout Link</Label>
                  <Input
                    id="checkoutLink"
                    placeholder="https://midtrans.com/..."
                    value={form.checkoutLink}
                    onChange={(e) => setForm({ ...form, checkoutLink: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Input
                    id="category"
                    placeholder="TOEFL ITP / TOEFL iBT"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </AnimatedContainer>

          {/* Features */}
          <AnimatedContainer delay={0.2}>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-green-100">
                  <Sparkles className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Fitur Produk</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="examCredits">Exam Credits</Label>
                    <Input
                      id="examCredits"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={form.examCredits}
                      onChange={(e) => setForm({ ...form, examCredits: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="affiliateCommission">Affiliate Commission (%)</Label>
                    <Input
                      id="affiliateCommission"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="10"
                      value={form.affiliateCommission}
                      onChange={(e) => setForm({ ...form, affiliateCommission: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "certificateIncluded", label: "Certificate", desc: "Sertakan sertifikat" },
                    { key: "reviewIncluded", label: "Review", desc: "Izinkan review jawaban" },
                    { key: "zoomIncluded", label: "Zoom Session", desc: "Sertakan zoom session" },
                    { key: "affiliateEnabled", label: "Affiliate", desc: "Aktifkan program affiliate" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div>
                        <p className="font-medium text-slate-900">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form[item.key as keyof typeof form] as boolean}
                          onChange={(e) => setForm({ ...form, [item.key]: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedContainer>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Submit */}
          <AnimatedContainer delay={0.3}>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <Button type="submit" className="w-full" size="lg" disabled={isSaving}>
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Menyimpan...
                  </span>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
              <Link href="/admin/products">
                <Button type="button" variant="outline" className="w-full">
                  Batal
                </Button>
              </Link>
            </div>
          </AnimatedContainer>

          {/* Archive */}
          {!form.isArchived && (
            <AnimatedContainer delay={0.4}>
              <div className="bg-white rounded-2xl border border-red-200 p-6 space-y-4">
                <h3 className="font-semibold text-red-600">Zona Berbahaya</h3>
                <p className="text-sm text-slate-500">
                  Produk yang diarsipkan tidak akan muncul di storefront
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50"
                  onClick={handleArchive}
                  disabled={isArchiving}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  {isArchiving ? "Mengarsipkan..." : "Arsipkan Produk"}
                </Button>
              </div>
            </AnimatedContainer>
          )}
        </div>
      </form>
    </main>
  );
}
