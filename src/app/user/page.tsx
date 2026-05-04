import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/authService";
import { StatCard } from "@/components/cards";
import { AnimatedContainer } from "@/components/animations";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Circle,
  Package,
  Users,
  BookOpen,
  DollarSign,
  Target,
} from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const myProducts = await prisma.product.count({
    where: { userId: user?.id },
  });

  const myOrders = await prisma.order.count({
    where: {
      product: {
        userId: user?.id,
      },
    },
  });

  const myParticipants = await prisma.studentAccount.count({
    where: {
      ownerUserId: user?.id,
    },
  });

  const myAffiliate = await prisma.affiliateConversion.aggregate({
    _sum: {
      commissionAmount: true,
    },
    where: {
      affiliateUserId: user?.id,
    },
  });

  const myCredits = await prisma.studentExamCredit.aggregate({
    _sum: {
      totalCredit: true,
      usedCredit: true,
    },
    where: {
      student: {
        ownerUserId: user?.id,
      },
    },
  });

  const micrositeReady = await prisma.user.findUnique({
    where: { id: user?.id },
  });

  const affiliateJoined = await prisma.affiliateEnrollment.count({
    where: {
      affiliateUserId: user?.id,
    },
  });

  const checklistItems = [
    {
      label: "Setup Your Microsite Branding",
      href: "/user/microsite",
      done: !!micrositeReady?.headline,
    },
    {
      label: "Create Your First TOEFL Package",
      href: "/user/products",
      done: myProducts > 0,
    },
    {
      label: "Join Affiliate Ecosystem",
      href: "/user/affiliate-marketplace",
      done: affiliateJoined > 0,
    },
    {
      label: "Receive Your First Student Order",
      href: "/user/orders",
      done: myOrders > 0,
    },
  ];

  const checklistDone = checklistItems.filter((item) => item.done).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <AnimatedContainer>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Selamat datang, {user?.name || user?.username} 👋
          </h1>
          <p className="mt-1 text-slate-500">
            Anda beroperasi sebagai Seller, Affiliate Partner, dan TOEFL Provider
          </p>
        </div>
      </AnimatedContainer>

      {/* Launch Checklist */}
      <AnimatedContainer delay={0.1}>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Launch Checklist</h2>
              <p className="mt-1 text-sm text-slate-500">
                Lengkapi langkah-langkah berikut untuk mengaktifkan bisnis TOEFL Anda
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-2xl font-bold text-white shadow-lg shadow-blue-500/25">
                {checklistDone}/4
              </div>
              <div className="text-sm text-slate-500">Steps Completed</div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {checklistItems.map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                  {item.done ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <span className="font-medium text-slate-700">{item.label}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      </AnimatedContainer>

      {/* Sell Business Stats */}
      <AnimatedContainer delay={0.2}>
        <div>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Sell Business</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              iconName="Package"
              label="TOEFL Packages"
              value={myProducts}
            />
            <StatCard
              iconName="ShoppingCart"
              label="Student Orders"
              value={myOrders}
            />
            <StatCard
              iconName="Users"
              label="Active Participants"
              value={myParticipants}
            />
          </div>
        </div>
      </AnimatedContainer>

      {/* Affiliate Stats */}
      <AnimatedContainer delay={0.3}>
        <div>
          <div className="mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-slate-900">Affiliate Promotion</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              iconName="DollarSign"
              label="Total Affiliate Earnings"
              value={formatCurrency(myAffiliate._sum.commissionAmount || 0)}
            />
            <StatCard
              iconName="Target"
              label="Affiliate Links Active"
              value={affiliateJoined}
              trend={affiliateJoined > 0 ? "Active" : "Not joined"}
              trendUp={affiliateJoined > 0}
            />
          </div>
        </div>
      </AnimatedContainer>

      {/* Exam Center Stats */}
      <AnimatedContainer delay={0.4}>
        <div>
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-slate-900">Exam Center</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              iconName="BookOpen"
              label="Exam Credits Sold"
              value={myCredits._sum.totalCredit || 0}
            />
            <StatCard
              iconName="Target"
              label="Exam Credits Used"
              value={myCredits._sum.usedCredit || 0}
            />
          </div>
        </div>
      </AnimatedContainer>

      {/* Quick Actions */}
      <AnimatedContainer delay={0.5}>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/user/products"
              className="group flex items-center gap-3 rounded-xl bg-slate-50 p-4 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white">
                <Package className="h-5 w-5" />
              </div>
              <span className="font-medium">Create TOEFL Package</span>
            </Link>

            <Link
              href="/user/affiliate-marketplace"
              className="group flex items-center gap-3 rounded-xl bg-slate-50 p-4 transition-all duration-200 hover:bg-green-50 hover:text-green-600"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="font-medium">Join Affiliate Product</span>
            </Link>

            <Link
              href="/user/participants"
              className="group flex items-center gap-3 rounded-xl bg-slate-50 p-4 transition-all duration-200 hover:bg-purple-50 hover:text-purple-600"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white">
                <Users className="h-5 w-5" />
              </div>
              <span className="font-medium">View Participants</span>
            </Link>

            <Link
              href="/student/dashboard"
              className="group flex items-center gap-3 rounded-xl bg-slate-50 p-4 transition-all duration-200 hover:bg-amber-50 hover:text-amber-600"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="font-medium">Open Exam Center</span>
            </Link>
          </div>
        </div>
      </AnimatedContainer>
    </div>
  );
}