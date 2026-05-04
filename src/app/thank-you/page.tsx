"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle2, MessageCircle, ArrowRight, Zap } from "lucide-react";

export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-200/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-purple-200/20 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-500/25"
        >
          <CheckCircle2 className="h-12 w-12 text-white" />
        </motion.div>

        {/* Logo */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">TOEFLLYNK</span>
          </Link>
        </div>

        {/* Content */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 p-8 shadow-xl">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-slate-900 mb-4"
          >
            Order Submitted!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-600 text-lg"
          >
            Terima kasih atas order Anda.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 bg-blue-50 rounded-xl p-4 text-sm text-blue-700"
          >
            Akses simulasi TOEFL Anda akan segera diaktifkan oleh provider.
            Silakan cek email untuk login credentials.
          </motion.div>

          {/* Next Steps */}
          <div className="mt-6 space-y-3">
            <p className="text-sm font-medium text-slate-900">Langkah selanjutnya:</p>
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                1
              </div>
              <p className="text-sm text-slate-600">Cek inbox email untuk instruksi login</p>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                2
              </div>
              <p className="text-sm text-slate-600">Ikuti instruksi untuk akses simulasi</p>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                3
              </div>
              <p className="text-sm text-slate-600">Mulai mengerjakan simulasi TOEFL</p>
            </div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 space-y-3"
          >
            <a
              href="/user"
              className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-medium transition-colors"
            >
              Lihat Dashboard
              <ArrowRight className="h-4 w-4" />
            </a>
            <p className="text-sm text-slate-500">
              Butuh bantuan?{" "}
              <a href="mailto:support@toefllynk.com" className="text-blue-600 hover:text-blue-700 font-medium">
                Hubungi support
              </a>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}