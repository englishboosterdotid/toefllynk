"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  promoPrice: number | null;
  thumbnail: string | null;
  affiliateEnabled: boolean;
  isArchived: boolean;
  packageType: string | null;
  productType: string;
  examCredits: number;
  certificateIncluded: boolean;
  reviewIncluded: boolean;
  zoomIncluded: boolean;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    const res = await fetch("/api/my-products");
    const data = await res.json();
    setProducts(data.products || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <main>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Products</h1>
        <Link href="/user/products/add">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

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
              promoPrice={product.promoPrice}
              thumbnail={product.thumbnail}
              affiliateEnabled={product.affiliateEnabled}
              isArchived={product.isArchived}
              packageType={product.packageType}
              examCredits={product.examCredits}
              certificateIncluded={product.certificateIncluded}
              reviewIncluded={product.reviewIncluded}
              zoomIncluded={product.zoomIncluded}
            />
          ))}
        </div>
      )}
    </main>
  );
}