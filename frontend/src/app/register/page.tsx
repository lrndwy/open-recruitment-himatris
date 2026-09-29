"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  FileText,
  Info,
  Lock,
  UploadCloud,
} from "lucide-react";
import { gsap } from "gsap";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SmoothScroll } from "@/components/smooth-scroll";
import { api, ApiError } from "@/lib/api";
import type { Division, ProgramStudy, RegistrationPeriod } from "@/types";

const MAX_CV_SIZE = 5 * 1024 * 1024;

const REQUIREMENTS = [
  "CV berformat PDF, maksimal 5 MB",
  "Poster JPG/PNG/WEBP, maksimal 5 MB",
  "Surat persetujuan orang tua (PDF) wajib",
  "Divisi 1 dan Divisi 2 wajib dipilih",
];

type SuccessData = { nim: string; status: string };

export default function RegisterPage() {
  const [period, setPeriod] = useState<RegistrationPeriod | null>(null);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [programStudies, setProgramStudies] = useState<ProgramStudy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [programStudyId, setProgramStudyId] = useState("");
  const [division1Id, setDivision1Id] = useState("");
  const [division2Id, setDivision2Id] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvError, setCvError] = useState("");
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterError, setPosterError] = useState("");
  const [parentalConsentFile, setParentalConsentFile] = useState<File | null>(null);
  const [parentalConsentError, setParentalConsentError] = useState("");
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [portfolioError, setPortfolioError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<SuccessData | null>(null);

  const introRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const [reg, div, ps] = await Promise.all([
          api.get<RegistrationPeriod | null>("/public/registration"),
          api.get<Division[]>("/public/divisions"),
          api.get<ProgramStudy[]>("/public/program-studies"),
        ]);
        setPeriod(reg.data ?? null);
        setDivisions(div.data ?? []);
        setProgramStudies(ps.data ?? []);
      } catch {
        setError("Gagal memuat data. Silakan coba lagi.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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

  const isOpen = period?.status === "OPEN";
  const isUpcoming = period?.status === "UPCOMING";

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("id-ID", { dateStyle: "long" });
  }

  function handleCvChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setCvError("");
    if (!file) {
      setCvFile(null);
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setCvError("File harus berformat PDF.");
      e.target.value = "";
      setCvFile(null);
      return;
    }
    if (file.size > MAX_CV_SIZE) {
      setCvError("Ukuran file maksimal 5 MB.");
      e.target.value = "";
      setCvFile(null);
      return;
    }
    setCvFile(file);
  }

  function handlePosterChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPosterError("");
    if (!file) {
      setPosterFile(null);
      return;
    }
    const ext = file.name.toLowerCase().split(".").pop();
    const allowed = ["jpg", "jpeg", "png", "webp"];
    if (!ext || !allowed.includes(ext)) {
      setPosterError("File harus berformat JPG, PNG, atau WEBP.");
      e.target.value = "";
      setPosterFile(null);
      return;
    }
    if (file.size > MAX_CV_SIZE) {
      setPosterError("Ukuran file maksimal 5 MB.");
      e.target.value = "";
      setPosterFile(null);
      return;
    }
    setPosterFile(file);
  }

  function handleParentalConsentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setParentalConsentError("");
    if (!file) {
      setParentalConsentFile(null);
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setParentalConsentError("File harus berformat PDF.");
      e.target.value = "";
      setParentalConsentFile(null);
      return;
    }
    if (file.size > MAX_CV_SIZE) {
      setParentalConsentError("Ukuran file maksimal 5 MB.");
      e.target.value = "";
      setParentalConsentFile(null);
      return;
    }
    setParentalConsentFile(file);
  }

  function handlePortfolioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPortfolioError("");
    if (!file) {
      setPortfolioFile(null);
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setPortfolioError("File harus berformat PDF.");
      e.target.value = "";
      setPortfolioFile(null);
      return;
    }
    if (file.size > MAX_CV_SIZE) {
      setPortfolioError("Ukuran file maksimal 5 MB.");
      e.target.value = "";
      setPortfolioFile(null);
      return;
    }
    setPortfolioFile(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!programStudyId) {
      setError("Program Studi wajib dipilih.");
      return;
    }
    if (!division1Id) {
      setError("Divisi 1 wajib dipilih.");
      return;
    }
    if (!division2Id) {
      setError("Divisi 2 wajib dipilih.");
      return;
    }
    const form = new FormData(e.currentTarget);
    if (division2Id && division2Id === division1Id) {
      setError("Divisi 2 tidak boleh sama dengan Divisi 1.");
      return;
    }
    if (!cvFile) {
      setError("CV wajib diunggah.");
      return;
    }
    if (!posterFile) {
      setError("Poster wajib diunggah.");
      return;
    }
    if (!parentalConsentFile) {
      setError("Surat persetujuan orang tua wajib diunggah.");
      return;
    }

    const payload = new FormData();
    payload.append("name", String(form.get("name") ?? ""));
    payload.append("nim", String(form.get("nim") ?? ""));
    payload.append("class", String(form.get("class") ?? ""));
    payload.append("whatsapp", String(form.get("whatsapp") ?? ""));
    payload.append("birth_date", String(form.get("birth_date") ?? ""));
    payload.append("program_study_id", programStudyId);
    payload.append("division_1_id", division1Id);
    if (portfolioFile) {
      payload.append("portfolio", portfolioFile);
    }
    if (division2Id) {
      payload.append("division_2_id", division2Id);
    }
    payload.append("cv", cvFile);
    payload.append("poster", posterFile);
    payload.append("parental_consent", parentalConsentFile);
    setError("");
    setIsSubmitting(true);
    try {
      const res = await api.post<SuccessData>("/public/applications", payload);
      setSuccess(res.data ?? null);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "DUPLICATE_REGISTRATION") {
          setError("NIM ini sudah terdaftar. Setiap mahasiswa hanya dapat mendaftar sekali.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const fileFieldClass =
    "flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-center transition-colors hover:border-white/40 hover:bg-white/10";

  if (success) {
    return (
      <div className="dark flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
        <SmoothScroll />
        <SiteHeader />
        <main className="relative isolate flex flex-1 items-center justify-center overflow-hidden px-5 py-20">
          <div className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-50" />
          <div className="w-full max-w-md rounded-2xl border border-emerald-400/25 bg-emerald-400/5 p-8 text-center sm:p-10">
            <CheckCircle2 className="mx-auto size-12 text-emerald-300" strokeWidth={1.5} aria-hidden />
            <h1 className="mt-6 font-heading text-2xl font-semibold">Pendaftaran Berhasil</h1>
            <p className="mt-6 font-heading text-3xl tracking-tight tabular-nums">{success.nim}</p>
            <p className="mt-3 text-sm text-zinc-400">
              Status: Menunggu Seleksi. Simpan NIM ini untuk cek hasil.
            </p>
            <Button
              asChild
              className="mt-8 w-full cursor-pointer rounded-full bg-white text-zinc-950 hover:bg-zinc-200"
            >
              <Link href="/result">Cek Hasil Seleksi</Link>
            </Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="dark flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <SmoothScroll />
      <SiteHeader />

      <main className="relative isolate flex-1 overflow-hidden">
        <div className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-50" />

        <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16 lg:py-24">
          {/* Kolom kiri: judul, status periode, persyaratan */}
          <div ref={introRef}>
            <h1
              data-intro
              className="font-heading text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl"
            >
              Form
              <span className="block text-accent">Pendaftaran</span>
            </h1>

            <div data-intro className="mt-6">
              {isLoading ? (
                <p className="text-sm text-zinc-400">Memuat status pendaftaran...</p>
              ) : isOpen && period ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-medium tracking-wide text-zinc-400">Periode</p>
                  <p className="mt-1 font-heading text-base font-medium">{period.name}</p>
                  <p className="mt-2 text-sm text-zinc-400 tabular-nums">
                    {formatDate(period.start_at)} sampai {formatDate(period.end_at)}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-medium tracking-wide text-zinc-400">
                    {isUpcoming ? "Dibuka pada" : "Ditutup pada"}
                  </p>
                  <p className="mt-1 font-heading text-base font-medium tabular-nums">
                    {period
                      ? formatDate(isUpcoming ? period.start_at : period.end_at)
                      : "Belum ada periode pendaftaran"}
                  </p>
                </div>
              )}
            </div>

            <div data-intro className="mt-8">
              <p className="text-sm text-zinc-400">Persyaratan berkas</p>
              <ul className="mt-3 space-y-3 text-sm">
                {REQUIREMENTS.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <FileText className="mt-0.5 size-4 shrink-0 text-zinc-500" aria-hidden />
                    <span className="text-zinc-300">{item}</span>
                  </li>
                ))}
                <li className="flex items-start gap-3">
                  <Info className="mt-0.5 size-4 shrink-0 text-zinc-500" aria-hidden />
                  <span className="text-zinc-300">
                    Hasil seleksi diumumkan di halaman Cek Hasil
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Kolom kanan: form atau penjelasan saat pendaftaran tidak dibuka */}
          <div>
            {!isLoading && !isOpen && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center">
                <Lock className="size-8 text-zinc-500" strokeWidth={1.5} aria-hidden />
                <h2 className="font-heading text-xl font-semibold">
                  {isUpcoming
                    ? "Pendaftaran belum dibuka"
                    : period
                      ? "Pendaftaran sudah ditutup"
                      : "Belum ada periode pendaftaran"}
                </h2>
                <p className="max-w-[42ch] text-sm leading-relaxed text-zinc-400">
                  {isUpcoming && period
                    ? `Formulir pendaftaran terbuka mulai ${formatDate(period.start_at)}.`
                    : period
                      ? `Periode ${period.name} berakhir pada ${formatDate(period.end_at)}.`
                      : "Pantau halaman depan untuk informasi periode berikutnya."}
                </p>
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  <Button
                    asChild
                    variant="outline"
                    className="cursor-pointer rounded-full border-white/20 bg-transparent text-zinc-100 hover:border-white/40 hover:bg-white/10"
                  >
                    <Link href="/result">Cek Hasil</Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="cursor-pointer rounded-full text-zinc-300 hover:bg-white/10 hover:text-white"
                  >
                    <Link href="/">Kembali ke beranda</Link>
                  </Button>
                </div>
              </div>
            )}

            {isOpen && (
              <form
                onSubmit={handleSubmit}
                className="space-y-8 rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8"
              >
                <section className="space-y-5">
                  <h2 className="font-heading text-lg font-semibold">Data diri</h2>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-zinc-300">
                      Nama Lengkap
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      minLength={3}
                      maxLength={150}
                      className="h-11 border-white/15 bg-zinc-950/60 text-zinc-100 placeholder:text-zinc-500"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nim" className="text-zinc-300">
                        NIM
                      </Label>
                      <Input
                        id="nim"
                        name="nim"
                        required
                        maxLength={50}
                        className="h-11 border-white/15 bg-zinc-950/60 text-zinc-100 placeholder:text-zinc-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="class" className="text-zinc-300">
                        Kelas
                      </Label>
                      <Input
                        id="class"
                        name="class"
                        required
                        maxLength={50}
                        placeholder="TI-2A"
                        className="h-11 border-white/15 bg-zinc-950/60 text-zinc-100 placeholder:text-zinc-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp" className="text-zinc-300">
                        No. WhatsApp
                      </Label>
                      <Input
                        id="whatsapp"
                        name="whatsapp"
                        type="tel"
                        required
                        minLength={8}
                        maxLength={20}
                        placeholder="08xxxxxxxxxx"
                        pattern="[0-9+\- ]{8,20}"
                        className="h-11 border-white/15 bg-zinc-950/60 text-zinc-100 placeholder:text-zinc-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birth_date" className="text-zinc-300">
                        Tanggal Lahir
                      </Label>
                      <Input
                        id="birth_date"
                        name="birth_date"
                        type="date"
                        required
                        max={new Date().toISOString().slice(0, 10)}
                        className="h-11 border-white/15 bg-zinc-950/60 text-zinc-100"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-5 border-t border-white/10 pt-8">
                  <h2 className="font-heading text-lg font-semibold">Pilihan studi</h2>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Program Studi</Label>
                    <Select value={programStudyId} onValueChange={setProgramStudyId} required>
                      <SelectTrigger className="h-11 w-full border-white/15 bg-zinc-950/60 text-zinc-100">
                        <SelectValue placeholder="Pilih program studi" />
                      </SelectTrigger>
                      <SelectContent>
                        {programStudies.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Divisi 1</Label>
                      <Select value={division1Id} onValueChange={setDivision1Id} required>
                        <SelectTrigger className="h-11 w-full border-white/15 bg-zinc-950/60 text-zinc-100">
                          <SelectValue placeholder="Pilihan pertama" />
                        </SelectTrigger>
                        <SelectContent>
                          {divisions.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Divisi 2</Label>
                      <Select value={division2Id} onValueChange={setDivision2Id} required>
                        <SelectTrigger className="h-11 w-full border-white/15 bg-zinc-950/60 text-zinc-100">
                          <SelectValue placeholder="Pilihan kedua" />
                        </SelectTrigger>
                        <SelectContent>
                          {divisions
                            .filter((d) => d.id !== division1Id)
                            .map((d) => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                <section className="space-y-5 border-t border-white/10 pt-8">
                  <h2 className="font-heading text-lg font-semibold">Berkas pendaftaran</h2>

                  <div className="space-y-2">
                    <Label htmlFor="cv" className="text-zinc-300">
                      CV (PDF, maks 5 MB)
                    </Label>
                    <label htmlFor="cv" className={fileFieldClass}>
                      <UploadCloud className="size-7 text-zinc-500" strokeWidth={1.5} aria-hidden />
                      <span className="text-sm text-zinc-300">
                        Klik untuk unggah CV (PDF, maks 5 MB)
                      </span>
                    </label>
                    <input
                      id="cv"
                      name="cv"
                      type="file"
                      accept="application/pdf"
                      required
                      onChange={handleCvChange}
                      className="sr-only"
                    />
                    {cvFile && (
                      <p className="flex items-center gap-2 text-sm text-zinc-200">
                        <FileText className="size-4 shrink-0" aria-hidden />
                        {cvFile.name} ({(cvFile.size / 1024).toFixed(0)} KB)
                      </p>
                    )}
                    {cvError && <p className="text-sm text-rose-300">{cvError}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="poster" className="text-zinc-300">
                      Poster (JPG/PNG/WEBP, maks 5 MB)
                    </Label>
                    <label htmlFor="poster" className={fileFieldClass}>
                      <UploadCloud className="size-7 text-zinc-500" strokeWidth={1.5} aria-hidden />
                      <span className="text-sm text-zinc-300">
                        Klik untuk unggah Poster (JPG/PNG/WEBP, maks 5 MB)
                      </span>
                    </label>
                    <input
                      id="poster"
                      name="poster"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      required
                      onChange={handlePosterChange}
                      className="sr-only"
                    />
                    {posterFile && (
                      <p className="flex items-center gap-2 text-sm text-zinc-200">
                        <FileText className="size-4 shrink-0" aria-hidden />
                        {posterFile.name} ({(posterFile.size / 1024).toFixed(0)} KB)
                      </p>
                    )}
                    {posterError && <p className="text-sm text-rose-300">{posterError}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parental_consent" className="text-zinc-300">
                      Surat Persetujuan Orang Tua (PDF, maks 5 MB)
                    </Label>
                    <label htmlFor="parental_consent" className={fileFieldClass}>
                      <UploadCloud className="size-7 text-zinc-500" strokeWidth={1.5} aria-hidden />
                      <span className="text-sm text-zinc-300">
                        Klik untuk unggah Surat Persetujuan (PDF, maks 5 MB)
                      </span>
                    </label>
                    <input
                      id="parental_consent"
                      name="parental_consent"
                      type="file"
                      accept="application/pdf"
                      required
                      onChange={handleParentalConsentChange}
                      className="sr-only"
                    />
                    {parentalConsentFile && (
                      <p className="flex items-center gap-2 text-sm text-zinc-200">
                        <FileText className="size-4 shrink-0" aria-hidden />
                        {parentalConsentFile.name} ({(parentalConsentFile.size / 1024).toFixed(0)} KB)
                      </p>
                    )}
                    {parentalConsentError && (
                      <p className="text-sm text-rose-300">{parentalConsentError}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="portfolio" className="text-zinc-300">
                      Portofolio (PDF, maks 5 MB, opsional)
                    </Label>
                    <label htmlFor="portfolio" className={fileFieldClass}>
                      <UploadCloud className="size-7 text-zinc-500" strokeWidth={1.5} aria-hidden />
                      <span className="text-sm text-zinc-300">
                        Klik untuk unggah Portofolio (PDF, maks 5 MB)
                      </span>
                    </label>
                    <input
                      id="portfolio"
                      name="portfolio"
                      type="file"
                      accept="application/pdf"
                      onChange={handlePortfolioChange}
                      className="sr-only"
                    />
                    {portfolioFile && (
                      <p className="flex items-center gap-2 text-sm text-zinc-200">
                        <FileText className="size-4 shrink-0" aria-hidden />
                        {portfolioFile.name} ({(portfolioFile.size / 1024).toFixed(0)} KB)
                      </p>
                    )}
                    {portfolioError && <p className="text-sm text-rose-300">{portfolioError}</p>}
                  </div>
                </section>

                {error && (
                  <p className="text-sm text-rose-300" role="alert">
                    {error}
                  </p>
                )}

                <div className="space-y-3 border-t border-white/10 pt-6">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 w-full cursor-pointer rounded-full bg-white text-base font-medium text-zinc-950 transition-transform hover:bg-zinc-200 active:scale-[0.98]"
                  >
                    {isSubmitting ? "Mengirim..." : "Kirim Pendaftaran"}
                  </Button>
                  <p className="flex items-center justify-center gap-2 text-xs text-zinc-400">
                    <CalendarClock className="size-3.5" aria-hidden />
                    Setelah terkirim, cek statusmu di halaman Cek Hasil
                  </p>
                </div>
              </form>
            )}

            {isLoading && (
              <div className="space-y-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton h-11 rounded-md" />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
