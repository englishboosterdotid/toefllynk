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

// Minimum price per credit based on package features
const getMinPricePerCredit = (form: typeof initialForm) => {
  let minPrice = 15000; // Base price per credit

  // Add extra for review
  if (form.reviewIncluded === true) {
    minPrice += 5000;
  }

  // Add extra for zoom
  if (form.zoomIncluded === true) {
    minPrice += 30000;
  }

  return minPrice;
};

// Suggested price ranges based on package type
const getSuggestedPriceRange = (form: typeof initialForm) => {
  const credits = Number(form.examCredits) || 1;
  const minPerCredit = getMinPricePerCredit(form);

  const minTotal = credits * minPerCredit;
  const recommended = credits * (minPerCredit + 10000); // Add buffer for profit
  const maxSuggested = credits * (minPerCredit + 25000); // Reasonable max

  return {
    min: minTotal,
    recommended: recommended,
    max: maxSuggested,
  };
};

const productCategories = [
  { value: "", label: "Pilih kategori..." },
  { value: "TOEFL", label: "TOEFL Simulation" },
  { value: "IELTS", label: "IELTS Simulation" },
  { value: "TOEFL + IELTS", label: "TOEFL + IELTS" },
  { value: "Full Package", label: "Full Package" },
  { value: "Bundle", label: "Bundle" },
  { value: "Mentoring", label: "Mentoring" },
  { value: "Lainnya", label: "Lainnya" },
];

const initialForm = {
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
};

export default function AddProductPage() {
  const router = useRouter();
  const { uploadFile } = useFileUpload();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PackagePreset | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});

  const [form, setForm] = useState(initialForm);

  // Calculate suggested price range
  const priceRange = getSuggestedPriceRange(form);

  const applyPackagePreset = (type: PackagePreset) => {
    const preset = packagePresets.find((p) => p.type === type);
    if (!preset) return;

    setSelectedPreset(type);
    setErrors({}); // Clear errors when selecting preset
    setWarnings({}); // Clear warnings when selecting preset
    handleFormChange({
      ...form,
      examCredits: String(preset.credits),
      certificateIncluded: true,
      // Only lock credits and certificate, not review and zoom
      price: preset.price,
      promoPrice: preset.promoPrice,
      commissionPercent: preset.type === "BASIC" ? "10" : preset.type === "STANDARD" ? "12" : preset.type === "PREMIUM" ? "15" : "20",
    });
  };

  // Clear errors when any field changes
  const handleFormChange = (updatedForm: typeof form) => {
    // Clear all errors when user changes any field
    setErrors({});
    setWarnings({});
    setForm(updatedForm);
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

    // Get preset minimum if selected
    const preset = selectedPreset ? packagePresets.find((p) => p.type === selectedPreset) : null;
    const presetMinPrice = preset ? Number(preset.promoPrice) : 0;

    // Validate price based on credits
    if (price && examCredits) {
      const minPerCredit = getMinPricePerCredit(form);
      const minTotal = examCredits * minPerCredit;
      if (price < minTotal) {
        newErrors.price = `Harga terlalu rendah untuk ${examCredits} credit${form.reviewIncluded ? " + review" : ""}${form.zoomIncluded ? " + zoom" : ""}. Min: Rp ${minTotal.toLocaleString("id-ID")}`;
      }
    }

    // Price cannot be less than preset minimum if preset selected
    if (preset && price < presetMinPrice) {
      newErrors.price = `Harga tidak boleh kurang dari Rp ${presetMinPrice.toLocaleString("id-ID")} (minimal preset)`;
    }

    // Promo price validation
    if (promoPrice > 0 && preset) {
      // Promo cannot be less than preset minimum
      if (promoPrice < presetMinPrice) {
        newErrors.promoPrice = `Harga promo minimal Rp ${presetMinPrice.toLocaleString("id-ID")} (sesuai preset)`;
      }
      // Promo cannot be higher than regular price
      if (promoPrice > price) {
        newErrors.promoPrice = "Harga promo tidak boleh lebih tinggi dari harga normal";
      }
    }

    // If promo is empty and preset selected, price must be >= preset minimum
    if (!promoPrice && preset && price < presetMinPrice) {
      newErrors.price = `Harga minimal Rp ${presetMinPrice.toLocaleString("id-ID")} (sesuai preset)`;
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
                      setSelectedPreset(null);
                      setForm((prev) => ({ ...prev, productType: e.target.value }));
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
                      onChange={(e) => setForm((prev) => ({ ...prev, packageType: e.target.value }))}
                      className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm"
                    >
                      <option value="INDIVIDUAL">Individual Package</option>
                      <option value="BUNDLE">Bundle Package</option>
                    </select>
                  </div>
                )}
              </div>

              {form.productType === "TOEFL_SIMULATION" && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="examCredits" className="flex items-center gap-1">
                      Jumlah Credit *
                      {selectedPreset && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Preset</span>
                      )}
                    </Label>
                    <Input
                      id="examCredits"
                      type="number"
                      min="1"
                      value={form.examCredits}
                      readOnly={!!selectedPreset}
                      onChange={(e) => {
                        if (!selectedPreset) {
                          handleFormChange({ ...form, examCredits: e.target.value });
                        }
                      }}
                      className={cn(
                        errors.examCredits ? "border-red-500 focus:border-red-500" : "",
                        selectedPreset && "bg-slate-100 cursor-not-allowed"
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
                      {selectedPreset && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Preset</span>
                      )}
                    </Label>
                    <select
                      id="certificateIncluded"
                      value={String(form.certificateIncluded)}
                      disabled={!!selectedPreset}
                      onChange={(e) => setForm({ ...form, certificateIncluded: e.target.value === "true" })}
                      className={cn(
                        "w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm",
                        selectedPreset && "bg-slate-100 cursor-not-allowed"
                      )}
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
                      onChange={(e) => setForm({ ...form, reviewIncluded: e.target.value === "true" })}
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
                      onChange={(e) => setForm({ ...form, zoomIncluded: e.target.value === "true" })}
                      className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm"
                    >
                      <option value="false">Tidak</option>
                      <option value="true">Ya, Included</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Package Presets - Only for TOEFL/IELTS Simulation */}
            {["TOEFL_SIMULATION", "IELTS_SIMULATION"].includes(form.productType) && form.packageType !== "BUNDLE" && (
              <>
                {/* Divider */}
                <div className="border-t border-slate-100" />

                {/* Section: Package Presets */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pilih Package Preset</h3>
                  <p className="text-xs text-slate-500 -mt-2">Pilih preset untuk mengisi harga otomatis, atau atur manual</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {packagePresets.map((preset) => (
                      <button
                        key={preset.type}
                        type="button"
                        onClick={() => applyPackagePreset(preset.type)}
                        className={cn(
                          "relative p-4 rounded-xl border-2 transition-all text-left",
                          selectedPreset === preset.type
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                        )}
                      >
                        {selectedPreset === preset.type && (
                          <div className="absolute -top-2 -right-2 h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-slate-900">{preset.label}</span>
                          <span className="text-xs text-slate-500">{preset.credits}x</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">{preset.description}</p>
                        <div className="text-base font-bold text-slate-900">
                          Rp {Number(preset.promoPrice).toLocaleString("id-ID")}
                        </div>
                        <div className="text-xs text-slate-400 line-through">
                          Rp {Number(preset.price).toLocaleString("id-ID")}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Section: Harga & Thumbnail */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Harga & Thumbnail</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="price">Harga (Rp) *</Label>
                    {!selectedPreset && (
                      <span className="text-xs text-slate-500">
                        Range: Rp {priceRange.min.toLocaleString("id-ID")} - {priceRange.max.toLocaleString("id-ID")}
                      </span>
                    )}
                  </div>
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
                  {selectedPreset && (
                    <span className="text-xs text-slate-500">
                      Min: Rp {Number(packagePresets.find((p) => p.type === selectedPreset)?.promoPrice || 0).toLocaleString("id-ID")}
                    </span>
                  )}
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">Rp</span>
                    <Input
                      id="promoPrice"
                      type="number"
                      min={MIN_PRICE}
                      placeholder="19000"
                      value={form.promoPrice}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setForm({ ...form, promoPrice: newValue });
                        // Clear error if value is now valid or empty
                        if (errors.promoPrice && (!newValue || !selectedPreset)) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.promoPrice;
                            return newErrors;
                          });
                        }
                      }}
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
                  onChange={(e) => setForm({ ...form, affiliateEnabled: e.target.checked })}
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
                      onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })}
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
                  {!selectedPreset && !errors.price && form.price && (
                    <p className={cn(
                      "text-xs mt-1",
                      Number(form.price) >= priceRange.min && Number(form.price) <= priceRange.max
                        ? "text-green-400"
                        : Number(form.price) < priceRange.min
                          ? "text-amber-400"
                          : "text-slate-400"
                    )}>
                      {Number(form.price) < priceRange.min
                        ? `Below min (min Rp ${priceRange.min.toLocaleString("id-ID")})`
                        : Number(form.price) > priceRange.max
                          ? `Above max (max Rp ${priceRange.max.toLocaleString("id-ID")})`
                          : "Within range"
                      }
                    </p>
                  )}
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