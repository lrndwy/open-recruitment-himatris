"use client";

import { useEffect, useState } from "react";
import { Images } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api, ApiError, storageUrl } from "@/lib/api";
import type { SiteSettings } from "@/types";

const RECOMMENDED =
  "Disarankan JPG/PNG/WEBP lanskap, maksimal 8 MB. Gambar otomatis dikompres dan diperkecil ke lebar 1920 px.";

export default function LandingSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>();
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .get<SiteSettings>("/public/settings")
      .then((res) => {
        if (!cancelled) setSettings(res.data);
      })
      .catch(() => {
        if (!cancelled) setError("Pengaturan gagal dimuat. Coba muat ulang halaman.");
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  async function handleUpload(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    const body = new FormData();
    body.append("image", file);
    try {
      await api.put("/admin/landing-hero", body);
      setVersion((v) => v + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Terjadi kesalahan.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Hapus foto background landing page?")) return;
    setBusy(true);
    setError("");
    try {
      await api.delete("/admin/landing-hero");
      setVersion((v) => v + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Terjadi kesalahan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Landing Page</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Foto background bagian paling atas halaman depan. Unggah gambar
          beresolusi besar karena akan dipakai penuh layar.
        </p>
      </div>

      {settings?.landing_hero_path ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={storageUrl(settings.landing_hero_path)}
          alt="Foto background landing page saat ini"
          className="aspect-video w-full rounded-lg border object-cover"
        />
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-muted-foreground">
          <Images className="size-6" aria-hidden />
          <p className="text-sm">Belum ada foto, landing page memakai foto contoh.</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild disabled={busy}>
          <label htmlFor="landing-hero" className="cursor-pointer">
            {settings?.landing_hero_path ? "Ganti Foto" : "Unggah Foto"}
          </label>
        </Button>
        <input
          id="landing-hero"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => {
            handleUpload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {settings?.landing_hero_path && (
          <Button variant="outline" disabled={busy} onClick={handleDelete}>
            Hapus Foto
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">{RECOMMENDED}</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
