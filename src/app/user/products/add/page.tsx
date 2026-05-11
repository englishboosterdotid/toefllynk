"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package, Check, AlertCircle, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFileUpload } from "@/hooks/useFileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedContainer } from "@/components/animations";
import { cn } from "@/lib/utils";

const productCategories = [
  { value: "", label: "Pilih kategori..." },
  { value: "TOEFL", label: "TOEFL Simulation" },
  { value: "IELTS", label: "IELTS Simulation" },
];

// Package presets with tiered pricing
type PackagePresetType = "BASIC" | "STANDARD" | "PREMIUM" | "COMPREHENSIVE";

const packagePresets: { type: PackagePresetType; label: string; credits: number; price: number; promoPrice: number; minPrice: number; minPromoPrice: number }[] = [
  { type: "BASIC", label: "Basic", credits: 1, price: 29000, promoPrice: 19000, minPrice: 19000, minPromoPrice: 15000 },
  { type: "STANDARD", label: "Standard", credits: 3, price: 69000, promoPrice: 49000, minPrice: 56000, minPromoPrice: 40000 },
  { type: "PREMIUM", label: "Premium", credits: 5, price: 119000, promoPrice: 89000, minPrice: 90000, minPromoPrice: 60000 },
  { type: "COMPREHENSIVE", label: "Comprehensive", credits: 10, price: 199000, promoPrice: 149000, minPrice: 175000, minPromoPrice: 120000 },
];

const initialForm = {
  title: "",
  description: "",
  productType: "TOEFL_SIMULATION",
  price: "",
  promoPrice: "",
  thumbnail: "",
  category: "",
  packageType: "INDIVIDUAL",
  examCredits: "1",
  certificateIncluded: true,
  reviewIncluded: false,
  zoomIncluded: false,
  affiliateEnabled: false,
  commissionPercent: "10",
};

export default function AddProductPage() {
  const router = useRouter();
  const { uploadFile } = useFileUpload();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PackagePresetType | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});

  const [form, setForm] = useState(initialForm);

  // Calculate floor prices based on credits
  const getFloorPrices = (credits: number) => {
    return {
      minPrice: credits * 19000,
      minPromoPrice: credits * 15000,
    };
  };

  // Apply preset
  const applyPreset = (preset: typeof packagePresets[0]) => {
    setSelectedPreset(preset.type);
    setErrors({});
    setWarnings({});
    setForm({
      ...form,
      examCredits: String(preset.credits),
      price: String(preset.price),
      promoPrice: String(preset.promoPrice),
      certificateIncluded: true,
    });
  };

  // Handle form changes and clear preset when user manually changes values
  const handleFormChange = (updatedForm: typeof form) => {
    setForm(updatedForm);
    setErrors({});
    setWarnings({});
  };

  // Simple validation for submit - only check required fields
  const doValidate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) {
      newErrors.title = "Nama paket wajib diisi";
    }

    const examCredits = Number(form.examCredits);
    if (!examCredits || examCredits < 1) {
      newErrors.examCredits = "Minimal 1 credit";
    }

    const price = Number(form.price);
    const promoPrice = Number(form.promoPrice);
    const MIN_PRICE_PER_CREDIT = 15000;

    // Validate regular price - minimum 15000 per credit
    if (price && examCredits) {
      const minPrice = examCredits * MIN_PRICE_PER_CREDIT;
      if (price < minPrice) {
        newErrors.price = `Harga terlalu rendah. Minimal Rp ${minPrice.toLocaleString("id-ID")} untuk ${examCredits} credit`;
      }
    }

    // Validate promo price - minimum 15000 per credit
    if (promoPrice > 0) {
      const minPromoPrice = examCredits * MIN_PRICE_PER_CREDIT;
      if (promoPrice < minPromoPrice) {
        newErrors.promoPrice = `Harga promo terlalu rendah. Minimal Rp ${minPromoPrice.toLocaleString("id-ID")} untuk ${examCredits} credit`;
      }
      // Promo cannot be higher than regular price
      else if (price && promoPrice > price) {
        newErrors.promoPrice = "Harga promo tidak boleh lebih tinggi dari harga normal";
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const validationErrors = doValidate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Single Card - All Sections */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-50 rounded-xl p-2">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Tambah Produk Baru</h2>
              <p className="text-sm text-slate-500">Isi informasi paket Anda</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Section: Info Produk */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Informasi Produk</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="category">Kategori</Label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={(e) => handleFormChange({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm transition-all focus-visible:border-blue-500 focus-visible:outline-none"
                  >
                    {productCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <textarea
                  id="description"
                  placeholder="Jelaskan isi paket..."
                  rows={2}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm transition-all focus-visible:border-blue-500 focus-visible:outline-none"
                  value={form.description}
                  onChange={(e) => handleFormChange({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Section: Tipe Paket */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Tipe & Detail Paket</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productType">Jenis Paket</Label>
                  <select
                    id="productType"
                    value={form.productType}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, productType: e.target.value }));
                      setWarnings({});
                    }}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm transition-all focus-visible:border-blue-500 focus-visible:outline-none"
                  >
                    <option value="TOEFL_SIMULATION">TOEFL Simulation Package</option>
                    <option value="IELTS_SIMULATION">IELTS Simulation Package</option>
                  </select>
                </div>
                {form.productType === "TOEFL_SIMULATION" && (
                  <div className="space-y-2">
                    <Label htmlFor="packageType">Tipe Paket</Label>
                    <select
                      id="packageType"
                      value={form.packageType}
                      onChange={(e) => handleFormChange({ ...form, packageType: e.target.value })}
                      className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm"
                    >
                      <option value="INDIVIDUAL">Individual Package</option>
                    </select>
                  </div>
                )}
              </div>

              {form.productType === "TOEFL_SIMULATION" && (
                <div className="space-y-6">
                  {/* Package Presets */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-slate-900">Quick Select Package</h4>
                        <p className="text-xs text-slate-500 mt-1">Pilih paket preset untuk otomatis isi harga</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {packagePresets.map((preset) => {
                        const isSelected = selectedPreset === preset.type;
                        const floorPrices = getFloorPrices(preset.credits);
                        return (
                          <button
                            key={preset.type}
                            type="button"
                            onClick={() => applyPreset(preset)}
                            className={cn(
                              "p-4 rounded-xl border-2 transition-all text-left",
                              isSelected
                                ? "border-blue-500 bg-white shadow-md ring-2 ring-blue-200"
                                : "border-transparent bg-white/70 hover:border-blue-200 hover:bg-white"
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold text-slate-900">{preset.label}</span>
                              {isSelected && (
                                <Check className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mb-1">{preset.credits} Credit</p>
                            <p className="text-lg font-bold text-blue-600">
                              Rp {preset.promoPrice.toLocaleString("id-ID")}
                            </p>
                            <p className="text-xs text-slate-400 line-through">
                              Rp {preset.price.toLocaleString("id-ID")}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Manual Input Fields */}
                  <div className="space-y-2">
                    <Label htmlFor="examCredits" className="flex items-center gap-1">
                      Jumlah Credit *
                    </Label>
                    <Input
                      id="examCredits"
                      type="number"
                      min="1"
                      value={form.examCredits}
                      onChange={(e) => {
                        handleFormChange({ ...form, examCredits: e.target.value });
                      }}
                      className={cn(
                        errors.examCredits ? "border-red-500 focus:border-red-500" : ""
                      )}
                    />
                    {errors.examCredits && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.examCredits}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="certificateIncluded" className="flex items-center gap-1">
                      Sertifikat
                    </Label>
                    <select
                      id="certificateIncluded"
                      value={String(form.certificateIncluded)}
                      onChange={(e) => handleFormChange({ ...form, certificateIncluded: e.target.value === "true" })}
                      className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm"
                    >
                      <option value="true">Ya, Included</option>
                      <option value="false">Tidak</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reviewIncluded">Review</Label>
                    <select
                      id="reviewIncluded"
                      value={String(form.reviewIncluded)}
                      onChange={(e) => handleFormChange({ ...form, reviewIncluded: e.target.value === "true" })}
                      className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm"
                    >
                      <option value="true">Ya, Included</option>
                      <option value="false">Tidak</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zoomIncluded">Zoom Mentoring</Label>
                    <select
                      id="zoomIncluded"
                      value={String(form.zoomIncluded)}
                      onChange={(e) => handleFormChange({ ...form, zoomIncluded: e.target.value === "true" })}
                      className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm"
                    >
                      <option value="false">Tidak</option>
                      <option value="true">Ya, Included</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Section: Harga & Thumbnail */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Harga & Thumbnail</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="price">Harga (Rp) *</Label>
                    <span className="text-xs text-slate-500">
                      Min: Rp {(Number(form.examCredits) * 15000).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">Rp</span>
                    <Input
                      id="price"
                      type="number"
                      placeholder="29000"
                      value={form.price}
                      onChange={(e) => {
                        handleFormChange({ ...form, price: e.target.value });
                      }}
                      className={cn(
                        "pl-12",
                        errors.price && "border-red-500 focus:border-red-500",
                        warnings.price && !errors.price && "border-amber-400 focus:border-amber-400"
                      )}
                      required
                    />
                  </div>
                  {errors.price && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.price}
                    </p>
                  )}
                  {warnings.price && !errors.price && (
                    <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                      <Info className="h-3 w-3" />
                      {warnings.price}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promoPrice">Harga Promo (Rp)</Label>
                  <span className="text-xs text-slate-500">
                    Min: Rp {(Number(form.examCredits) * 15000).toLocaleString("id-ID")}
                  </span>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">Rp</span>
                    <Input
                      id="promoPrice"
                      type="number"
                      placeholder="19000"
                      value={form.promoPrice}
                      onChange={(e) => handleFormChange({ ...form, promoPrice: e.target.value })}
                      className={cn(
                        "pl-12",
                        errors.promoPrice && "border-red-500 focus:border-red-500",
                        warnings.promoPrice && !errors.promoPrice && "border-amber-400 focus:border-amber-400"
                      )}
                    />
                  </div>
                  {errors.promoPrice && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.promoPrice}
                    </p>
                  )}
                  {warnings.promoPrice && !errors.promoPrice && (
                    <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                      <Info className="h-3 w-3" />
                      {warnings.promoPrice}
                    </p>
                  )}
                  {form.promoPrice && form.price && !errors.promoPrice && !warnings.promoPrice && Number(form.promoPrice) < Number(form.price) && (
                    <p className="text-xs text-green-600 mt-1">
                      Diskon {Math.round((1 - Number(form.promoPrice) / Number(form.price)) * 100)}%
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Gambar Thumbnail</Label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-blue-300 transition-colors">
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
                        <img src={form.thumbnail} alt="Thumbnail" className="h-16 w-16 rounded-lg object-cover" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-slate-700">Thumbnail uploaded</p>
                          <p className="text-xs text-slate-500">Click untuk replace</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-slate-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-slate-600">Click untuk upload thumbnail</p>
                          <p className="text-xs text-slate-400">PNG, JPG up to 5MB</p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Section: Affiliate */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Affiliate Settings</h3>
              <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={form.affiliateEnabled}
                  onChange={(e) => handleFormChange({ ...form, affiliateEnabled: e.target.checked })}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-700">Buka untuk Affiliate Marketplace</span>
                  <p className="text-xs text-slate-500">Affiliate partner bisa promosikan produk ini</p>
                </div>
              </label>

              {form.affiliateEnabled && (
                <div className="flex items-center gap-4">
                  <div className="space-y-2 w-48">
                    <Label htmlFor="commissionPercent">Komisi (%)</Label>
                    <Input
                      id="commissionPercent"
                      type="number"
                      min="1"
                      max="100"
                      placeholder="10"
                      value={form.commissionPercent}
                      onChange={(e) => handleFormChange({ ...form, commissionPercent: e.target.value })}
                    />
                  </div>
                  <span className="text-sm text-slate-500 mt-6">dari harga promo</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Section: Summary */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white">
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
          </div>
        </div>

        {/* Actions */}
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
      </form>
    </main>
  );
}