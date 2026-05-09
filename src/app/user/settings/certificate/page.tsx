"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Type, Image, FileText, Upload, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SellerCertificatePreviewButton } from "@/components/SellerCertificatePreviewButton";

interface CertificateTemplate {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  showLogo: boolean;
  logoUrl: string | null;
  signatureText: string;
  footerText: string | null;
  validityDays: number | null;
  fontFamily: string;
  backgroundImage: string | null;
}

export default function CertificateTemplatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [template, setTemplate] = useState<Partial<CertificateTemplate>>({
    name: "Custom",
    title: "TOEFL ITP Simulation",
    subtitle: "Certificate of Completion",
    showLogo: true,
    logoUrl: "",
    signatureText: "Authorized Signature",
    footerText: "",
    validityDays: 365,
    fontFamily: "Inter",
    backgroundImage: "",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchTemplate();
  }, []);

  const fetchTemplate = async () => {
    try {
      const res = await fetch("/api/user/certificate-template");
      const data = await res.json();

      if (res.status === 403) {
        setHasAccess(false);
        setIsFetching(false);
        return;
      }

      setHasAccess(true);
      if (data.template) {
        setTemplate({
          ...data.template,
          logoUrl: data.template.logoUrl || "",
          footerText: data.template.footerText || "",
          backgroundImage: data.template.backgroundImage || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch template:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/certificate-template", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...template,
          logoUrl: template.logoUrl || null,
          footerText: template.footerText || null,
          backgroundImage: template.backgroundImage || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: "Template sertifikat berhasil disimpan" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: data.error || "Gagal menyimpan template" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Terjadi kesalahan saat menyimpan" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-64 bg-slate-200 rounded" />
        </div>
      </main>
    );
  }

  if (!hasAccess) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">Upgrade Diperlukan</CardTitle>
            <CardDescription className="text-amber-700">
              Custom certificate template memerlukan langganan PRO atau BUSINESS.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/user/subscription")}>
              Upgrade Sekarang
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Custom Certificate Template</h1>
          <p className="text-slate-500">Kustomisasi tampilan sertifikat untuk brand Anda</p>
        </div>
        <div className="flex items-center gap-3">
          <SellerCertificatePreviewButton template={template as any} />
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Menyimpan..." : "Simpan Template"}
          </Button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* Text Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Teks
          </CardTitle>
          <CardDescription>Kustomisasi judul dan deskripsi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Judul Sertifikat</Label>
            <Input
              id="title"
              value={template.title || ""}
              onChange={(e) => setTemplate({ ...template, title: e.target.value })}
              placeholder="TOEFL ITP Simulation"
            />
          </div>
          <div>
            <Label htmlFor="subtitle">Sub-judul</Label>
            <Input
              id="subtitle"
              value={template.subtitle || ""}
              onChange={(e) => setTemplate({ ...template, subtitle: e.target.value })}
              placeholder="Certificate of Completion"
            />
          </div>
          <div>
            <Label htmlFor="signatureText">Teks Tanda Tangan</Label>
            <Input
              id="signatureText"
              value={template.signatureText || ""}
              onChange={(e) => setTemplate({ ...template, signatureText: e.target.value })}
              placeholder="Authorized Signature"
            />
          </div>
          <div>
            <Label htmlFor="footerText">Teks Footer (opsional)</Label>
            <Input
              id="footerText"
              value={template.footerText || ""}
              onChange={(e) => setTemplate({ ...template, footerText: e.target.value })}
              placeholder="Custom footer text"
            />
          </div>
          <div>
            <Label htmlFor="validityDays">Masa Berlaku Sertifikat (hari)</Label>
            <Input
              id="validityDays"
              type="number"
              value={template.validityDays?.toString() || "365"}
              onChange={(e) => setTemplate({ ...template, validityDays: parseInt(e.target.value) || 365 })}
              placeholder="365"
            />
            <p className="text-xs text-slate-500 mt-1">Kosongkan atau isi 0 untuk sertifikat permanen (tanpa masa berlaku)</p>
          </div>
        </CardContent>
      </Card>

      {/* Background Image Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Background Gambar
          </CardTitle>
          <CardDescription>Upload gambar background untuk sertifikat (opsional)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {template.backgroundImage ? (
            <div className="relative rounded-lg overflow-hidden border border-slate-200">
              <img
                src={template.backgroundImage}
                alt="Background"
                className="w-full h-48 object-cover"
              />
              <button
                onClick={() => setTemplate({ ...template, backgroundImage: "" })}
                className="absolute top-2 right-2 p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-2 left-2">
                <span className="px-2 py-1 rounded-lg bg-green-500 text-white text-xs font-medium flex items-center gap-1">
                  Background Aktif
                </span>
              </div>
            </div>
          ) : (
            <div
              onClick={async () => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;

                  if (file.size > 5 * 1024 * 1024) {
                    setMessage({ type: "error", text: "Ukuran file maksimal 5MB" });
                    return;
                  }

                  setUploading(true);
                  try {
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("folder", "certificates/backgrounds/");

                    const res = await fetch("/api/upload", {
                      method: "POST",
                      body: formData,
                    });
                    const data = await res.json();

                    if (data.success) {
                      setTemplate({ ...template, backgroundImage: data.url });
                      setMessage({ type: "success", text: "Background berhasil diupload" });
                    } else {
                      setMessage({ type: "error", text: data.message || "Upload gagal" });
                    }
                  } catch {
                    setMessage({ type: "error", text: "Upload gagal" });
                  } finally {
                    setUploading(false);
                  }
                };
                input.click();
              }}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                uploading
                  ? "border-blue-400 bg-blue-50"
                  : "border-slate-300 hover:border-blue-400 hover:bg-blue-50"
              }`}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-slate-600">Mengupload...</p>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-700">
                    Klik untuk upload background
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    JPG, PNG, WebP • Maks 5MB
                  </p>
                </>
              )}
            </div>
          )}
          <p className="text-xs text-slate-500">
            Background gambar akan menggantikan warna latar. Disarankan menggunakan gambar landscape dengan resolusi minimal 1280x720.
          </p>
          <a
            href="/api/user/certificate-template/download-default"
            download="default-certificate-background.jpg"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mt-2"
          >
            <Download className="h-4 w-4" />
            Download template background default
          </a>
        </CardContent>
      </Card>

      {/* Logo Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Logo
          </CardTitle>
          <CardDescription>Tampilkan logo di sertifikat</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={template.showLogo ?? true}
                onChange={(e) => setTemplate({ ...template, showLogo: e.target.checked })}
                className="w-4 h-4"
              />
              <span>Tampilkan Logo</span>
            </label>
          </div>
          {template.showLogo && (
            <>
              {template.logoUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-white">
                  <img
                    src={template.logoUrl}
                    alt="Logo"
                    className="h-32 mx-auto object-contain p-4"
                  />
                  <button
                    onClick={() => setTemplate({ ...template, logoUrl: "" })}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-1 rounded-lg bg-green-500 text-white text-xs font-medium flex items-center gap-1">
                      Logo Aktif
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  onClick={async () => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (!file) return;

                      if (file.size > 2 * 1024 * 1024) {
                        setMessage({ type: "error", text: "Ukuran file maksimal 2MB" });
                        return;
                      }

                      setUploading(true);
                      try {
                        const formData = new FormData();
                        formData.append("file", file);
                        formData.append("folder", "certificates/logos/");

                        const res = await fetch("/api/upload", {
                          method: "POST",
                          body: formData,
                        });
                        const data = await res.json();

                        if (data.success) {
                          setTemplate({ ...template, logoUrl: data.url });
                          setMessage({ type: "success", text: "Logo berhasil diupload" });
                        } else {
                          setMessage({ type: "error", text: data.message || "Upload gagal" });
                        }
                      } catch {
                        setMessage({ type: "error", text: "Upload gagal" });
                      } finally {
                        setUploading(false);
                      }
                    };
                    input.click();
                  }}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    uploading
                      ? "border-blue-400 bg-blue-50"
                      : "border-slate-300 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-slate-600">Mengupload...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-700">
                        Klik untuk upload logo
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        PNG, JPG, WebP • Maks 2MB
                      </p>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}