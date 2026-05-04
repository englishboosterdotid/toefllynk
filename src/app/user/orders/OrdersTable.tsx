"use client";

import { useState, useTransition } from "react";
import { OrderStatus, PackageType } from "@/generated/prisma/enums";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  BarChart2,
  MessageCircle,
  RefreshCw,
  Send,
} from "lucide-react";

// Resend Email Button Component
function ResendEmailButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  const handleResend = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("orderId", orderId);

      try {
        const response = await fetch("/api/order/resend-access", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          setSent(true);
          setTimeout(() => setSent(false), 3000);
        }
      } catch (error) {
        console.error("Failed to resend email:", error);
      }
    });
  };

  if (sent) {
    return (
      <div className="inline-flex items-center justify-center gap-2 bg-green-50 text-green-700 px-4 py-2.5 rounded-xl font-medium">
        <Check className="h-4 w-4" />
        Email Sent!
      </div>
    );
  }

  return (
    <button
      onClick={handleResend}
      disabled={isPending}
      className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Sending...
        </>
      ) : (
        <>
          <Send className="h-4 w-4" />
          Resend Access Email
        </>
      )}
    </button>
  );
}

interface Order {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerWhatsapp: string | null;
  status: OrderStatus;
  referralCode: string | null;
  createdAt: Date;
  product: {
    id: string;
    title: string;
    price: number;
    promoPrice: number | null;
    packageType: PackageType | null;
    productType: string;
  };
  affiliateConversion: {
    commissionAmount: number;
  } | null;
  student: {
    id: string;
    buyerEmail: string;
    credits: { totalCredit: number; usedCredit: number }[];
    results: { totalScore: number; createdAt: Date }[];
  } | null;
}

interface OrdersTableProps {
  orders: Order[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredOrders =
    filter === "all"
      ? orders
      : orders.filter((o) => o.status === filter);

  const counts = {
    all: orders.length,
    [OrderStatus.PENDING]: orders.filter(
      (o) => o.status === OrderStatus.PENDING
    ).length,
    [OrderStatus.COMPLETED]: orders.filter(
      (o) => o.status === OrderStatus.COMPLETED
    ).length,
    [OrderStatus.CANCELLED]: orders.filter(
      (o) => o.status === OrderStatus.CANCELLED
    ).length,
  };

  const toggleExpand = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Completed
          </span>
        );
      case OrderStatus.PENDING:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <Clock className="h-3.5 w-3.5" />
            Pending
          </span>
        );
      case OrderStatus.CANCELLED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="h-3.5 w-3.5" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Filter Tabs */}
      <div className="border-b border-slate-200 px-4 py-3 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            filter === "all"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All ({counts.all})
        </button>
        <button
          onClick={() => setFilter(OrderStatus.PENDING)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            filter === OrderStatus.PENDING
              ? "bg-amber-500 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Pending ({counts[OrderStatus.PENDING]})
        </button>
        <button
          onClick={() => setFilter(OrderStatus.COMPLETED)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            filter === OrderStatus.COMPLETED
              ? "bg-green-500 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Completed ({counts[OrderStatus.COMPLETED]})
        </button>
        <button
          onClick={() => setFilter(OrderStatus.CANCELLED)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            filter === OrderStatus.CANCELLED
              ? "bg-red-500 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Cancelled ({counts[OrderStatus.CANCELLED]})
        </button>
      </div>

      {/* Table Header */}
      <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wider">
        <div className="col-span-3">Customer</div>
        <div className="col-span-2">Product</div>
        <div className="col-span-2">Amount</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Date</div>
        <div className="col-span-1"></div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">No orders found</p>
          <p className="text-slate-400 text-sm mt-1">
            {filter === "all"
              ? "Share your products to get orders"
              : `No ${filter.toLowerCase()} orders`}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filteredOrders.map((order) => {
            const isBundle = order.product.packageType === PackageType.BUNDLE;
            const isExpanded = expandedOrders.has(order.id);
            const student = order.student;
            const remainingCredits = student
              ? student.credits.reduce(
                  (sum, c) => sum + (c.totalCredit - c.usedCredit),
                  0
                )
              : 0;
            const totalCredits = student
              ? student.credits.reduce((sum, c) => sum + c.totalCredit, 0)
              : 0;
            const completedTests = student ? student.results.length : 0;
            const latestScore =
              student && student.results.length > 0
                ? student.results[0].totalScore
                : null;
            const amount = order.product.promoPrice || order.product.price;

            return (
              <div key={order.id}>
                {/* Main Row */}
                <div className="px-4 lg:px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    {/* Customer Info - Mobile First */}
                    <div className="flex items-center gap-3 lg:hidden">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {order.buyerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 truncate">
                          {order.buyerName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {order.buyerEmail}
                        </p>
                      </div>
                    </div>

                    {/* Customer Info - Desktop */}
                    <div className="hidden lg:flex items-center gap-3 col-span-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {order.buyerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 truncate">
                          {order.buyerName}
                        </p>
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {order.buyerEmail}
                        </p>
                        {order.buyerWhatsapp && (
                          <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {order.buyerWhatsapp}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Product */}
                    <div className="hidden lg:block col-span-2 min-w-0">
                      <p className="font-medium text-slate-900 truncate text-sm">
                        {order.product.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {isBundle ? "Bundle" : "Simulation"}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="hidden lg:block col-span-2 text-right">
                      <p className="font-bold text-slate-900">
                        Rp {amount.toLocaleString("id-ID")}
                      </p>
                      {order.affiliateConversion && (
                        <p className="text-xs text-green-600">
                          -Rp{" "}
                          {order.affiliateConversion.commissionAmount.toLocaleString(
                            "id-ID"
                          )}{" "}
                          affiliate
                        </p>
                      )}
                    </div>

                    {/* Status */}
                    <div className="hidden lg:block col-span-2">
                      {getStatusBadge(order.status)}
                    </div>

                    {/* Date */}
                    <div className="hidden lg:block col-span-2 text-right">
                      <p className="text-sm text-slate-700">
                        {new Date(order.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 lg:col-span-1">
                      <button
                        onClick={() => toggleExpand(order.id)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-500" />
                        )}
                      </button>
                      <button
                        onClick={() =>
                          toggleExpand(isExpanded ? "" : order.id)
                        }
                        className="hidden lg:block p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Mobile Summary Row */}
                  <div className="lg:hidden mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(order.status)}
                      <span className="text-sm font-bold text-slate-900">
                        Rp {amount.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="bg-slate-50 border-t border-slate-100 px-4 lg:px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Order Details */}
                      <div className="bg-white rounded-xl p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                          Order Details
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Order ID</span>
                            <button
                              onClick={() =>
                                copyToClipboard(order.id, order.id)
                              }
                              className="flex items-center gap-1 text-slate-900 hover:text-blue-600"
                            >
                              <span className="font-mono text-xs">
                                {order.id.slice(0, 8)}...
                              </span>
                              {copiedId === order.id ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Product</span>
                            <span className="text-slate-900">
                              {order.product.title}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Type</span>
                            <span className="text-slate-900">
                              {isBundle ? "Bundle" : "Simulation"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Referral</span>
                            <span
                              className={
                                order.referralCode
                                  ? "text-slate-900"
                                  : "text-slate-400"
                              }
                            >
                              {order.referralCode || "-"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Student Progress */}
                      {!isBundle && order.status === OrderStatus.COMPLETED && student && (
                        <div className="bg-white rounded-xl p-4">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                            Student Progress
                          </p>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Credits</span>
                              <span className="text-slate-900">
                                {remainingCredits} / {totalCredits}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Tests Taken</span>
                              <span className="text-slate-900">
                                {completedTests}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Latest Score</span>
                              <span
                                className={
                                  latestScore
                                    ? "font-medium text-blue-600"
                                    : "text-slate-400"
                                }
                              >
                                {latestScore || "No test yet"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Email</span>
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    student.buyerEmail,
                                    `email-${order.id}`
                                  )
                                }
                                className="flex items-center gap-1 text-slate-900 hover:text-blue-600"
                              >
                                <span className="text-xs truncate max-w-[120px]">
                                  {student.buyerEmail}
                                </span>
                                {copiedId === `email-${order.id}` ? (
                                  <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                                ) : (
                                  <Copy className="h-3 w-3 flex-shrink-0" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        {order.status === OrderStatus.COMPLETED &&
                          !isBundle && (
                            <ResendEmailButton orderId={order.id} />
                          )}

                        {isBundle && order.status === OrderStatus.COMPLETED && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                            <div className="flex items-start gap-2">
                              <MessageCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <p>Manual service - contact buyer directly</p>
                            </div>
                          </div>
                        )}

                        {order.buyerWhatsapp && (
                          <a
                            href={`https://wa.me/${order.buyerWhatsapp.replace(
                              /[^0-9]/g,
                              ""
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 bg-green-50 text-green-700 px-4 py-2.5 rounded-xl font-medium hover:bg-green-100 transition-colors"
                          >
                            <Phone className="h-4 w-4" />
                            Contact via WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}