"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileText, Info, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { api, ApiError } from "@/lib/api";
import type { Division, ProgramStudy, RegistrationPeriod } from "@/types";

const MAX_CV_SIZE = 5 * 1024 * 1024;

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

  const isOpen = period?.status === "OPEN";

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

  if (success) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="card-outline w-full max-w-md p-8 text-center sm:p-10">
            <CheckCircle2 className="mx-auto size-12 text-green-600" strokeWidth={1.5} />
            <p className="rule-label mt-6">Pendaftaran Berhasil</p>
            <p className="mt-4 font-mono text-3xl tracking-tight">{success.nim}</p>
            <p className="mt-3 text-sm text-muted-foreground">Status: Menunggu Seleksi</p>
            <Button asChild variant="outline" className="mt-8 w-full cursor-pointer">
              <Link href="/result">Cek Hasil Seleksi</Link>
            </Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <h1 className="font-heading text-3xl font-medium tracking-tight">Form Pendaftaran</h1>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Memuat...</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {isOpen
                  ? `Periode: ${period?.name}`
                  : "Pendaftaran sedang tidak dibuka."}
              </p>
            )}
            <ul className="card-outline space-y-3 p-5 text-sm">
              <li className="flex items-start gap-3">
                <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>CV PDF maksimal 5 MB</span>
              </li>
              <li className="flex items-start gap-3">
                <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>Surat persetujuan orang tua (PDF) wajib</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>Divisi 1 dan Divisi 2 wajib</span>
              </li>
              <li className="flex items-start gap-3">
                <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>Hasil diumumkan lewat halaman Cek Hasil</span>
              </li>
            </ul>
          </aside>

          <div>
            {!isLoading && !isOpen && (
              <div className="card-outline p-6 text-center text-muted-foreground">
                Pendaftaran sedang tidak dibuka.
              </div>
            )}

            {isOpen && (
              <form onSubmit={handleSubmit} className="card-outline space-y-5 p-6 sm:p-8">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input id="name" name="name" required minLength={3} maxLength={150} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nim">NIM</Label>
                    <Input id="nim" name="nim" required maxLength={50} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class">Kelas</Label>
                    <Input id="class" name="class" required maxLength={50} placeholder="TI-2A" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="whatsapp">No. WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      name="whatsapp"
                      type="tel"
                      required
                      minLength={8}
                      maxLength={20}
                      placeholder="08xxxxxxxxxx"
                      pattern="[0-9+\- ]{8,20}"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Program Studi</Label>
                  <Select value={programStudyId} onValueChange={setProgramStudyId} required>
                    <SelectTrigger className="w-full">
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
                <div className="space-y-2">
                  <Label>Divisi 1</Label>
                  <Select value={division1Id} onValueChange={setDivision1Id} required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih divisi pilihan pertama" />
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
                  <Label htmlFor="birth_date">Tanggal Lahir</Label>
                  <Input id="birth_date" name="birth_date" type="date" required max={new Date().toISOString().slice(0, 10)} />
                </div>
                <div className="space-y-2">
                  <Label>Divisi 2</Label>
                  <Select value={division2Id} onValueChange={setDivision2Id} required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih divisi pilihan kedua" />
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
                <div className="space-y-2">
                  <Label htmlFor="portfolio">Portofolio (PDF, maks 5 MB, opsional)</Label>
                  <label
                    htmlFor="portfolio"
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-dashed border-input p-6 text-center transition-colors hover:border-foreground/40"
                  >
                    <UploadCloud className="size-8 text-muted-foreground" strokeWidth={1.5} />
                    <span className="text-sm">Klik untuk unggah Portofolio (PDF, maks 5 MB)</span>
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
                    <p className="flex items-center gap-2 text-sm text-foreground">
                      <FileText className="size-4 shrink-0" />
                      {portfolioFile.name} ({(portfolioFile.size / 1024).toFixed(0)} KB)
                    </p>
                  )}
                  {portfolioError && <p className="text-sm text-destructive">{portfolioError}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cv">CV (PDF, maks 5 MB)</Label>
                  <label
                    htmlFor="cv"
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-dashed border-input p-6 text-center transition-colors hover:border-foreground/40"
                  >
                    <UploadCloud className="size-8 text-muted-foreground" strokeWidth={1.5} />
                    <span className="text-sm">Klik untuk unggah CV (PDF, maks 5 MB)</span>
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
                    <p className="flex items-center gap-2 text-sm text-foreground">
                      <FileText className="size-4 shrink-0" />
                      {cvFile.name} ({(cvFile.size / 1024).toFixed(0)} KB)
                    </p>
                  )}
                  {cvError && <p className="text-sm text-destructive">{cvError}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="poster">Poster (JPG/PNG/WEBP, maks 5 MB)</Label>
                  <label
                    htmlFor="poster"
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-dashed border-input p-6 text-center transition-colors hover:border-foreground/40"
                  >
                    <UploadCloud className="size-8 text-muted-foreground" strokeWidth={1.5} />
                    <span className="text-sm">Klik untuk unggah Poster (JPG/PNG/WEBP, maks 5 MB)</span>
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
                    <p className="flex items-center gap-2 text-sm text-foreground">
                      <FileText className="size-4 shrink-0" />
                      {posterFile.name} ({(posterFile.size / 1024).toFixed(0)} KB)
                    </p>
                  )}
                  {posterError && <p className="text-sm text-destructive">{posterError}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parental_consent">Surat Persetujuan Orang Tua (PDF, maks 5 MB)</Label>
                  <label
                    htmlFor="parental_consent"
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-dashed border-input p-6 text-center transition-colors hover:border-foreground/40"
                  >
                    <UploadCloud className="size-8 text-muted-foreground" strokeWidth={1.5} />
                    <span className="text-sm">Klik untuk unggah Surat Persetujuan (PDF, maks 5 MB)</span>
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
                    <p className="flex items-center gap-2 text-sm text-foreground">
                      <FileText className="size-4 shrink-0" />
                      {parentalConsentFile.name} ({(parentalConsentFile.size / 1024).toFixed(0)} KB)
                    </p>
                  )}
                  {parentalConsentError && <p className="text-sm text-destructive">{parentalConsentError}</p>}
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Mengirim..." : "Daftar"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
