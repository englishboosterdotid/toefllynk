"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, Clock, Mail, AlertCircle } from "lucide-react";

type OrderStatus = "COMPLETED" | "PENDING" | "FAILED" | "EXPIRED";

export default function OrderSuccessClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const urlStatus = searchParams.get("status");

  const [stage, setStage] = useState<"loading" | "processing" | "success" | "pending" | "error">("loading");
  const stageRef = useRef(stage);
  stageRef.current = stage;

  useEffect(() => {
    // If URL says success, show immediately
    if (urlStatus === "success") {
      setStage("success");
      return;
    }

    if (!orderId) {
      setStage("pending");
      return;
    }

    // Check if payment is already processed (from webhook)
    const checkOrderStatus = async () => {
      try {
        const response = await fetch(`/api/order/${orderId}/status`);

        if (!response.ok) {
          setStage("error");
          return;
        }

        const data = await response.json();
        console.log("Order status response:", data);

        if (data.error) {
          setStage("error");
          return;
        }

        const orderStatus = data.status as OrderStatus;

        if (orderStatus === "COMPLETED") {
          setStage("success");
        } else if (orderStatus === "PENDING") {
          setStage("processing");
        } else {
          // FAILED, EXPIRED, or unknown
          setStage("pending");
        }
      } catch (err) {
        console.error("Failed to check order status:", err);
        setStage("error");
      }
    };

    checkOrderStatus();

    // Poll every 2 seconds for up to 30 seconds
    let pollCount = 0;
    const pollInterval = setInterval(async () => {
      // Stop polling if already success
      if (stageRef.current === "success") {
        clearInterval(pollInterval);
        return;
      }

      pollCount++;
      await checkOrderStatus();

      // If still not success after 15 polls, show pending
      if (pollCount >= 15 && (stageRef.current as string) !== "success") {
        clearInterval(pollInterval);
        setStage("pending");
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [orderId, urlStatus]);

  // Error state
  if (stage === "error") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 shadow-xl p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Terjadi Kesalahan</h1>
          <p className="text-slate-600 mb-6">
            Gagal memverifikasi status pesanan. Silakan coba lagi atau hubungi customer service.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium"
          >
            Coba Lagi
          </button>
        </div>
      </main>
    );
  }

  if (stage === "pending" || urlStatus === "pending") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Menunggu Pembayaran</h1>
          <p className="text-slate-600 mb-6">
            Pembayaran Anda sedang diproses. Silakan selesaikan pembayaran dan refresh halaman ini.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </main>
    );
  }

  if (stage === "processing") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Memproses Pembayaran...</h1>
          <p className="text-slate-600 mb-4">
            Mohon tunggu sebentar, kami sedang memverifikasi pembayaran Anda.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "200ms" }} />
            <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "400ms" }} />
          </div>
        </div>
      </main>
    );
  }

  // Success state - simplified, no direct access link
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-green-200 shadow-xl p-8 text-center">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Pembayaran Berhasil!</h1>
        <p className="text-slate-600 mb-6">
          Terima kasih! Pembayaran Anda telah berhasil.
        </p>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-center gap-2 text-sm text-blue-600 mb-3">
            <Mail className="h-4 w-4" />
            <span>Check Email Anda</span>
          </div>
          <p className="text-xs text-slate-500">
            Kami telah mengirim <strong>Access Token</strong> dan instruksi login ke email Anda. Silakan check inbox atau folder spam.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/student/login"
            target="_blank"
            className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            Buka Halaman Login Student
          </Link>

          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 text-slate-600 hover:text-slate-900 py-3 font-medium"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}