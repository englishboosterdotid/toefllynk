"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Eye, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface MicrositeSettings {
  id: string;
  customHeaderHtml: string | null;
  showDefaultHeader: boolean;
  customFooterHtml: string | null;
  showDefaultFooter: boolean;
  footerText: string | null;
  removeLynkLogo: boolean;
  showPoweredBy: boolean;
  socialInstagram: string | null;
  socialFacebook: string | null;
  socialTwitter: string | null;
  socialYoutube: string | null;
  socialTiktok: string | null;
  socialLinkedin: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
}

interface AccessInfo {
  canCustomizeFooterHeader: boolean;
  canRemoveLynkLogo: boolean;
  currentTier: string;
}

export default function MicrositeSettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [access, setAccess] = useState<AccessInfo | null>(null);
  const [settings, setSettings] = useState<Partial<MicrositeSettings>>({
    showDefaultHeader: true,
    showDefaultFooter: true,
    removeLynkLogo: false,
    showPoweredBy: true,
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/user/microsite-settings");
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setAccess({ canCustomizeFooterHeader: false, canRemoveLynkLogo: false, currentTier: "FREE" });
        }
        return;
      }

      setAccess(data.access);
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/microsite-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: "Pengaturan berhasil disimpan" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: data.error || "Gagal menyimpan" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Terjadi kesalahan" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-48 bg-slate-200 rounded" />
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pengaturan Microsite</h1>
          <p className="text-slate-500">Kustomisasi tampilan microsite Anda</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* Header Customization (BUSINESS only) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Header Kustom
              </CardTitle>
              <CardDescription>Kustomisasi header microsite Anda</CardDescription>
            </div>
            {access && !access.canCustomizeFooterHeader && (
              <Badge className="bg-amber-100 text-amber-700">BUSINESS</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {access && !access.canCustomizeFooterHeader ? (
            <div className="text-center py-4 text-slate-500">
              <p>Fitur ini memerlukan paket BUSINESS</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => router.push("/user/subscription")}
              >
                Upgrade Sekarang
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showDefaultHeader ?? true}
                    onChange={(e) => setSettings({ ...settings, showDefaultHeader: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span>Tampilkan header default</span>
                </label>
              </div>

              {!settings.showDefaultHeader && (
                <div>
                  <Label htmlFor="customHeaderHtml">HTML Header Kustom</Label>
                  <Textarea
                    id="customHeaderHtml"
                    value={settings.customHeaderHtml || ""}
                    onChange={(e) => setSettings({ ...settings, customHeaderHtml: e.target.value })}
                    placeholder="<div class='custom-header'>Konten header Anda...</div>"
                    className="font-mono text-sm h-32"
                  />
                  <p className="text-xs text-slate-400 mt-1">Gunakan HTML untuk kustomisasi lanjutan</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Footer Customization (BUSINESS only) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Footer & Branding</CardTitle>
              <CardDescription>Kustomisasi footer dan branding microsite</CardDescription>
            </div>
            {access && !access.canCustomizeFooterHeader && (
              <Badge className="bg-amber-100 text-amber-700">BUSINESS</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {access && !access.canCustomizeFooterHeader ? (
            <div className="text-center py-4 text-slate-500">
              <p>Fitur ini memerlukan paket BUSINESS</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => router.push("/user/subscription")}
              >
                Upgrade Sekarang
              </Button>
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="footerText">Teks Footer</Label>
                <Textarea
                  id="footerText"
                  value={settings.footerText || ""}
                  onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                  placeholder="© 2026 Nama Anda. All rights reserved."
                  className="h-20"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showDefaultFooter ?? true}
                    onChange={(e) => setSettings({ ...settings, showDefaultFooter: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span>Tampilkan footer default</span>
                </label>
              </div>

              {!settings.showDefaultFooter && (
                <div>
                  <Label htmlFor="customFooterHtml">HTML Footer Kustom</Label>
                  <Textarea
                    id="customFooterHtml"
                    value={settings.customFooterHtml || ""}
                    onChange={(e) => setSettings({ ...settings, customFooterHtml: e.target.value })}
                    placeholder="<div class='custom-footer'>Konten footer Anda...</div>"
                    className="font-mono text-sm h-32"
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Remove Lynk Logo (BUSINESS only) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Hapus Branding TOEFLLYNK</CardTitle>
              <CardDescription>Sembunyikan logo dan attribution TOEFLLYNK</CardDescription>
            </div>
            {access && !access.canRemoveLynkLogo && (
              <Badge className="bg-amber-100 text-amber-700">BUSINESS</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {access && !access.canRemoveLynkLogo ? (
            <div className="text-center py-4 text-slate-500">
              <p>Fitur ini memerlukan paket BUSINESS</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => router.push("/user/subscription")}
              >
                Upgrade Sekarang
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer p-4 border rounded-lg hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={settings.removeLynkLogo ?? false}
                  onChange={(e) => setSettings({ ...settings, removeLynkLogo: e.target.checked })}
                  className="w-5 h-5"
                />
                <div>
                  <p className="font-medium">Hapus Logo TOEFLLYNK</p>
                  <p className="text-sm text-slate-500">Sembunyikan logo "Powered by TOEFLLYNK" dari microsite</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-4 border rounded-lg hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={settings.showPoweredBy ?? true}
                  onChange={(e) => setSettings({ ...settings, showPoweredBy: e.target.checked })}
                  className="w-5 h-5"
                />
                <div>
                  <p className="font-medium">Tampilkan Attribution</p>
                  <p className="text-sm text-slate-500">Tampilkan text "Powered by TOEFLLYNK"</p>
                </div>
              </label>
            </div>
          )}
        </CardContent>
      </Card>

          </main>
  );
}