"use client";

import { useState } from "react";
import { Hourglass, MailX, PartyPopper, SearchX } from "lucide-react";

import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

type ResultData = {
  nim: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  accepted_division?: { id: string; name: string } | null;
};

const RESULT_LABEL: Record<ResultData["status"], string> = {
  PENDING: "Menunggu Seleksi",
  ACCEPTED: "Diterima",
  REJECTED: "Tidak Diterima",
};

const RESULT_STYLE: Record<
  ResultData["status"],
  {
    variant: "secondary" | "default" | "destructive";
    icon: typeof Hourglass;
    iconClass: string;
    desc: string;
  }
> = {
  PENDING: {
    variant: "secondary",
    icon: Hourglass,
    iconClass: "size-12 text-foreground",
    desc: "Pendaftaranmu sedang dalam proses seleksi.",
  },
  ACCEPTED: {
    variant: "default",
    icon: PartyPopper,
    iconClass: "size-12 text-green-600",
    desc: "Selamat! Kamu diterima di HIMATRIS.",
  },
  REJECTED: {
    variant: "destructive",
    icon: MailX,
    iconClass: "size-12 text-destructive",
    desc: "Terima kasih sudah mendaftar. Jangan berputus asa!",
  },
};

export default function ResultPage() {
  const [nim, setNim] = useState("");
  const [result, setResult] = useState<ResultData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotFound(false);
    setResult(null);
    setLoading(true);
    try {
      const res = await api.get<ResultData>(`/public/result?nim=${encodeURIComponent(nim.trim())}`);
      setResult(res.data ?? null);
    } catch (err) {
      if (err instanceof ApiError && err.code === "APPLICANT_NOT_FOUND") {
        setNotFound(true);
      } else {
        setError("Terjadi kesalahan. Coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <h1 className="font-heading text-4xl font-medium tracking-tight">
            Cek Hasil Seleksi
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Masukkan NIM yang kamu gunakan saat mendaftar.
          </p>

          <form onSubmit={handleSubmit} className="card-outline mt-8 flex gap-2 p-3">
            <Input
              placeholder="NIM"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              required
            />
            <Button type="submit" disabled={loading || !nim.trim()} className="cursor-pointer">
              {loading ? "Mengecek..." : "Cek"}
            </Button>
          </form>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

          {notFound && (
            <div className="card-outline mt-8 flex flex-col items-center gap-2 p-8">
              <SearchX className="size-12 text-muted-foreground" strokeWidth={1.5} />
              <p className="font-medium">Data pendaftar tidak ditemukan.</p>
              <p className="text-sm text-muted-foreground">
                Periksa kembali NIM yang kamu masukkan.
              </p>
            </div>
          )}

          {result && (
            <div className="card-outline mt-8 p-8">
              {(() => {
                const style = RESULT_STYLE[result.status];
                const Icon = style.icon;
                return (
                  <>
                    <div className="flex justify-center">
                      <Icon className={style.iconClass} strokeWidth={1.5} />
                    </div>
                    <h2 className="mt-4 font-heading text-2xl font-medium">
                      {RESULT_LABEL[result.status]}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{style.desc}</p>
                    <div className="mt-4 space-y-2">
                      <Badge variant={style.variant}>{result.status}</Badge>
                      <p className="text-sm text-muted-foreground">NIM: {result.nim}</p>
                      {result.status === "ACCEPTED" && result.accepted_division && (
                        <p className="text-sm font-medium">
                          Ditempatkan di divisi: {result.accepted_division.name}
                        </p>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
