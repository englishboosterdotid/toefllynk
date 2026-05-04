"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  CheckCircle2,
  AlertCircle,
  Package,
  Image as ImageIcon,
  Sparkles,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedContainer } from "@/components/animations";
import { FileUpload } from "@/components/ui/FileUpload";
import Link from "next/link";
import { ArrowLeft, Upload, X } from "lucide-react";

export default function AddProductPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess("Produk berhasil disimpan!");
        setForm({
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
        });
        setTimeout(() => {
          window.location.href = "/admin/products";
        }, 1500);
      } else {
        setError(data.message || "Gagal menyimpan produk");
      }
    } catch (err) {
      setError("Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
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
    });
  };

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
            <h1 className="text-3xl font-bold text-slate-900">Tambah Produk Baru</h1>
            <p className="mt-1 text-slate-500">Buat paket ujian TOEFL baru</p>
          </div>
        </div>
      </AnimatedContainer>

      {/* Success/Error Messages */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-center gap-3"
        >
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-green-800 font-medium">{success}</span>
        </motion.div>
      )}
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
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Menyimpan...
                  </span>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Simpan Produk
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={resetForm}
              >
                Reset Form
              </Button>
            </div>
          </AnimatedContainer>

          {/* Tips */}
          <AnimatedContainer delay={0.4}>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4 text-blue-600" />
                Tips
              </h3>
              <div className="space-y-3 text-sm text-slate-600">
                <p>• Gunakan harga promo untuk menarik customer</p>
                <p>• Exam credits menentukan berapa kali siswa bisa mengerjakan</p>
                <p>• Aktifkan affiliate untuk menjangkau lebih banyak pembeli</p>
                <p>• Review jawaban perlu diaktifkan jika produk mendukung</p>
              </div>
            </div>
          </AnimatedContainer>
        </div>
      </form>
    </main>
  );
}
