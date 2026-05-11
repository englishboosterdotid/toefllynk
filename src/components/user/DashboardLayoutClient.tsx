"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Globe,
  Package,
  ShoppingCart,
  Users,
  Store,
  Link2,
  DollarSign,
  BookOpen,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Zap,
  Wallet,
  Crown,
  Settings,
  FileBadge,
  Key,
  Tag,
  Webhook,
  Mail,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  requiredTier?: "PRO" | "BUSINESS";
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    title: "Sell Business",
    items: [
      { label: "Overview", href: "/user", icon: LayoutDashboard },
      { label: "My Microsite", href: "/user/microsite", icon: Globe },
      { label: "My Packages", href: "/user/products", icon: Package },
      { label: "Student Orders", href: "/user/orders", icon: ShoppingCart },
      { label: "Participants", href: "/user/participants", icon: Users },
    ],
  },
  {
    title: "Promote & Affiliate",
    items: [
      { label: "Affiliate Marketplace", href: "/user/affiliate-marketplace", icon: Store },
      { label: "My Affiliate Links", href: "/user/my-affiliate-links", icon: Link2 },
      { label: "Affiliate Earnings", href: "/user/affiliate-earnings", icon: DollarSign },
    ],
  },
  {
    title: "Marketing & Sales",
    items: [
      { label: "Promo Codes", href: "/user/promo-codes", icon: Tag, requiredTier: "PRO", badge: "PRO" },
      { label: "Customer Database", href: "/user/customers", icon: Users, requiredTier: "PRO", badge: "PRO" },
      { label: "Email Campaigns", href: "/user/email-campaigns", icon: Mail, requiredTier: "PRO", badge: "PRO" },
    ],
  },
  {
    title: "Tools & Integration",
    items: [
      { label: "API Access", href: "/user/api-key", icon: Key, requiredTier: "PRO", badge: "PRO" },
      { label: "Webhooks", href: "/user/webhooks", icon: Webhook, requiredTier: "BUSINESS", badge: "BUSINESS" },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Certificate Template", href: "/user/settings/certificate", icon: FileBadge },
      { label: "Custom Domain", href: "/user/settings/custom-domain", icon: Globe, requiredTier: "PRO", badge: "PRO" },
      { label: "Microsite Settings", href: "/user/settings/microsite", icon: Settings },
      { label: "Support", href: "/user/support", icon: Settings },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Upgrade Plan", href: "/user/subscription", icon: Crown },
      { label: "Withdrawals", href: "/user/withdrawal", icon: Wallet },
    ],
  },
];

// Separate the exam center group - only shown if user has student account
const examCenterGroup: NavGroup = {
  title: "My Exam Center",
  items: [
    { label: "Student Dashboard", href: "/student/dashboard", icon: BookOpen },
    { label: "Student Login Portal", href: "/student/login", icon: Users },
  ],
};

interface DashboardLayoutClientProps {
  user: {
    username: string;
    email: string;
    name?: string | null;
    avatar?: string | null;
    role?: string;
    hasStudentAccount?: boolean;
    sellerTier?: string;
  };
  children: React.ReactNode;
}

function getRequiredTierRank(tier?: string): number {
  switch (tier) {
    case "PRO": return 1;
    case "BUSINESS": return 2;
    default: return 0;
  }
}

function canAccessTierItem(requiredTier?: string, userTier?: string): boolean {
  if (!requiredTier) return true;
  const userRank = getRequiredTierRank(userTier);
  const requiredRank = getRequiredTierRank(requiredTier);
  return userRank >= requiredRank;
}

export function DashboardLayoutClient({ user, children }: DashboardLayoutClientProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [lockedItems, setLockedItems] = useState<Set<string>>(new Set());

  // Check which items are locked based on user tier
  useEffect(() => {
    const locked = new Set<string>();
    navigationGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (!canAccessTierItem(item.requiredTier, user.sellerTier)) {
          locked.add(item.href);
        }
      });
    });
    setLockedItems(locked);
  }, [user.sellerTier]);

  const isLocked = (href: string) => lockedItems.has(href);

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-300",
          collapsed ? "w-20" : "w-72",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex h-16 items-center border-b border-slate-100 px-4",
          collapsed ? "justify-center" : "gap-3"
        )}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
            <Zap className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-slate-900">TOEFLLYNK</h1>
              <p className="text-xs text-slate-400">Command Center</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navigationGroups.map((group, groupIndex) => (
            <div key={group.title} className={cn("mb-6", groupIndex === 0 && "")}>
              {!collapsed && (
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {group.title}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isItemLocked = isLocked(item.href);
                  const isExactMatch = pathname === item.href;
                  const isChildMatch = pathname.startsWith(item.href + "/") && item.href !== "/user";
                  const isActive = isExactMatch || isChildMatch;
                  return (
                    <Link
                      key={item.href}
                      href={isItemLocked ? "/user/subscription" : item.href}
                      onClick={(e) => {
                        if (isItemLocked) {
                          e.preventDefault();
                          setSidebarOpen(false);
                        } else {
                          setSidebarOpen(false);
                        }
                      }}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-blue-50 text-blue-600"
                          : isItemLocked
                            ? "text-slate-400 cursor-not-allowed opacity-60 hover:opacity-80"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                        collapsed && "justify-center"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5 shrink-0 transition-colors",
                          isActive ? "text-blue-600" : isItemLocked ? "text-slate-300" : "text-slate-400 group-hover:text-slate-600"
                        )}
                      />
                      {!collapsed && (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className={cn("truncate", isItemLocked && "text-slate-400")}>{item.label}</span>
                          {isItemLocked && item.badge && (
                            <span className="flex items-center gap-1 shrink-0 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                              <Lock className="h-3 w-3" />
                              {item.badge}
                            </span>
                          )}
                          {!isItemLocked && item.requiredTier && (
                            <span className="shrink-0 text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                      {collapsed && isItemLocked && item.badge && (
                        <Lock className="h-3 w-3 text-amber-600" />
                      )}

                      {/* Active indicator */}
                      {isActive && !collapsed && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600"
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          {!!user.hasStudentAccount && (
            <div className="mb-6">
              {!collapsed && (
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  My Exam Center
                </p>
              )}
              <div className="space-y-1">
                {examCenterGroup.items.map((item) => {
                  const isExactMatch = pathname === item.href;
                  const isActive = isExactMatch;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-purple-50 text-purple-600"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                        collapsed && "justify-center"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5 shrink-0 transition-colors",
                          isActive ? "text-purple-600" : "text-slate-400 group-hover:text-slate-600"
                        )}
                      />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* User section */}
        <div className={cn(
          "border-t border-slate-100 p-4",
          collapsed && "flex justify-center"
        )}>
          {collapsed ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {user.name || user.username}
                  </p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
              <Link
                href="/api/logout"
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Link>
            </>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm lg:flex"
        >
          <ChevronLeft className={cn("h-3.5 w-3.5 text-slate-500 transition-transform", collapsed && "rotate-180")} />
        </button>
      </motion.aside>

      {/* Main content */}
      <div className={cn(
        "min-h-screen transition-all duration-300",
        collapsed ? "lg:ml-20" : "lg:ml-72"
      )}>
        {/* Top header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 lg:hidden"
            >
              <Menu className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/${user.username}`} target="_blank">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                View Microsite
              </Button>
            </Link>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}