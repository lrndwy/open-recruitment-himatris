"use client";

import { useEffect, useRef, useState } from "react";
import { Hourglass, MailX, PartyPopper, SearchX } from "lucide-react";
import { gsap } from "gsap";

import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ShareResult } from "@/components/share-result";
import { SmoothScroll } from "@/components/smooth-scroll";

type ResultData = {
  nim: string;
  name: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  accepted_division?: { id: string; name: string } | null;
};

const RESULT_STYLE: Record<
  ResultData["status"],
  {
    label: string;
    icon: typeof Hourglass;
    desc: string;
    ring: string;
    iconClass: string;
  }
> = {
  PENDING: {
    label: "Menunggu Seleksi",
    icon: Hourglass,
    desc: "Pendaftaranmu sedang dalam proses seleksi. Cek kembali halaman ini nanti.",
    ring: "border-white/15 bg-white/5",
    iconClass: "text-zinc-200",
  },
  ACCEPTED: {
    label: "Diterima",
    icon: PartyPopper,
    desc: "Selamat! Kamu lolos seleksi Open Recruitment HIMATRIS.",
    ring: "border-emerald-400/30 bg-emerald-400/10",
    iconClass: "text-emerald-300",
  },
  REJECTED: {
    label: "Tidak Diterima",
    icon: MailX,
    desc: "Terima kasih sudah mendaftar. Masih banyak kesempatan lain untuk bertumbuh.",
    ring: "border-rose-400/30 bg-rose-400/10",
    iconClass: "text-rose-300",
  },
};

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function ResultPage() {
  const [nim, setNim] = useState("");
  const [result, setResult] = useState<ResultData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const introRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);

  // Animasi masuk untuk judul + form.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-intro]", {
        y: 20,
        autoAlpha: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.08,
      });
    }, introRef);
    return () => ctx.revert();
  }, []);

  // Animasi saat kartu hasil muncul: kartu dulu, lalu isinya menyusul.
  useEffect(() => {
    if (!result || prefersReducedMotion() || !cardRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(cardRef.current, {
        y: 26,
        scale: 0.98,
        autoAlpha: 0,
        duration: 0.55,
        ease: "power3.out",
      });
      gsap.from("[data-result-item]", {
        y: 16,
        autoAlpha: 0,
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.07,
        delay: 0.14,
      });
    }, cardRef);
    return () => ctx.revert();
  }, [result]);

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

  const view = result ? RESULT_STYLE[result.status] : null;

  return (
    <div className="dark flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <SmoothScroll />
      <SiteHeader />

      <main className="relative isolate flex-1 overflow-hidden">
        <div className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-50" />

        <div className="mx-auto grid w-full max-w-6xl gap-14 px-5 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-20 lg:py-28">
          {/* Kolom kiri: judul + form */}
          <div ref={introRef}>
            <h1
              data-intro
              className="font-heading text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl"
            >
              Cek Hasil
              <span className="block text-accent">Seleksi</span>
            </h1>
            <p data-intro className="mt-5 max-w-[44ch] text-base leading-relaxed text-zinc-400">
              Masukkan NIM yang kamu gunakan saat mendaftar untuk melihat status
              seleksimu.
            </p>

            <form data-intro onSubmit={handleSubmit} className="mt-10 max-w-md space-y-3">
              <Label htmlFor="nim" className="text-zinc-300">
                NIM
              </Label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  id="nim"
                  name="nim"
                  required
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Contoh: 260209004"
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  className="h-12 rounded-full border-white/15 bg-zinc-900 px-5 text-base text-zinc-100 placeholder:text-zinc-400 focus-visible:border-white/30"
                />
                <Button
                  type="submit"
                  disabled={loading || !nim.trim()}
                  className="h-12 shrink-0 cursor-pointer rounded-full bg-white px-7 text-base font-medium text-zinc-950 transition-transform hover:bg-zinc-200 active:scale-[0.98]"
                >
                  {loading ? "Mengecek" : "Cek Hasil"}
                </Button>
              </div>
              <p className="text-xs text-zinc-400">
                NIM tidak boleh salah. Hubungi pengurus kalau NIM kamu tidak
                ditemukan.
              </p>
            </form>
          </div>

          {/* Kolom kanan: panel hasil */}
          <div className="min-h-[22rem]">
            {loading ? (
              <Skeleton className="h-72 w-full rounded-2xl" />
            ) : notFound ? (
              <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 px-6 text-center">
                <SearchX className="size-8 text-zinc-500" strokeWidth={1.5} aria-hidden />
                <p className="font-medium">Data pendaftar tidak ditemukan</p>
                <p className="max-w-[38ch] text-sm text-zinc-400">
                  Pastikan NIM yang dimasukkan sama dengan yang kamu pakai saat
                  mendaftar.
                </p>
              </div>
            ) : result && view ? (
              <article
                ref={cardRef}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 p-7 sm:p-9"
              >
                <div data-result-item className="flex items-center gap-3">
                  <span
                    className={`flex size-12 items-center justify-center rounded-full border ${view.ring}`}
                  >
                    <view.icon className={`size-6 ${view.iconClass}`} strokeWidth={1.5} aria-hidden />
                  </span>
                  <span className="text-sm text-zinc-400">Status seleksi</span>
                </div>

                <h2
                  data-result-item
                  className="mt-6 font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl"
                >
                  {view.label}
                </h2>
                <p data-result-item className="mt-3 max-w-[48ch] text-sm leading-relaxed text-zinc-400">
                  {view.desc}
                </p>

                {result.status === "ACCEPTED" && (
                  <>
                    <div
                      data-result-item
                      className="mt-8 rounded-xl border border-emerald-400/25 bg-emerald-400/5 p-6"
                    >
                      <p className="text-xs font-medium tracking-wide text-emerald-200/80">
                        Diterima di divisi
                      </p>
                      <p className="mt-2 font-heading text-2xl leading-tight font-semibold text-emerald-50 sm:text-3xl">
                        {result.accepted_division?.name ?? "Belum ditetapkan"}
                      </p>
                      {!result.accepted_division && (
                        <p className="mt-2 text-sm text-emerald-100/70">
                          Divisi akan diumumkan menyusul.
                        </p>
                      )}
                    </div>

                    <div data-result-item>
                      <ShareResult
                        nim={result.nim}
                        division={result.accepted_division?.name}
                      />
                    </div>
                  </>
                )}

                <dl
                  data-result-item
                  className="mt-8 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-2"
                >
                  <div>
                    <dt className="text-xs font-medium tracking-wide text-zinc-400">
                      Nama
                    </dt>
                    <dd className="mt-1 font-heading text-base font-medium">
                      {result.name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium tracking-wide text-zinc-400">
                      NIM
                    </dt>
                    <dd className="mt-1 font-heading text-base font-medium tabular-nums">
                      {result.nim}
                    </dd>
                  </div>
                </dl>
              </article>
            ) : (
              <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 px-6 text-center">
                <Hourglass className="size-8 text-zinc-500" strokeWidth={1.5} aria-hidden />
                <p className="font-medium">Hasil seleksi muncul di sini</p>
                <p className="max-w-[38ch] text-sm text-zinc-400">
                  Masukkan NIM lalu tekan Cek Hasil untuk melihat status seleksimu.
                </p>
              </div>
            )}

            {error && (
              <p className="mt-4 text-sm text-rose-300" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
