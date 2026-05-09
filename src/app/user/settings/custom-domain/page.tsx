"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Check, X, ExternalLink, Copy, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CustomDomainPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [data, setData] = useState({
    customDomain: "",
    domainVerified: false,
    domainVerifiedAt: null as string | null,
    canSetCustomDomain: false,
  });
  const [verificationInfo, setVerificationInfo] = useState<{
    recordType: string;
    name: string;
    value: string;
    instructions: string[];
  } | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchDomainInfo();
  }, []);

  const fetchDomainInfo = async () => {
    try {
      const res = await fetch("/api/user/custom-domain");
      const result = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setHasAccess(false);
        }
        setMessage({ type: "error", text: result.error || "Failed to fetch" });
        return;
      }

      setData(result);
      setHasAccess(true);
    } catch (error) {
      console.error("Failed to fetch domain info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!data.customDomain) {
      setMessage({ type: "error", text: "Domain harus diisi" });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/custom-domain", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customDomain: data.customDomain }),
      });

      const result = await res.json();

      if (result.success) {
        setMessage({ type: "success", text: "Domain berhasil dikonfigurasi. Silakan tambahkan record DNS untuk verifikasi." });
        setVerificationInfo(result.verification);
      } else {
        setMessage({ type: "error", text: result.error || "Gagal menyimpan" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Terjadi kesalahan" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/custom-domain/verify", { method: "POST" });
      const result = await res.json();

      if (result.success && result.verified) {
        setMessage({ type: "success", text: "Domain berhasil diverifikasi!" });
        setData({ ...data, domainVerified: true, domainVerifiedAt: new Date().toISOString() });
        setVerificationInfo(null);
      } else {
        setMessage({ type: "error", text: result.message || "Verifikasi gagal" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Terjadi kesalahan saat verifikasi" });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm("Yakin ingin menghapus custom domain?")) return;

    try {
      const res = await fetch("/api/user/custom-domain", { method: "DELETE" });
      const result = await res.json();

      if (result.success) {
        setMessage({ type: "success", text: "Custom domain berhasil dihapus" });
        setData({
          ...data,
          customDomain: "",
          domainVerified: false,
          domainVerifiedAt: null,
        });
        setVerificationInfo(null);
      }
    } catch (error) {
      setMessage({ type: "error", text: "Gagal menghapus" });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: "success", text: "Disalin ke clipboard" });
  };

  if (isLoading) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-48 bg-slate-200 rounded" />
        </div>
      </main>
    );
  }

  if (!hasAccess) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">Upgrade Diperlukan</CardTitle>
            <CardDescription className="text-amber-700">
              Custom domain memerlukan langganan BUSINESS.
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
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Custom Domain</h1>
        <p className="text-slate-500">Gunakan domain sendiri untuk microsite Anda</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* Current Status */}
      {data.customDomain && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Domain Saat Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">{data.customDomain}</p>
                <div className="flex items-center gap-2 mt-1">
                  {data.domainVerified ? (
                    <>
                      <Badge className="bg-green-100 text-green-700">
                        <Check className="h-3 w-3 mr-1" />
                        Terverifikasi
                      </Badge>
                      {data.domainVerifiedAt && (
                        <span className="text-xs text-slate-400">
                          sejak {new Date(data.domainVerifiedAt).toLocaleDateString("id-ID")}
                        </span>
                      )}
                    </>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Belum Terverifikasi
                    </Badge>
                  )}
                </div>
              </div>
              {!data.domainVerified && (
                <Button onClick={handleVerify} disabled={isVerifying}>
                  {isVerifying ? "Memverifikasi..." : "Verifikasi"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Instructions */}
      {verificationInfo && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Tambahkan Record DNS</CardTitle>
            <CardDescription className="text-blue-700">
              Tambahkan record berikut untuk memverifikasi kepemilikan domain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-white rounded-lg p-4 font-mono text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Type:</span>
                <span className="font-semibold">{verificationInfo.recordType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Name:</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{verificationInfo.name}</span>
                  <button onClick={() => copyToClipboard(verificationInfo.name)} className="text-slate-400 hover:text-slate-600">
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Value:</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs break-all">{verificationInfo.value}</span>
                  <button onClick={() => copyToClipboard(verificationInfo.value)} className="text-slate-400 hover:text-slate-600">
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="text-sm text-blue-700 space-y-1">
              {verificationInfo.instructions.map((instruction, i) => (
                <p key={i}>{instruction}</p>
              ))}
            </div>

            <Button onClick={handleVerify} disabled={isVerifying} className="mt-2">
              {isVerifying ? "Memverifikasi..." : "Verifikasi Sekarang"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Change Domain */}
      <Card>
        <CardHeader>
          <CardTitle>Konfigurasi Domain</CardTitle>
          <CardDescription>
            Masukkan domain yang ingin digunakan (contoh: mysite.com)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="customDomain">Domain</Label>
            <div className="flex gap-2">
              <Input
                id="customDomain"
                value={data.customDomain}
                onChange={(e) => setData({ ...data, customDomain: e.target.value.replace(/https?:\/\//, '') })}
                placeholder="mysite.com"
                disabled={data.domainVerified}
              />
              {data.domainVerified ? (
                <Button variant="outline" onClick={handleRemove} className="text-red-500">
                  <X className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </Button>
              )}
            </div>
          </div>

          {!data.domainVerified && (
            <p className="text-sm text-slate-500">
              Setelah domain berhasil diverifikasi, microsite Anda dapat diakses melalui {data.customDomain || "[domain]"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
        <p className="font-medium mb-2">Informasi:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Custom domain hanya tersedia untuk paket BUSINESS</li>
          <li>Domain harus memiliki TXT record untuk verifikasi</li>
          <li>DNS propagation bisa memakan waktu hingga 24 jam</li>
          <li>Point domain Anda ke server TOEFLLYNK setelah verifikasi</li>
        </ul>
      </div>
    </main>
  );
}