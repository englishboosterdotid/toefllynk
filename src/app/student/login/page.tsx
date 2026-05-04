import { User, Lock, Mail, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function StudentLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;

  const errorMessages: Record<string, string> = {
    missing_fields: "Email dan access token harus diisi",
    invalid_credentials: "Email atau access token tidak valid",
    server_error: "Terjadi kesalahan server. Silakan coba lagi.",
  };

  const errorMessage = error ? errorMessages[error] || "Login gagal" : null;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25 mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Student Portal</h1>
          <p className="text-slate-500 mt-2">Masuk dengan email dan access token</p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}

        <form
          action="/api/student-login"
          method="POST"
          className="bg-white rounded-2xl shadow-xl shadow-blue-500/5 p-8 space-y-6"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  name="buyerEmail"
                  type="email"
                  placeholder="student@email.com"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Access Token</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  name="accessToken"
                  type="text"
                  placeholder="Masukkan access token Anda"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
            </div>
          </div>

          <button className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-medium hover:bg-blue-700 transition-colors">
            Masuk Dashboard
          </button>

          <p className="text-center text-sm text-slate-500">
            Token akses diberikan oleh penjual setelah pembelian paket
          </p>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Kembali ke{" "}
          <Link href="/" className="text-blue-600 hover:underline">
            beranda
          </Link>
        </p>
      </div>
    </main>
  );
}