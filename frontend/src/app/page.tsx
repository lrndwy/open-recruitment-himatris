"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { api } from "@/lib/api";
import type { RegistrationPeriod } from "@/types";

type PubDivision = { id: string; name: string; description: string };

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

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

export default function LandingPage() {
  const [period, setPeriod] = useState<RegistrationPeriod | null>(null);
  const [divisions, setDivisions] = useState<PubDivision[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [reg, div] = await Promise.all([
          api.get<RegistrationPeriod | null>("/public/registration"),
          api.get<PubDivision[]>("/public/divisions"),
        ]);
        setPeriod(reg.data ?? null);
        setDivisions(div.data ?? []);
      } catch {
        // biarkan state default
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const isOpen = period?.status === "OPEN";
  const statusLabel = !period
    ? "Belum ada periode pendaftaran"
    : period.status === "OPEN"
      ? "Pendaftaran Dibuka"
      : period.status === "UPCOMING"
        ? "Pendaftaran Belum Dibuka"
        : "Pendaftaran Telah Ditutup";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero + status */}
        <section className="mx-auto w-full max-w-5xl px-6 sm:px-8">
          <div className="grid gap-12 py-20 sm:py-28 lg:grid-cols-2 lg:gap-16 lg:py-32">
            <div className="flex flex-col items-start space-y-7">
              <Badge
                variant="outline"
                className="gap-2 rounded-full border-foreground/10 px-4 py-1.5 text-xs font-medium tracking-wide text-foreground/70"
              >
                <span
                  className={`inline-flex size-1.5 rounded-full ${isOpen ? "animate-pulse bg-accent" : "bg-foreground/40"}`}
                />
                {statusLabel}
              </Badge>
              <h1 className="font-heading text-5xl font-semibold leading-[1.08] tracking-tight md:text-6xl lg:text-7xl">
                Open Recruitment <span className="block italic text-accent">HIMATRIS</span>
              </h1>
              <p className="max-w-md text-base leading-relaxed text-foreground/60">
                Bergabunglah dengan Himpunan Mahasiswa Komputer dan Bisnis.
                Kembangkan dirimu bersama kami melalui kegiatan organisasi,
                kajian, dan kegiatan sosial.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  asChild={isOpen}
                  disabled={isLoading || !isOpen}
                  className="cursor-pointer rounded-full bg-foreground px-8 font-medium text-background hover:bg-foreground/90"
                >
                  {isOpen ? (
                    <Link href="/register">Daftar Sekarang</Link>
                  ) : (
                    <span>{statusLabel}</span>
                  )}
                </Button>
                <Button 
                  size="lg" 
                  variant="ghost" 
                  asChild 
                  className="cursor-pointer rounded-full border border-foreground/10 font-medium hover:border-foreground/20 hover:bg-foreground/5"
                >
                  <Link href="/result">Cek Hasil</Link>
                </Button>
              </div>
            </div>
            <div className="flex flex-col justify-center lg:border-l lg:border-foreground/10 lg:pl-16">
              <p className="rule-label">Status Pendaftaran</p>
              {isLoading ? (
                <div className="mt-6 space-y-3">
                  <Skeleton className="h-7 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : period ? (
                <div className="mt-6 space-y-4">
                  <p className="font-heading text-2xl font-semibold tracking-tight">{period.name}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={isOpen ? "default" : "secondary"}
                      className="rounded-full font-medium"
                    >
                      {statusLabel}
                    </Badge>
                    {isOpen && (
                      <span className="text-sm tabular-nums text-foreground/50">
                        Berakhir dalam {daysUntil(period.end_at)} hari
                      </span>
                    )}
                    {period.status === "UPCOMING" && (
                      <span className="text-sm tabular-nums text-foreground/50">
                        Dibuka dalam {daysUntil(period.start_at)} hari
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground/50">
                    {new Date(period.start_at).toLocaleDateString("id-ID", { dateStyle: "long" })} —{" "}
                    {new Date(period.end_at).toLocaleDateString("id-ID", { dateStyle: "long" })}
                  </p>
                </div>
              ) : (
                <p className="mt-6 text-foreground/50">{statusLabel}</p>
              )}
            </div>
          </div>
        </section>
        {/* Alur pendaftaran */}
        <section className="mx-auto w-full max-w-5xl px-6 py-24 sm:px-8 sm:py-32">
          <p className="rule-label text-foreground/50">Alur Pendaftaran</p>
          <div className="mt-12 grid gap-12 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="group space-y-4 border-t border-foreground/10 pt-8">
                <p className="font-heading text-5xl font-light tabular-nums text-accent">{s.n}</p>
                <h3 className="font-heading text-xl font-semibold tracking-tight">{s.title}</h3>
                <p className="text-sm leading-relaxed text-foreground/60">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
        {/* Divisi */}
        <section className="mx-auto w-full max-w-5xl px-6 py-24 sm:px-8 sm:py-32">
          <p className="rule-label text-foreground/50">Divisi</p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {divisions.map((d) => (
              <Card
                key={d.id}
                className="group border-foreground/10 bg-card transition-colors hover:border-accent/20 hover:bg-card/80"
              >
                <CardHeader className="pb-4">
                  <CardTitle className="font-heading text-xl font-semibold tracking-tight">
                    {d.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-foreground/60">{d.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {divisions.length === 0 && !isLoading && (
            <p className="mt-6 text-sm text-foreground/60">
              Daftar divisi belum tersedia.
            </p>
          )}
        </section>

        {/* CTA akhir */}
        <section className="border-t border-foreground/10">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 py-32 text-center sm:px-8">
            <h2 className="font-heading text-4xl font-semibold tracking-tight md:text-5xl">
              Sudah mendaftar?
            </h2>
            <p className="mt-4 text-base text-foreground/60">
              Cek hasil seleksi menggunakan NIM kamu.
            </p>
            <Button
              variant="outline"
              size="lg"
              className="mt-8 cursor-pointer rounded-full border-foreground/20 font-medium hover:border-foreground/40 hover:bg-foreground/5"
              asChild
            >
              <Link href="/result">Cek Hasil Seleksi</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
