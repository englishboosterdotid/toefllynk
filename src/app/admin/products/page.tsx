import prisma from "@/lib/prisma";
import Link from "next/link";
import { Package, Plus, Search, Edit2, Trash2, ArrowUpRight } from "lucide-react";
import { AnimatedContainer } from "@/components/animations";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    include: {
      _count: {
        select: { orders: true },
      },
      settings: {
        select: {
          isArchived: true,
          promoPrice: true,
          examCredits: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="p-8 space-y-6">
      {/* Page Header */}
      <AnimatedContainer>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Products</h1>
            <p className="mt-1 text-slate-500">Kelola produk ujian TOEFL</p>
          </div>
          <Link
            href="/admin/products/add"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      </AnimatedContainer>

      {/* Search Bar */}
      <AnimatedContainer delay={0.1}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </AnimatedContainer>

      {/* Products Grid */}
      <AnimatedContainer delay={0.2}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-slate-200">
              <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Belum Ada Produk</h3>
              <p className="text-slate-500 mb-4">Mulai dengan menambahkan produk pertama</p>
              <Link
                href="/admin/products/add"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Link>
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Thumbnail */}
                <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden">
                  {product.thumbnail ? (
                    <img src={product.thumbnail} className="h-full w-full object-cover" alt="" />
                  ) : (
                    <Package className="h-16 w-16 text-slate-400" />
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-900 line-clamp-1">{product.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      !product.settings?.isArchived
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {!product.settings?.isArchived ? "Active" : "Archived"}
                    </span>
                  </div>

                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{product.description}</p>

                  {/* Price */}
                  <div className="flex items-center gap-3 mb-4">
                    {product.settings?.promoPrice && product.settings.promoPrice < product.price ? (
                      <>
                        <span className="text-xl font-bold text-blue-600">
                          Rp {product.settings.promoPrice.toLocaleString("id-ID")}
                        </span>
                        <span className="text-sm text-slate-400 line-through">
                          Rp {product.price.toLocaleString("id-ID")}
                        </span>
                      </>
                    ) : (
                      <span className="text-xl font-bold text-slate-900">
                        Rp {product.price.toLocaleString("id-ID")}
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between py-3 border-t border-slate-100">
                    <div className="text-sm text-slate-500">
                      <span className="font-medium text-slate-700">{product._count.orders}</span> orders
                    </div>
                    <div className="text-sm text-slate-500">
                      <span className="font-medium text-slate-700">{product.settings?.examCredits ?? 1}</span> credits
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <Link
                      href={`/admin/products/edit/${product.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </Link>
                    <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </AnimatedContainer>
    </main>
  );
}
