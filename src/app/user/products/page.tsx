"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Globe, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail: string | null;
  productType: string;
  settings?: {
    promoPrice: number | null;
    affiliateEnabled: boolean;
    isArchived: boolean;
    isVisibleOnMicrosite: boolean;
    isFeatured: boolean;
    packageType: string | null;
    examCredits: number;
    certificateIncluded: boolean;
    reviewIncluded: boolean;
    zoomIncluded: boolean;
  } | null;
};

type TierInfo = {
  maxMicrositeProducts: number;
  visibleCount: number;
  isUnlimited: boolean;
};

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const error = searchParams.get("error");
  const success = searchParams.get("success");

  const fetchProducts = async () => {
    const res = await fetch("/api/my-products");
    const data = await res.json();
    setProducts(data.products || []);
    setTierInfo(data.tierInfo || null);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <main>
      {/* Notifications */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <XCircle className="h-5 w-5 text-red-600" />
          <div>
            <p className="font-medium text-red-800">
              {error === "featured_requires_pro" && "Fitur Produk Unggulan memerlukan paket PRO atau lebih tinggi."}
              {error === "max_featured" && `Maksimal ${searchParams.get("count") || 3} produk dapat ditandai sebagai unggulan.`}
              {error === "unauthorized" && "Anda tidak memiliki akses ke produk ini."}
              {error === "product_required" && "Produk tidak ditemukan."}
              {error === "max_microsite" && (searchParams.get("message") || "Batas produk microsite tercapai.")}
              {!["featured_requires_pro", "max_featured", "unauthorized", "product_required", "max_microsite"].includes(error) && "Terjadi kesalahan. Silakan coba lagi."}
            </p>
          </div>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <p className="font-medium text-green-800">Perubahan berhasil disimpan!</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Products</h1>
        <Link href="/user/products/add">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Microsite Visibility Info */}
      {tierInfo && (
        <div className={`mb-6 p-4 rounded-xl border ${
          tierInfo.isUnlimited
            ? "bg-green-50 border-green-200"
            : tierInfo.visibleCount >= tierInfo.maxMicrositeProducts
            ? "bg-amber-50 border-amber-200"
            : "bg-blue-50 border-blue-200"
        }`}>
          <div className="flex items-center gap-3">
            <Globe className={`h-5 w-5 ${
              tierInfo.isUnlimited
                ? "text-green-600"
                : tierInfo.visibleCount >= tierInfo.maxMicrositeProducts
                ? "text-amber-600"
                : "text-blue-600"
            }`} />
            <div className="flex-1">
              <p className="font-medium text-slate-900">
                Microsite Products: {tierInfo.visibleCount} / {tierInfo.isUnlimited ? "∞" : tierInfo.maxMicrositeProducts}
              </p>
              {!tierInfo.isUnlimited && tierInfo.visibleCount >= tierInfo.maxMicrositeProducts && (
                <p className="text-sm text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Batas produk di microsite tercapai. Upgrade untuk menambah.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <p className="text-slate-500 mb-4">Belum ada produk</p>
          <Link href="/user/products/add">
            <Button variant="outline">Buat Produk Pertama</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              title={product.title}
              description={product.description}
              price={product.price}
              thumbnail={product.thumbnail}
              promoPrice={product.settings?.promoPrice}
              affiliateEnabled={product.settings?.affiliateEnabled}
              isArchived={product.settings?.isArchived}
              isVisibleOnMicrosite={product.settings?.isVisibleOnMicrosite}
              isFeatured={product.settings?.isFeatured}
              packageType={product.settings?.packageType}
              examCredits={product.settings?.examCredits}
              certificateIncluded={product.settings?.certificateIncluded}
              reviewIncluded={product.settings?.reviewIncluded}
              zoomIncluded={product.settings?.zoomIncluded}
            />
          ))}
        </div>
      )}
    </main>
  );
}