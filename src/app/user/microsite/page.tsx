"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, MessageCircle, Image, Type, CheckCircle2 } from "lucide-react";
import { AnimatedContainer } from "@/components/animations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function MicrositePage() {
  const [form, setForm] = useState({
    headline: "",
    bio: "",
    whatsapp: "",
    avatar: "",
    ctaText: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check for success param
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1") {
      setSuccess(true);
      // Remove param from URL
      window.history.replaceState({}, "", "/user/microsite");
    }

    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setForm({
            headline: data.user.headline || "",
            bio: data.user.bio || "",
            whatsapp: data.user.whatsapp || "",
            avatar: data.user.avatar || "",
            ctaText: data.user.ctaText || "",
          });
        }
      });
  }, []);

  const uploadFile = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (data.success) {
        setForm((prev) => ({ ...prev, avatar: data.url }));
      }
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const fd = new FormData();
      fd.append("headline", form.headline);
      fd.append("bio", form.bio);
      fd.append("whatsapp", form.whatsapp);
      fd.append("avatar", form.avatar);
      fd.append("ctaText", form.ctaText);

      const res = await fetch("/api/microsite", {
        method: "POST",
        body: fd,
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="space-y-6">
      <AnimatedContainer>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Microsite Builder</h1>
          <p className="mt-1 text-slate-500">
            Customize your public profile page that showcases your TOEFL products
          </p>
        </div>
      </AnimatedContainer>

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-center gap-3"
        >
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-green-800 font-medium">Microsite berhasil disimpan!</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <AnimatedContainer delay={0.1}>
          <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Profile Settings</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="headline" className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-slate-500" />
                  Headline
                </Label>
                <Input
                  id="headline"
                  placeholder="TOEFL Expert with 10+ Years Experience"
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-500" />
                  Bio
                </Label>
                <textarea
                  id="bio"
                  placeholder="Tell your visitors about yourself..."
                  rows={4}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm transition-all duration-200 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-slate-500" />
                  WhatsApp Number
                </Label>
                <Input
                  id="whatsapp"
                  placeholder="6281234567890"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-slate-500" />
                  Profile Picture
                </Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && uploadFile(e.target.files[0])}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                />
                {form.avatar && (
                  <div className="mt-2 flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <img src={form.avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
                    <span className="text-sm text-slate-600">Profile image uploaded</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ctaText">CTA Button Text</Label>
                <Input
                  id="ctaText"
                  placeholder="Hubungi Saya"
                  value={form.ctaText}
                  onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Menyimpan...
                </span>
              ) : (
                "Simpan Microsite"
              )}
            </Button>
          </div>
        </AnimatedContainer>

        {/* Preview */}
        <AnimatedContainer delay={0.2}>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 sticky top-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Live Preview</h2>

            <div className="rounded-2xl border-2 border-slate-100 p-8 bg-gradient-to-b from-slate-50 to-white">
              <div className="text-center">
                {form.avatar ? (
                  <img
                    src={form.avatar}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-slate-200 flex items-center justify-center">
                    <User className="h-10 w-10 text-slate-400" />
                  </div>
                )}

                <h3 className="text-2xl font-bold text-slate-900">
                  {form.headline || "Your Headline Here"}
                </h3>

                <p className="mt-3 text-slate-500 max-w-md mx-auto">
                  {form.bio || "Your bio will appear here. Tell visitors about your expertise and what you offer."}
                </p>

                {form.whatsapp && (
                  <p className="mt-2 text-sm text-slate-400">WhatsApp: {form.whatsapp}</p>
                )}

                <a
                  href={form.whatsapp ? `https://wa.me/${form.whatsapp.replace(/\D/g, "")}` : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-block mt-6 px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                    form.ctaText
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {form.ctaText || "CTA Button Text"}
                </a>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-center text-sm text-slate-400 mb-4">Your Products</p>
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-slate-100 rounded-xl h-32 flex items-center justify-center">
                      <span className="text-slate-400 text-sm">Product {i}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-slate-400">
              Preview will update as you type
            </p>
          </div>
        </AnimatedContainer>
      </form>
    </main>
  );
}