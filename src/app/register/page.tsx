"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, User, UserCircle, ArrowRight, Eye, EyeOff, Check, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedContainer } from "@/components/animations";

// Reserved usernames that conflict with app routes
const RESERVED_USERNAMES = [
  "admin", "user", "users", "student", "students", "api", "auth", "login",
  "logout", "register", "signup", "dashboard", "settings", "profile",
  "products", "orders", "withdrawal", "withdrawals", "affiliate",
  "subscription", "seller", "sellers", "microsite", "www", "app", "help",
  "support", "about", "contact", "pricing", "blog", "news", "oauth",
  "callback", "webhook", "webhooks", "midtrans", "xendit", "blog"
];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerificationSent, setShowVerificationSent] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");

  // Check for error params from email verification
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      switch (errorParam) {
        case "invalid-token":
          setError("Link verifikasi tidak valid atau sudah kadaluarsa.");
          break;
        case "token-expired":
          setError("Link verifikasi sudah kadaluarsa. Silakan daftar ulang atau minta link baru.");
          break;
        case "missing-token":
          setError("Link verifikasi tidak valid.");
          break;
        default:
          setError("Terjadi kesalahan saat verifikasi email.");
      }
    }
  }, [searchParams]);

  const isReservedUsername = form.username.length >= 3 && RESERVED_USERNAMES.includes(form.username.toLowerCase());

  const passwordRequirements = [
    { label: "Minimal 8 karakter", met: form.password.length >= 8 },
    { label: "Huruf besar & kecil", met: /[a-z]/.test(form.password) && /[A-Z]/.test(form.password) },
    { label: "Angka", met: /\d/.test(form.password) },
  ];

  const allRequirementsMet = passwordRequirements.every((req) => req.met);

  const handleResendVerification = async () => {
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Link verifikasi telah dikirim ulang");
      } else {
        alert(data.message || "Gagal mengirim ulang");
      }
    } catch {
      alert("Terjadi kesalahan");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allRequirementsMet) {
      setError("Password tidak memenuhi syarat");
      return;
    }

    if (isReservedUsername) {
      setError("Username ini tidak tersedia");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        setShowVerificationSent(true);
      } else {
        setError(data.message || "Registrasi gagal");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat registrasi");
    } finally {
      setIsLoading(false);
    }
  };

  // Show verification sent screen
  if (showVerificationSent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-slate-200/50 bg-white/80 p-8 shadow-xl backdrop-blur-xl text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
        >
          <MailCheck className="h-10 w-10 text-green-600" />
        </motion.div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Registrasi Berhasil!</h2>
        <p className="text-slate-500 mb-6">
          Kami telah mengirim link verifikasi ke email <strong>{form.email}</strong>.
          <br />
          Silakan klik link tersebut untuk mengaktifkan akun Anda.
        </p>
        <p className="text-sm text-slate-400 mb-6">
          Belum terima email? Cek folder spam atau{" "}
          <button onClick={handleResendVerification} className="text-blue-600 hover:underline">
            kirim ulang
          </button>
        </p>
        <Link href="/login">
          <Button variant="outline" className="w-full">
            Kembali ke Login
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/50 bg-white/80 p-8 shadow-xl backdrop-blur-xl">
      {/* Logo */}
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-900">TOEFLLYNK</span>
        </Link>
        <p className="mt-4 text-slate-500">Buat akun dan mulai monetize konten TOEFL Anda</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
          >
            {error}
          </motion.div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Nama Lengkap</Label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              className="pl-12"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              id="email"
              type="email"
              placeholder="nama@email.com"
              className="pl-12"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <p className="text-xs text-slate-400">Email akan digunakan untuk verifikasi akun</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <UserCircle className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              id="username"
              type="text"
              placeholder="johndoe"
              className={`pl-12 ${isReservedUsername ? "border-red-500 focus:border-red-500" : ""}`}
              value={form.username}
              onChange={(e) => {
                const val = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                setForm({ ...form, username: val });
                if (RESERVED_USERNAMES.includes(val)) {
                  setUsernameError("Username ini tidak tersedia");
                } else {
                  setUsernameError("");
                }
              }}
              required
            />
          </div>
          {usernameError || isReservedUsername ? (
            <p className="text-xs text-red-500">{usernameError || "Username ini tidak tersedia"}</p>
          ) : (
            <p className="text-xs text-slate-400">Username akan menjadi link microsite Anda: toefllynk.com/{form.username || "username"}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pl-12 pr-12"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {/* Password requirements */}
          <div className="mt-3 space-y-2">
            {passwordRequirements.map((req, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 text-xs transition-colors ${req.met ? "text-green-600" : "text-slate-400"}`}
              >
                <div className={`flex h-4 w-4 items-center justify-center rounded-full ${req.met ? "bg-green-100" : "bg-slate-100"}`}>
                  <Check className="h-2.5 w-2.5" />
                </div>
                {req.label}
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isLoading || !allRequirementsMet}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Membuat akun...
            </span>
          ) : (
            <>
              Buat Akun
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-500">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
          Masuk di sini
        </Link>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Dengan mendaftar, Anda menyetujui{" "}
        <Link href="/terms" className="text-blue-600 hover:underline">Syarat & Ketentuan</Link>
        {" "}dan{" "}
        <Link href="/privacy" className="text-blue-600 hover:underline">Kebijakan Privasi</Link>
      </p>
    </div>
  );
}

function RegisterFormFallback() {
  return (
    <div className="rounded-2xl border border-slate-200/50 bg-white/80 p-8 shadow-xl backdrop-blur-xl">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 mx-auto bg-slate-200 rounded" />
        <div className="h-4 w-64 mx-auto bg-slate-200 rounded" />
        <div className="space-y-3 pt-4">
          <div className="h-12 bg-slate-200 rounded-lg" />
          <div className="h-12 bg-slate-200 rounded-lg" />
          <div className="h-12 bg-slate-200 rounded-lg" />
          <div className="h-12 bg-slate-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4">
      {/* Background decorations */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-200/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-purple-200/20 blur-3xl" />
      </div>

      <AnimatedContainer className="w-full max-w-md">
        <Suspense fallback={<RegisterFormFallback />}>
          <RegisterForm />
        </Suspense>
      </AnimatedContainer>
    </main>
  );
}