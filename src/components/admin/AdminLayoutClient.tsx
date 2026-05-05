"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  Eye,
  LogOut,
  Bell,
  ChevronRight,
  Monitor,
  Package,
  ShoppingCart,
  Award,
  Shield,
  Wallet,
} from "lucide-react";

const navItems = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Questions", href: "/admin/questions", icon: FileText },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Withdrawals", href: "/admin/withdrawals", icon: Wallet },
  { label: "Live Monitor", href: "/admin/exam-monitoring", icon: Monitor },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Leaderboard", href: "/admin/leaderboard", icon: Award },
  { label: "Audit Log", href: "/admin/audit-log", icon: Shield },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

type AdminSidebarProps = {
  activeSessions?: number;
  pendingOrders?: number;
  warningCount?: number;
};

export function AdminSidebar({ activeSessions = 0, pendingOrders = 0, warningCount = 0 }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-16 z-30 flex h-[calc(100vh-4rem)] w-64 flex-col bg-white border-r border-slate-200">
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <div className="mb-4 px-3">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Navigation</p>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon className={`h-5 w-5 ${active ? "text-blue-600" : "text-slate-400"}`} />
                {item.label}
                {active && <ChevronRight className="ml-auto h-4 w-4" />}
              </Link>
            );
          })}
        </nav>

        {/* Quick Stats */}
        <div className="mt-8 px-3">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Quick Stats</p>
          <div className="space-y-3">
            <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <p className="text-xs text-green-600 font-medium">Active Exams</p>
              <p className="text-xl font-bold text-green-700">{activeSessions}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
              <p className="text-xs text-amber-600 font-medium">Pending Orders</p>
              <p className="text-xl font-bold text-amber-700">{pendingOrders}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
              <p className="text-xs text-red-600 font-medium">Warnings</p>
              <p className="text-xl font-bold text-red-700">{warningCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-slate-200 p-3 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900"
        >
          <Eye className="h-5 w-5" />
          View Site
        </Link>
        <Link
          href="/api/logout"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Link>
      </div>
    </aside>
  );
}

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-500/25">
              <span className="text-lg font-bold text-white">TL</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">TOEFL Lynk</h1>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <Bell className="h-5 w-5 text-slate-500" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          </button>

          {/* Admin Profile */}
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">Admin</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
              A
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
