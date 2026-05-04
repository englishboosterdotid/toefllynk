"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, MapPin, Phone, Send, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

const contactMethods = [
  {
    icon: Mail,
    title: "Email",
    value: "support@toefllynk.com",
    description: "Respon dalam 24 jam kerja",
  },
  {
    icon: Phone,
    title: "WhatsApp",
    value: "+62 812-3456-7890",
    description: "Senin-Jumat, 09:00-17:00 WIB",
  },
  {
    icon: MapPin,
    title: "Alamat",
    value: "Jakarta, Indonesia",
    description: "Kantor kami berlokasi di Jakarta",
  },
];

const faqQuickLinks = [
  { question: "Bagaimana cara mendaftar?", answer: "Klik tombol &quot;Mulai Gratis&quot; di halaman utama dan isi formulir registrasi." },
  { question: "Bagaimana cara membuat produk?", answer: "Login ke dashboard, pilih &quot;Produk Saya&quot;, lalu klik &quot;Tambah Produk Baru&quot;." },
  { question: "Bagaimana sistem pembayarannya?", answer: "Kami menggunakan Midtrans untuk semua transaksi. Buyer bisa bayar via bank transfer, e-wallet, atau kartu kredit." },
  { question: "Berapa lama saya bisa menarik saldo?", answer: "Penarikan diproses 1-3 hari kerja setelah requested." },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setSubmitted(true);
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-slate-900 sm:text-4xl"
          >
            Hubungi Kami
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-slate-600"
          >
            Punya pertanyaan atau butuh bantuan? Tim kami siap membantu Anda.
          </motion.p>
        </div>
      </section>

      {/* Contact Content */}
      <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
        {/* Contact Methods */}
        <div className="grid gap-6 sm:grid-cols-3 mb-12">
          {contactMethods.map((method, index) => (
            <motion.div
              key={method.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-xl border border-slate-200 bg-white p-6 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <method.icon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{method.title}</h3>
              <p className="mt-2 text-sm text-blue-600">{method.value}</p>
              <p className="mt-1 text-xs text-slate-500">{method.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Kirim Pesan</h2>

            {submitted ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Send className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-green-800">
                  Pesan Terkirim!
                </h3>
                <p className="mt-2 text-sm text-green-700">
                  Terima kasih telah menghubungi kami. Kami akan merespons dalam 24 jam kerja.
                </p>
                <Button
                  className="mt-6"
                  variant="outline"
                  onClick={() => setSubmitted(false)}
                >
                  Kirim Pesan Lain
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Masukkan nama Anda"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@contoh.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject">Subjek</Label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="Judul pesan Anda"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Pesan</Label>
                  <textarea
                    id="message"
                    rows={5}
                    placeholder="Tulis pesan Anda di sini..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 animate-spin" />
                      Mengirim...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Kirim Pesan
                    </span>
                  )}
                </Button>
              </form>
            )}
          </motion.div>

          {/* FAQ Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Pertanyaan Umum</h2>
            <div className="space-y-4">
              {faqQuickLinks.map((faq, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <h4 className="font-medium text-slate-900">{faq.question}</h4>
                  <p className="mt-2 text-sm text-slate-600">{faq.answer}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <strong>Tips:</strong> Untuk response lebih cepat, coba cari jawaban di
                <Link href="/#faq" className="ml-1 font-medium text-blue-600 hover:underline">
                  FAQ kami
                </Link>{" "}
                terlebih dahulu.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Business Hours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8"
        >
          <h3 className="text-lg font-semibold text-slate-900">Jam Operasional</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Senin - Jumat</p>
                <p className="text-sm text-slate-500">09:00 - 17:00 WIB</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200">
                <Clock className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Sabtu - Minggu</p>
                <p className="text-sm text-slate-500">Tutup</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} TOEFLLYNK. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="text-slate-500 hover:text-slate-900">Privacy</Link>
              <Link href="/terms" className="text-slate-500 hover:text-slate-900">Terms</Link>
              <Link href="/contact" className="text-slate-500 hover:text-slate-900">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}