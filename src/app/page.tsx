"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  ArrowRight,
  CheckCircle2,
  Star,
  Menu,
  X,
  ChevronDown,
  Play,
  Shield,
  Lock,
  CreditCard,
  Crown,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedContainer } from "@/components/animations";
import { FeatureCard } from "@/components/cards";
import { AuthStatus } from "@/components/auth/AuthStatus";

const features = [
  {
    iconName: "Rocket",
    title: "Microsite Builder",
    description:
      "Buat halaman bio link jualan TOEFL hanya dalam 5 menit. Tanpa coding, langsung online.",
  },
  {
    iconName: "Users",
    title: "Affiliate Marketplace",
    description:
      "Biarkan user lain menjual produk Anda dengan link affiliate otomatis dan komisi transparan.",
  },
  {
    iconName: "BarChart3",
    title: "Order Tracking",
    description:
      "Pantau order, komisi, dan fee platform secara real-time dalam satu dashboard.",
  },
  {
    iconName: "Shield",
    title: "Secure Payment",
    description:
      "Transaksi aman dengan berbagai metode pembayaran dan enkripsi data terlindungi.",
  },
];

const testimonials = [
  {
    name: "Sarah Wijaya",
    role: "TOEFL Instructor",
    content:
      "TOEFLLYNK membantu saya meningkatkan penjualan kursus TOEFL hingga 300% dalam 3 bulan!",
    rating: 5,
  },
  {
    name: "Ahmad Pratama",
    role: "Kampung Inggris Owner",
    content:
      "Fitur affiliate-nya luar biasa. Sekarang 50+ tutor bisa menjual produk saya dengan mudah.",
    rating: 5,
  },
  {
    name: "Diana Chen",
    role: "EdTech Creator",
    content:
      "Dashboard yang intuitif dan analytics yang detail membantu saya memahami perilaku customer.",
    rating: 5,
  },
];

const stats = [
  { label: "Active Users", value: "10,000+" },
  { label: "Products Sold", value: "50,000+" },
  { label: "Affiliate Partners", value: "5,000+" },
  { label: "Conversion Rate", value: "85%" },
];

const plans = [
  {
    name: "Coba",
    price: 0,
    description: "Gratis untuk memulai",
    features: [
      "3 Produk untuk dijual",
      "3 Produk di microsite",
      "Affiliate System",
      "Midtrans Payment",
      "Basic Analytics",
    ],
    popular: false,
  },
  {
    name: "Berkembang",
    price: 79000,
    description: "Untuk growing business",
    features: [
      "Unlimited Produk",
      "15 Produk di microsite",
      "Custom Certificate",
      "Promo/Discount Code",
      "Custom Domain",
      "Basic Theme Custom",
      "Customer Database (500)",
      "Email Marketing (1.000/bulan)",
      "API Access",
    ],
    popular: true,
  },
  {
    name: "Bisnis",
    price: 199000,
    description: "Untuk scale besar",
    features: [
      "Unlimited Produk",
      "Unlimited Microsite",
      "Full Theme Custom",
      "Custom Footer/Header",
      "Remove Lynk Logo",
      "Customer Database (Unlimited)",
      "Email Marketing (10.000/bulan)",
      "Webhook Integration",
    ],
    popular: false,
  },
];

const faqs = [
  {
    question: "Berapa biaya untuk bergabung di TOEFLLYNK?",
    answer: "TOEFLLYNK memiliki paket gratis (Coba) yang bisa langsung digunakan. Kami mengambil platform fee kecil dari setiap transaksi: Coba 10%, Berkembang 5%, Bisnis 3%. Fee ini membantu kami menjaga server dan mengembangkan fitur baru.",
  },
  {
    question: "Apa perbedaan antar paket?",
    answer: "Paket Coba gratis dengan 3 produk. Berkembang Rp 79rb/bulan unlimited + custom domain + API + CRM. Bisnis Rp 199rb/bulan unlimited + white-label microsite + webhook.",
  },
  {
    question: "Bagaimana sistem pembayaran di TOEFLLYNK?",
    answer: "Kami menggunakan Midtrans sebagai payment gateway yang mendukung berbagai metode pembayaran seperti Credit Card, Bank Transfer, GoPay, OVO, Dana, dan lainnya. Semua transaksi dijamin aman dan terenkripsi.",
  },
  {
    question: "Apakah saya bisa menjadi affiliate?",
    answer: "Tentu! Siapa saja bisa menjadi affiliate di TOEFLLYNK, bahkan dengan paket gratis. Anda bisa mendapatkan komisi 10-30% dari setiap penjualan yang berhasil melalui link affiliate Anda.",
  },
  {
    question: "Bagaimana cara menarik uang dari penjualan?",
    answer: "Saldo dari penjualan akan masuk ke akun TOEFLLYNK Anda. Anda bisa menarik ke rekening bank kapan saja. Biaya penarikan: Coba 5%, Berkembang 2%, Bisnis 0%. Proses penarikan biasanya 1-3 hari kerja.",
  },
  {
    question: "Bisakah saya menggunakan domain sendiri?",
    answer: "Ya! Dengan paket Berkembang atau Bisnis, Anda bisa menghubungkan custom domain ke microsite Anda. Paket Bisnis juga menyediakan white-label microsite untuk pengalaman brand yang lebih profesional.",
  },
];

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cookieConsent, setCookieConsent] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);

  // Check for existing consent on mount (client-side only)
  useEffect(() => {
    const savedConsent = localStorage.getItem("cookie-consent");
    if (savedConsent) {
      setCookieConsent(true);
    }
  }, []);

  const handleCookieConsent = () => {
    localStorage.setItem("cookie-consent", "true");
    setCookieConsent(true);
  };

  return (
    <main className="min-h-screen">
      {/* Cookie Consent Banner */}
      {!cookieConsent && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 p-4 shadow-lg">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-600">
                Kami menggunakan cookie untuk meningkatkan pengalaman Anda di situs ini.
                Dengan melanjutkan, Anda menyetujui penggunaan cookie kami.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCookieConsent}
                >
                  Hanya Esensial
                </Button>
                <Button
                  size="sm"
                  onClick={handleCookieConsent}
                >
                  Terima Semua
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-slate-200/50 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">TOEFLLYNK</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            <Link href="/#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Fitur
            </Link>
            <Link href="/#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Harga
            </Link>
            <Link href="/#faq" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              FAQ
            </Link>
            <Link href="/#testimonials" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Testimoni
            </Link>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <AuthStatus variant="desktop" />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="flex items-center justify-center p-2 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-slate-600" />
            ) : (
              <Menu className="h-6 w-6 text-slate-600" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-slate-200 bg-white md:hidden"
            >
              <div className="space-y-4 p-4">
                <Link
                  href="/#features"
                  className="block py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Fitur
                </Link>
                <Link
                  href="/#pricing"
                  className="block py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Harga
                </Link>
                <Link
                  href="/#faq"
                  className="block py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  FAQ
                </Link>
                <Link
                  href="/#testimonials"
                  className="block py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Testimoni
                </Link>
                <div className="flex flex-col gap-2 pt-4">
                  <AuthStatus variant="mobile" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-purple-200/30 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-100/50 to-purple-100/50 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2"
            >
              <Star className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                Platform Monetisasi TOEFL #1 di Indonesia
              </span>
            </motion.div>

            <AnimatedContainer>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Bangun Microsite Jualan TOEFL
                </span>
                <br />
                <span className="text-slate-900">+ Affiliate Produk Digital</span>
              </h1>
            </AnimatedContainer>

            <AnimatedContainer delay={0.1}>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 sm:text-xl">
                TOEFLLYNK membantu tutor, kampung inggris, dan creator edukasi
                menjual simulasi TOEFL, ebook, webinar, dan membuka affiliate
                marketplace dalam satu dashboard.
              </p>
            </AnimatedContainer>

            <AnimatedContainer delay={0.2}>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/register">
                  <Button size="lg" className="group">
                    Mulai Gratis
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg">
                    Login Dashboard
                  </Button>
                </Link>
              </div>
            </AnimatedContainer>

            {/* Stats */}
            <AnimatedContainer delay={0.3}>
              <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-2xl font-bold text-slate-900 sm:text-3xl">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </AnimatedContainer>
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-slate-900 sm:text-4xl"
            >
              Lihat Cara Kerjanya
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-4 text-lg text-slate-600"
            >
              Pelajari cara membangun microsite TOEFL Anda dalam 5 menit
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900 shadow-2xl"
          >
            {/* Video Thumbnail / Placeholder */}
            {!videoPlaying && (
              <div
                className="absolute inset-0 flex cursor-pointer items-center justify-center"
                onClick={() => setVideoPlaying(true)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700 opacity-80" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform hover:scale-110">
                    <Play className="h-10 w-10 text-white ml-1" />
                  </div>
                  <p className="mt-4 text-lg font-medium text-white">Tonton Demo</p>
                </div>
              </div>
            )}

            {/* Video Player Placeholder */}
            {videoPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <div className="text-center text-white">
                  <p className="text-xl">Video Demo Player</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Embed YouTube/Vimeo di sini
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-2 text-slate-500">
              <Lock className="h-5 w-5" />
              <span className="text-sm font-medium">SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <CreditCard className="h-5 w-5" />
              <span className="text-sm font-medium">Powered by Midtrans</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium">Secure Payments</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-slate-900 sm:text-4xl"
            >
              Fitur Unggulan
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-4 text-lg text-slate-600"
            >
              Semua yang Anda butuhkan untuk menjual produk digital TOEFL
            </motion.p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-slate-900 sm:text-4xl"
            >
              Cara Kerja
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-4 text-lg text-slate-600"
            >
              Mulai dari nol hingga menghasilkan dalam 3 langkah mudah
            </motion.p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Buat Akun & Produk",
                description: "Daftar gratis dan buat produk digital TOEFL Anda dalam hitungan menit.",
              },
              {
                step: "02",
                title: "Customize Microsite",
                description: "Pilih template, atur tampilan, dan buat halaman bio link yang menarik.",
              },
              {
                step: "03",
                title: "Jual & Dapatkan Komisi",
                description: "Pasarkan produk Anda sendiri atau buka affiliate untuk memperluas jangkauan.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative text-center"
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-2xl font-bold text-white shadow-lg shadow-blue-500/25">
                  {item.step}
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-slate-600">{item.description}</p>

                {index < 2 && (
                  <div className="absolute -right-4 top-10 hidden text-slate-300 md:block">
                    <ArrowRight className="h-8 w-8" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-slate-900 sm:text-4xl"
            >
              Apa Kata Mereka
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-4 text-lg text-slate-600"
            >
              Cerita sukses dari para tutor dan creator yang sudah bergabung
            </motion.p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < testimonial.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                    />
                  ))}
                </div>

                <p className="mb-6 text-slate-600 leading-relaxed italic">
                  &quot;{testimonial.content}&quot;
                </p>

                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{testimonial.name}</p>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-gradient-to-b from-slate-50 to-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-slate-900 sm:text-4xl"
            >
              Harga Transparan
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-4 text-lg text-slate-600"
            >
              Pilih paket yang sesuai dengan kebutuhan Anda
            </motion.p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl border ${plan.popular ? "border-blue-500 shadow-xl shadow-blue-500/10" : "border-slate-200"} bg-white p-8`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-1 text-sm font-semibold text-white">
                    Most Popular
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                  <p className="mt-2 text-slate-500">{plan.description}</p>

                  <div className="mt-6">
                    <span className="text-4xl font-bold text-slate-900">
                      {plan.price === 0 ? "Gratis" : `Rp ${(plan.price / 1000).toFixed(0)}rb`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-slate-500">/bulan</span>
                    )}
                  </div>
                </div>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <Link href="/register" className="block">
                    <Button
                      variant={plan.popular ? "default" : "outline"}
                      className="w-full"
                    >
                      {plan.price === 0 ? "Mulai Gratis" : "Pilih Paket"}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-slate-900 sm:text-4xl"
            >
              Pertanyaan yang Sering Diajukan
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-4 text-lg text-slate-600"
            >
              Temukan jawaban untuk pertanyaan umum tentang TOEFLLYNK
            </motion.p>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl border border-slate-200 bg-white"
              >
                <button
                  className="flex w-full items-center justify-between p-6 text-left"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-semibold text-slate-900 pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 transition-transform ${openFaq === index ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-slate-600">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 p-12 text-center shadow-2xl sm:p-16"
          >
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10" />

            <div className="relative">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Siap Memulai?
              </h2>
              <p className="mt-4 text-lg text-blue-100">
                Bergabung dengan 10,000+ tutor dan creator yang sudah sukses
                monetize konten mereka bersama TOEFLLYNK.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Daftar Gratis Sekarang
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">TOEFLLYNK</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="/privacy" className="hover:text-slate-900">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-900">Terms</Link>
              <Link href="/contact" className="hover:text-slate-900">Contact</Link>
            </div>

            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} TOEFLLYNK. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}