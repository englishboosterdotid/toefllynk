"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";

interface StatCardProps {
  iconName: string;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Package: LucideIcons.Package,
  ShoppingCart: LucideIcons.ShoppingCart,
  Users: LucideIcons.Users,
  DollarSign: LucideIcons.DollarSign,
  BookOpen: LucideIcons.BookOpen,
  Target: LucideIcons.Target,
  TrendingUp: LucideIcons.TrendingUp,
  Zap: LucideIcons.Zap,
  Globe: LucideIcons.Globe,
  BarChart3: LucideIcons.BarChart3,
};

export function StatCard({ iconName, label, value, trend, trendUp }: StatCardProps) {
  const Icon = iconMap[iconName] || LucideIcons.Package;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
    >
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 opacity-50" />

      <div className="relative">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          </div>
        </div>

        {trend && (
          <div className="mt-4 flex items-center gap-1">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
                trendUp
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              )}
            >
              {trendUp ? "↑" : "↓"} {trend}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface FeatureCardProps {
  iconName: string;
  title: string;
  description: string;
  index?: number;
}

export function FeatureCard({ iconName, title, description, index = 0 }: FeatureCardProps) {
  const Icon = iconMap[iconName] || LucideIcons.Rocket;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -8 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/10"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-purple-50/0 transition-all duration-500 group-hover:from-blue-50/50 group-hover:to-purple-50/50" />

      <div className="relative">
        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25 transition-transform duration-300 group-hover:scale-110">
          <Icon className="h-7 w-7 text-white" />
        </div>

        <h3 className="mb-3 text-xl font-bold text-slate-900">{title}</h3>

        <p className="text-slate-600 leading-relaxed">{description}</p>
      </div>

      <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-gradient-to-br from-blue-100/50 to-purple-100/50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </motion.div>
  );
}

interface ProductCardProps {
  title: string;
  description?: string | null;
  price: number;
  promoPrice?: number | null;
  thumbnail?: string | null;
  category?: string | null;
  onClick?: () => void;
}

export function ProductCard({
  title,
  description,
  price,
  promoPrice,
  thumbnail,
  category,
  onClick,
}: ProductCardProps) {
  const hasDiscount = promoPrice && promoPrice < price;
  const discountPercent = hasDiscount
    ? Math.round(((price - promoPrice!) / price) * 100)
    : 0;

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/10"
    >
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-white/20" />
          </div>
        )}

        {hasDiscount && (
          <div className="absolute right-4 top-4 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
            -{discountPercent}%
          </div>
        )}

        {category && (
          <div className="absolute bottom-4 left-4 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">
            {category}
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="mb-2 text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>

        {description && (
          <p className="mb-4 text-sm text-slate-500 line-clamp-2">{description}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasDiscount ? (
              <>
                <span className="text-xl font-bold text-red-500">
                  Rp {(promoPrice! / 1000).toFixed(0)}k
                </span>
                <span className="text-sm text-slate-400 line-through">
                  Rp {(price / 1000).toFixed(0)}k
                </span>
              </>
            ) : (
              <span className="text-xl font-bold text-slate-900">
                Rp {(price / 1000).toFixed(0)}k
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 group-hover:translate-x-1 transition-transform">
            Lihat Detail
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

interface TestimonialCardProps {
  name: string;
  role: string;
  avatar?: string | null;
  content: string;
  rating?: number;
}

export function TestimonialCard({ name, role, avatar, content, rating = 5 }: TestimonialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <LucideIcons.Star
            key={i}
            className={cn("h-5 w-5", i < rating ? "text-amber-400 fill-amber-400" : "text-slate-200")}
          />
        ))}
      </div>

      <p className="mb-6 text-slate-600 leading-relaxed italic">"{content}"</p>

      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
          {avatar ? (
            <img src={avatar} alt={name} className="h-full w-full rounded-full object-cover" />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <p className="font-semibold text-slate-900">{name}</p>
          <p className="text-sm text-slate-500">{role}</p>
        </div>
      </div>
    </motion.div>
  );
}