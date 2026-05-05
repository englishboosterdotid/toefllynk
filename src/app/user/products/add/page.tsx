"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Package, DollarSign, Users, Shield, Check, Zap, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFileUpload } from "@/hooks/useFileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedContainer } from "@/components/animations";
import { cn } from "@/lib/utils";

const MIN_PRICE = 1000; // Minimum price Rp 1,000

type PackagePreset = "BASIC" | "STANDARD" | "PREMIUM" | "COMPREHENSIVE";

const packagePresets: { type: PackagePreset; label: string; description: string; credits: number; price: string; promoPrice: string; features: string[] }[] = [
  {
    type: "BASIC",
    label: "Basic",
    description: "Untuk pemula",
    credits: 1,
    price: "29000",
    promoPrice: "19000",
    features: ["1 TOEFL Credit", "Score Certificate", "Basic Support"],
  },
  {
    type: "STANDARD",
    label: "Standard",
    description: "Paling populer",
    credits: 3,
    price: "69000",
    promoPrice: "49000",
    features: ["3 TOEFL Credits", "Score Certificate", "Basic Support"],
  },
  {
    type: "PREMIUM",
    label: "Premium",
    description: "Latihan intensif",
    credits: 5,
    price: "119000",
    promoPrice: "89000",
    features: ["5 TOEFL Credits", "Score Certificate", "Answer Review", "Priority Support"],
  },
  {
    type: "COMPREHENSIVE",
    label: "Comprehensive",
    description: "Full package",
    credits: 10,
    price: "199000",
    promoPrice: "149000",
    features: ["10 TOEFL Credits", "Score Certificate", "Answer Review", "Zoom Mentoring", "Priority Support"],
  },
];

export default function AddProductPage() {
  const router = useRouter();
  const { uploadFile } = useFileUpload();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PackagePreset | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    title: "",
    description: "",
    productType: "TOEFL_SIMULATION",
    price: "29000",
    promoPrice: "19000",
    thumbnail: "",
    category: "",
    packageType: "INDIVIDUAL",
    examCredits: "1",
    certificateIncluded: true,
    reviewIncluded: false,
    zoomIncluded: false,
    affiliateEnabled: false,
    commissionPercent: "10",
  });
  const [isDirty, setIsDirty] = useState(false);

  const applyPackagePreset = (type: PackagePreset) => {
    const preset = packagePresets.find((p) => p.type === type);
    if (!preset) return;

    setSelectedPreset(type);
    handleFormChange({
      ...form,
      examCredits: String(preset.credits),
      certificateIncluded: true,
      reviewIncluded: preset.type !== "BASIC" && preset.type !== "STANDARD",
      zoomIncluded: preset.type === "COMPREHENSIVE",
      price: preset.price,
      promoPrice: preset.promoPrice,
      commissionPercent: preset.type === "BASIC" ? "10" : preset.type === "STANDARD" ? "12" : preset.type === "PREMIUM" ? "15" : "20",
    });
  };

  const applyBundlePreset = () => {
    setSelectedPreset(null);
    handleFormChange({
      ...form,
      productType: "TOEFL_SIMULATION",
      packageType: "BUNDLE",
      examCredits: "5",
      certificateIncluded: true,
      reviewIncluded: true,
      zoomIncluded: false,
      price: "499000",
      promoPrice: "399000",
      commissionPercent: "10",
    });
  };

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // Validate title (required)
    if (!form.title.trim()) {
      newErrors.title = "Nama paket wajib diisi";
    }

    // Validate price
    const price = Number(form.price);
    if (!price || price < MIN_PRICE) {
      newErrors.price = `Harga minimal Rp ${MIN_PRICE.toLocaleString("id-ID")}`;
    }

    // Validate promo price
    const promoPrice = Number(form.promoPrice);
    if (promoPrice && promoPrice < MIN_PRICE) {
      newErrors.promoPrice = `Harga promo minimal Rp ${MIN_PRICE.toLocaleString("id-ID")}`;
    }

    // Promo price should not be higher than regular price
    if (promoPrice && promoPrice > price) {
      newErrors.promoPrice = "Harga promo tidak boleh lebih tinggi dari harga normal";
    }

    // Validate exam credits
    const examCredits = Number(form.examCredits);
    if (!examCredits || examCredits < 1) {
      newErrors.examCredits = "Minimal 1 credit";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);
  
  // Validate form when it changes, but only after first interaction
  useEffect(() => {
    if (isDirty) {
      validateForm();
    }
  }, [validateForm, isDirty]);
  
  // Mark form as dirty when user changes any field
  const handleFormChange = (updatedForm: typeof form) => {
    setForm(updatedForm);
    if (!isDirty) {
      setIsDirty(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("productType", form.productType);
    fd.append("price", form.price);
    fd.append("promoPrice", form.promoPrice);
    fd.append("thumbnail", form.thumbnail);
    fd.append("category", form.category);
    fd.append("packageType", form.packageType);
    fd.append("examCredits", form.examCredits);
    fd.append("certificateIncluded", String(form.certificateIncluded));
    fd.append("reviewIncluded", String(form.reviewIncluded));
    fd.append("zoomIncluded", String(form.zoomIncluded));
    fd.append("affiliateEnabled", String(form.affiliateEnabled));
    fd.append("commissionPercent", form.commissionPercent);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (data.success) {
        router.push("/user/products?success=1");
      } else {
        alert(data.message || "Gagal membuat produk");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="space-y-8">
      <AnimatedContainer>
        <Link
          href="/user/products"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Produk
        </Link>

        <h1 className="text-3xl font-bold text-slate-900">Tambah Produk Baru</h1>
        <p className="text-slate-500">Buat paket simulasi TOEFL baru untuk dijual</p>
      </AnimatedContainer>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Package Presets */}
        <AnimatedContainer delay={0.1}>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-50 rounded-xl p-2">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Pilih Package Preset</h2>
                <p className="text-sm text-slate-500">Pilih paket preset atau atur manual</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {packagePresets.map((preset) => (
                <button
                  key={preset.type}
                  type="button"
                  onClick={() => applyPackagePreset(preset.type)}
                  className={cn(
                    "relative p-4 rounded-2xl border-2 transition-all text-left",
                    selectedPreset === preset.type
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                  )}
                >
                  {selectedPreset === preset.type && (
                    <div className="absolute -top-2 -right-2 h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-900">{preset.label}</span>
                    <span className="text-xs text-slate-500">{preset.credits}x</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{preset.description}</p>
                  <div className="text-lg font-bold text-slate-900">
                    Rp {Number(preset.promoPrice).toLocaleString("id-ID")}
                  </div>
                  <div className="text-xs text-slate-400 line-through">
                    Rp {Number(preset.price).toLocaleString("id-ID")}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </AnimatedContainer>

        {/* Basic Info */}
        <AnimatedContainer delay={0.2}>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-50 rounded-xl p-2">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Informasi Produk</h2>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Nama Paket *</Label>
                  <Input
                    id="title"
                    placeholder="Contoh: Paket Premium TOEFL"
                    value={form.title}
                    onChange={(e) => handleFormChange({ ...form, title: e.target.value })}
                    className={cn(errors.title && "border-red-500 focus:border-red-500")}
                    required
                  />
                  {errors.title && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.title}
                    </p>
                  )}
                </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <textarea
                  id="description"
                  placeholder="Jelaskan isi paket..."
                  rows={3}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm transition-all focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20"
                  value={form.description}
                  onChange={(e) => handleFormChange({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Harga (Rp) *</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">Rp</span>
                    <Input
                      id="price"
                      type="number"
                      min={MIN_PRICE}
                      placeholder="29000"
                      value={form.price}
                      onChange={(e) => {
                        handleFormChange({ ...form, price: e.target.value });
                        setErrors({ ...errors, price: "" });
                      }}
                      className={cn("pl-12", errors.price && "border-red-500 focus:border-red-500")}
                      required
                    />
                  </div>
                  {errors.price && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.price}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promoPrice">Harga Promo (Rp)</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">Rp</span>
                    <Input
                      id="promoPrice"
                      type="number"
                      min={MIN_PRICE}
                      placeholder="19000"
                      value={form.promoPrice}
                      onChange={(e) => {
                        setForm({ ...form, promoPrice: e.target.value });
                        setErrors({ ...errors, promoPrice: "" });
                      }}
                      className={cn("pl-12", errors.promoPrice && "border-red-500 focus:border-red-500")}
                    />
                  </div>
                  {errors.promoPrice && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.promoPrice}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Input
                  id="category"
                  placeholder="Contoh: Paket Ujicoba, Soal Latihan"
                  value={form.category}
                  onChange={(e) => handleFormChange({ ...form, category: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Gambar Thumbnail</Label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-300 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      if (e.target.files) {
                        const data = await uploadFile(e.target.files[0]);
                        if (data.success) {
                          handleFormChange({ ...form, thumbnail: data.url });
                        }
                      }
                    }}
                    className="hidden"
                    id="thumbnail-upload"
                  />
                  <label htmlFor="thumbnail-upload" className="cursor-pointer">
                    {form.thumbnail ? (
                      <div className="flex items-center justify-center gap-4">
                        <img src={form.thumbnail} alt="Thumbnail" className="h-20 w-20 rounded-lg object-cover" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-slate-700">Thumbnail uploaded</p>
                          <p className="text-xs text-slate-500">Click untuk replace</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <Package className="h-6 w-6 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-600">Click untuk upload thumbnail</p>
                        <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </AnimatedContainer>

        {/* Product Type */}
        <AnimatedContainer delay={0.3}>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-50 rounded-xl p-2">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Tipe & Detail Paket</h2>
                <p className="text-sm text-slate-500">Pengaturan untuk paket TOEFL Simulation</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productType">Jenis Paket</Label>
                <select
                  id="productType"
                  value={form.productType}
                  onChange={(e) => {
                    if (e.target.value === "BUNDLE") {
                      applyBundlePreset();
                    } else {
                      setSelectedPreset(null);
                      setForm((prev) => ({ ...prev, productType: e.target.value }));
                    }
                  }}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm transition-all focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20"
                >
                  <option value="TOEFL_SIMULATION">TOEFL Simulation Package</option>
                  <option value="IELTS_SIMULATION">IELTS Simulation Package</option>
                  <option value="COURSE">Course Package</option>
                  <option value="BUNDLE">Bundle Package (Manual)</option>
                </select>
              </div>

              {form.productType === "TOEFL_SIMULATION" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="packageType">Tipe Paket</Label>
                    <select
                      id="packageType"
                      value={form.packageType}
                      onChange={(e) => setForm((prev) => ({ ...prev, packageType: e.target.value }))}
                      className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm"
                    >
                      <option value="INDIVIDUAL">Individual Package</option>
                      <option value="BUNDLE">Bundle Package</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="examCredits">Jumlah Credit *</Label>
                      <Input
                        id="examCredits"
                        type="number"
                        min="1"
                        value={form.examCredits}
                        onChange={(e) => {
                          setForm({ ...form, examCredits: e.target.value });
                          setErrors({ ...errors, examCredits: "" });
                        }}
                        className={errors.examCredits ? "border-red-500 focus:border-red-500" : ""}
                      />
                      {errors.examCredits && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.examCredits}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="certificateIncluded">Sertifikat</Label>
                      <select
                        id="certificateIncluded"
                        value={String(form.certificateIncluded)}
                        onChange={(e) => setForm({ ...form, certificateIncluded: e.target.value === "true" })}
                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm"
                      >
                        <option value="true">Ya, Included</option>
                        <option value="false">Tidak</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reviewIncluded">Review/Pembahasan</Label>
                      <select
                        id="reviewIncluded"
                        value={String(form.reviewIncluded)}
                        onChange={(e) => setForm({ ...form, reviewIncluded: e.target.value === "true" })}
                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm"
                      >
                        <option value="true">Ya, Included</option>
                        <option value="false">Tidak</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zoomIncluded">Zoom Mentoring Session</Label>
                    <select
                      id="zoomIncluded"
                      value={String(form.zoomIncluded)}
                      onChange={(e) => setForm({ ...form, zoomIncluded: e.target.value === "true" })}
                      className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm"
                    >
                      <option value="false">Tidak</option>
                      <option value="true">Ya, Included</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        </AnimatedContainer>

        {/* Affiliate Settings */}
        <AnimatedContainer delay={0.4}>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-50 rounded-xl p-2">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Affiliate Settings</h2>
                <p className="text-sm text-slate-500">Izinkan affiliate partner untuk promosikan produk ini</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={form.affiliateEnabled}
                  onChange={(e) => setForm({ ...form, affiliateEnabled: e.target.checked })}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-700">Buka untuk Affiliate Marketplace</span>
                  <p className="text-xs text-slate-500">Affiliate partner bisa promosikan produk ini dan dapat komisi</p>
                </div>
              </label>

              {form.affiliateEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="commissionPercent">Komisi Affiliate (%)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="commissionPercent"
                      type="number"
                      min="1"
                      max="100"
                      placeholder="10"
                      value={form.commissionPercent}
                      onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })}
                      className="max-w-[200px]"
                    />
                    <span className="text-sm text-slate-500">
                      ({form.commissionPercent}% dari harga promo)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </AnimatedContainer>

        {/* Price Summary */}
        <AnimatedContainer delay={0.5}>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
            <h3 className="font-semibold mb-4">Ringkasan Harga</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-slate-400 text-sm">Harga Normal</p>
                <p className="text-2xl font-bold">Rp {Number(form.price || 0).toLocaleString("id-ID")}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Harga Promo</p>
                <p className="text-2xl font-bold text-green-400">Rp {Number(form.promoPrice || 0).toLocaleString("id-ID")}</p>
              </div>
            </div>
            {form.promoPrice && form.price && Number(form.promoPrice) < Number(form.price) && (
              <p className="mt-3 text-sm text-green-400">
                Diskon {Math.round((1 - Number(form.promoPrice) / Number(form.price)) * 100)}%
              </p>
            )}
          </div>
        </AnimatedContainer>

        {/* Actions */}
        <AnimatedContainer delay={0.6}>
          <div className="flex justify-end gap-4">
            <Link href="/user/products">
              <Button type="button" variant="outline" size="lg">
                Batal
              </Button>
            </Link>
            <Button type="submit" size="lg" disabled={isLoading || Object.keys(errors).length > 0} className="min-w-[160px]">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Menyimpan...
                </span>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Simpan Produk
                </>
              )}
            </Button>
          </div>
        </AnimatedContainer>
      </form>
    </main>
  );
}