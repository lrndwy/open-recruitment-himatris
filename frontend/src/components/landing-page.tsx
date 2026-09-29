"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  GraduationCap,
  Megaphone,
  Palette,
  Sparkles,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SmoothScroll } from "@/components/smooth-scroll";
import { api, storageUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { RegistrationPeriod, SiteSettings } from "@/types";

gsap.registerPlugin(ScrollTrigger);

type PubDivision = {
  id: string;
  name: string;
  description: string;
  image_path: string | null;
};

/*
  Foto contoh dipakai hanya kalau admin belum mengunggah foto hero
  (Pengaturan > Landing Page). Ganti/unggah lewat halaman admin, bukan di sini.
  ponytail: foto stok eksternal, cukup sampai foto asli HIMATRIS diunggah.
*/
const HERO_FALLBACK_PHOTO = "https://picsum.photos/seed/himatris-oprec-hero/1920/1280";

const STEPS = [
  {
    n: "01",
    title: "Isi formulir & unggah CV",
    desc: "Lengkapi data diri dan pilih divisi yang kamu tuju.",
  },
  {
    n: "02",
    title: "Proses seleksi",
    desc: "Tim kami menyeleksi setiap pendaftar dengan cermat.",
  },
  {
    n: "03",
    title: "Cek hasil via NIM",
    desc: "Pengumuman hasil seleksi tersedia di halaman Cek Hasil.",
  },
];

const DIVISION_ICONS = [
  { keys: ["kastrat", "kajian"], Icon: BookOpenCheck },
  { keys: ["psdm"], Icon: UsersRound },
  { keys: ["humas", "kominfo"], Icon: Megaphone },
  { keys: ["mikat", "bakat"], Icon: Palette },
  { keys: ["ekraf", "wirausaha"], Icon: TrendingUp },
  { keys: ["prodi"], Icon: GraduationCap },
];

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export function LandingPage() {
  const [period, setPeriod] = useState<RegistrationPeriod | null>(null);
  const [divisions, setDivisions] = useState<PubDivision[]>([]);
  const [heroPath, setHeroPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const [reg, div, settings] = await Promise.all([
          api.get<RegistrationPeriod | null>("/public/registration"),
          api.get<PubDivision[]>("/public/divisions"),
          api.get<SiteSettings>("/public/settings"),
        ]);
        setPeriod(reg.data ?? null);
        setDivisions(div.data ?? []);
        setHeroPath(settings.data?.landing_hero_path ?? null);
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Animasi masuk hero + reveal section. Semua efek transform/opacity saja,
  // dan dilewati total kalau user memilih reduced motion.
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap
          .timeline({ defaults: { ease: "power3.out", duration: 0.7 } })
          .from("[data-hero-pill]", { y: 16, autoAlpha: 0 })
          .from("[data-hero-title] span", { y: 40, autoAlpha: 0, stagger: 0.12 }, "-=0.45")
          .from("[data-hero-sub]", { y: 16, autoAlpha: 0 }, "-=0.4")
          .from("[data-hero-cta]", { y: 12, autoAlpha: 0 }, "-=0.35")
          .from("[data-hero-stat]", { y: 16, autoAlpha: 0, stagger: 0.08 }, "-=0.3");

        // Foto hero bergerak pelan saat halaman di-scroll. Sengaja hanya
        // translate (tanpa scale) dan hanya di layar >=768px: menggerakkan
        // lapisan sebesar ini di HP bikin scroll terasa patah-patah.
        mm.add(
          "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
          () => {
            gsap.to("[data-hero-photo]", {
              yPercent: 7,
              ease: "none",
              scrollTrigger: {
                trigger: "[data-hero-section]",
                start: "top top",
                end: "bottom top",
                scrub: true,
              },
            });
          },
        );

        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.from(el, {
            y: 28,
            autoAlpha: 0,
            duration: 0.7,
            scrollTrigger: { trigger: el, start: "top 85%" },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-reveal-group]").forEach((group) => {
          gsap.from(group.children, {
            y: 24,
            autoAlpha: 0,
            duration: 0.6,
            stagger: 0.1,
            scrollTrigger: { trigger: group, start: "top 85%" },
          });
        });
      }, mainRef);

      return () => ctx.revert();
    });

    return () => mm.revert();
  }, []);

  // Kartu divisi baru ada setelah data datang, jadi dianimasikan terpisah.
  useEffect(() => {
    if (divisions.length === 0) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap.from("[data-division-card]", {
          y: 26,
          autoAlpha: 0,
          duration: 0.6,
          stagger: 0.08,
          scrollTrigger: { trigger: "[data-division-grid]", start: "top 85%" },
        });
      }, mainRef);

      return () => ctx.revert();
    });

    return () => mm.revert();
  }, [divisions]);

  const isOpen = period?.status === "OPEN";
  const isUpcoming = period?.status === "UPCOMING";
  const statusLabel = !period
    ? "Belum ada periode pendaftaran"
    : isOpen
      ? "Pendaftaran dibuka"
      : isUpcoming
        ? "Pendaftaran belum dibuka"
        : "Pendaftaran telah ditutup";
  const daysLeft = period
    ? daysUntil(isUpcoming ? period.start_at : period.end_at)
    : 0;

  return (
    <div className="dark flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <SmoothScroll />
      <SiteHeader />

      <main ref={mainRef} className="flex-1">
        {/* Hero */}
        <section data-hero-section className="relative isolate overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            data-hero-photo
            src={heroPath ? storageUrl(heroPath) : HERO_FALLBACK_PHOTO}
            alt=""
            aria-hidden
            width={1920}
            height={1280}
            fetchPriority="high"
            className="absolute inset-x-0 -top-[8%] -z-10 h-[116%] w-full object-cover will-change-transform"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-zinc-950 via-zinc-950/85 to-zinc-950/35" />

          <div className="mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col justify-end px-5 pb-14 pt-24 sm:px-6 sm:pb-20">
            <p
              data-hero-pill
              className="flex w-fit items-center gap-2.5 rounded-full border border-white/15 bg-zinc-950/70 px-3.5 py-1.5 text-sm text-zinc-100"
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  isOpen ? "bg-accent" : "bg-zinc-500",
                )}
              />
              {statusLabel}
            </p>

            <h1
              data-hero-title
              className="mt-6 font-heading text-[2.65rem] leading-[1.05] font-semibold tracking-tight sm:text-6xl lg:text-7xl"
            >
              <span className="block">Open Recruitment</span>
              <span className="block text-accent">HIMATRIS</span>
            </h1>

            <p
              data-hero-sub
              className="mt-5 max-w-[46ch] text-base leading-relaxed text-zinc-300 sm:text-lg"
            >
              Himpunan Mahasiswa Komputer dan Bisnis membuka pendaftaran anggota
              baru. Kembangkan dirimu lewat kajian, proyek, dan kegiatan sosial.
            </p>

            <div data-hero-cta className="mt-8 flex flex-wrap items-center gap-3">
              {isOpen && (
                <Button
                  size="lg"
                  asChild
                  className="h-12 cursor-pointer rounded-full bg-white px-7 text-base font-medium text-zinc-950 transition-transform hover:bg-zinc-200 active:scale-[0.98]"
                >
                  <Link href="/register">
                    Daftar Sekarang
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              )}
              <Button
                size="lg"
                variant="ghost"
                asChild
                className="h-12 cursor-pointer rounded-full border border-white/20 px-7 text-base font-medium text-zinc-100 hover:border-white/40 hover:bg-white/10"
              >
                <Link href="/result">Cek Hasil</Link>
              </Button>
            </div>

            <dl className="mt-14 grid max-w-3xl grid-cols-1 gap-6 border-t border-white/10 pt-8 sm:grid-cols-3 sm:gap-8">
              <div data-hero-stat>
                <dt className="text-xs font-medium tracking-wide text-zinc-400">
                  Periode
                </dt>
                {isLoading ? (
                  <Skeleton className="mt-2 h-5 w-40" />
                ) : (
                  <dd className="mt-2 font-heading text-base font-medium">
                    {period?.name ?? "Belum ditentukan"}
                  </dd>
                )}
              </div>
              <div data-hero-stat>
                <dt className="text-xs font-medium tracking-wide text-zinc-400">
                  Jadwal
                </dt>
                {isLoading ? (
                  <Skeleton className="mt-2 h-5 w-48" />
                ) : (
                  <dd className="mt-2 font-heading text-base font-medium tabular-nums">
                    {period
                      ? `${new Date(period.start_at).toLocaleDateString("id-ID", { dateStyle: "long" })} sampai ${new Date(period.end_at).toLocaleDateString("id-ID", { dateStyle: "long" })}`
                      : "Menunggu pengumuman"}
                  </dd>
                )}
              </div>
              <div data-hero-stat>
                <dt className="text-xs font-medium tracking-wide text-zinc-400">
                  {isUpcoming ? "Dibuka dalam" : "Ditutup dalam"}
                </dt>
                {isLoading ? (
                  <Skeleton className="mt-2 h-5 w-24" />
                ) : (
                  <dd className="mt-2 font-heading text-base font-medium tabular-nums">
                    {period
                      ? period.status === "CLOSED"
                        ? "Periode selesai"
                        : `${daysLeft} hari`
                      : "Belum ditentukan"}
                  </dd>
                )}
              </div>
            </dl>
          </div>
        </section>

        {/* Pernyataan */}
        <section className="relative isolate overflow-hidden border-t border-white/10">
          <div className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-60" />
          <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-6 lg:py-32">
            <h2 data-reveal className="max-w-4xl font-heading text-4xl leading-[1.12] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              HIMATRIS WE ARE SUPERTEAM.
            </h2>
            <p data-reveal className="mt-6 max-w-[60ch] text-base leading-relaxed text-zinc-400">
              HIMATRIS adalah Himpunan Mahasiswa Jurusan Komputer dan Bisnis yang menaungi 5 Program Studi.
            </p>
          </div>
        </section>

        {/* Alur pendaftaran */}
        <section className="border-t border-white/10 bg-zinc-900/30">
          <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-6 lg:py-32">
            <h2 data-reveal className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Alur pendaftaran
            </h2>
            <ol data-reveal-group className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
              {STEPS.map((s, i) => (
                <li
                  key={s.n}
                  className={cn(
                    "border-t border-white/15 pt-6",
                    i === 1 && "sm:mt-10",
                    i === 2 && "sm:mt-20",
                  )}
                >
                  <span className="font-heading text-5xl font-light tabular-nums text-accent">
                    {s.n}
                  </span>
                  <h3 className="mt-4 font-heading text-lg font-semibold">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {s.desc}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Divisi */}
        <section className="border-t border-white/10">
          <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-6 lg:py-32">
            <h2 data-reveal className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Divisi Kami
            </h2>
            <p data-reveal className="mt-4 max-w-[58ch] text-base leading-relaxed text-zinc-400">
              Kami memiliki 8 divisi bergerak dengan saling berkolaborasi satu dengan yang lainnya demi keberlangsungan organisasi kami.
            </p>

            {isLoading ? (
              <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-2xl" />
                ))}
              </div>
            ) : divisions.length > 0 ? (
              <div data-division-grid className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {divisions.map((d) => {
                  const key = d.name.toLowerCase();
                  const Icon =
                    DIVISION_ICONS.find((x) =>
                      x.keys.some((k) => key.includes(k)),
                    )?.Icon ?? Sparkles;
                  return (
                    <article
                      key={d.id}
                      data-division-card
                      className={cn(
                        "relative isolate flex flex-col overflow-hidden rounded-2xl border border-white/10 p-6 transition-colors hover:border-white/25",
                        d.image_path
                          ? "min-h-[16rem] justify-end sm:min-h-[18rem]"
                          : "bg-zinc-900/50",
                      )}
                    >
                      {d.image_path && (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={storageUrl(d.image_path)}
                            alt=""
                            aria-hidden
                            width={1200}
                            height={900}
                            loading="lazy"
                            className="absolute inset-0 -z-10 size-full object-cover opacity-45"
                          />
                          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-zinc-950/20" />
                        </>
                      )}

                      <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                        <Icon className="size-5 text-accent" aria-hidden />
                      </span>
                      <h3 className="mt-5 font-heading text-lg font-semibold">
                        {d.name}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                        {d.description}
                      </p>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="mt-12 text-sm text-zinc-400">
                Daftar divisi belum tersedia. Coba muat ulang halaman ini.
              </p>
            )}

            {hasError && (
              <p className="mt-6 text-sm text-destructive">
                Sebagian data gagal dimuat. Coba muat ulang halaman ini.
              </p>
            )}
          </div>
        </section>

        {/* Ajakan terakhir */}
        <section className="border-t border-white/10 bg-zinc-900/40">
          <div data-reveal-group className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-24 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:py-32">
            <div>
              <h2 className="max-w-[20ch] font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                {isOpen
                  ? `Pendaftaran ditutup dalam ${daysLeft} hari`
                  : statusLabel}
              </h2>
              <p className="mt-5 max-w-[52ch] text-base leading-relaxed text-zinc-400">
                Siapkan data diri dan berkas pendaftaranmu sebelum mengisi
                formulir, supaya prosesnya selesai dalam sekali jalan.
              </p>
            </div>

            {isOpen ? (
              <Button
                size="lg"
                asChild
                className="h-12 w-fit cursor-pointer rounded-full bg-white px-7 text-base font-medium text-zinc-950 transition-transform hover:bg-zinc-200 active:scale-[0.98]"
              >
                <Link href="/register">
                  Daftar Sekarang
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            ) : (
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 w-fit cursor-pointer rounded-full border-white/20 bg-transparent text-base font-medium text-zinc-100 hover:border-white/40 hover:bg-white/10"
              >
                <Link href="/result">Cek Hasil</Link>
              </Button>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
