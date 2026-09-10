"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { api, ApiError } from "@/lib/api";
import type { ApplicantDetail, Division, Paginated, SelectionStatus } from "@/types";

const STATUS_VARIANT: Record<SelectionStatus, "secondary" | "default" | "destructive"> = {
  PENDING: "secondary",
  ACCEPTED: "default",
  REJECTED: "destructive",
};

const STATUS_LABEL: Record<SelectionStatus, string> = {
  PENDING: "Menunggu",
  ACCEPTED: "Diterima",
  REJECTED: "Ditolak",
};

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.ceil(bytes / 1024)} KB`;
}

export default function ApplicantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [applicant, setApplicant] = useState<ApplicantDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [cvUrl, setCvUrl] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [parentalConsentUrl, setParentalConsentUrl] = useState("");
  const [showCv, setShowCv] = useState(false);
  const [showPoster, setShowPoster] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [showParentalConsent, setShowParentalConsent] = useState(false);

  const [pendingStatus, setPendingStatus] = useState<SelectionStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [divisions, setDivisions] = useState<Division[]>([]);
  const [acceptedDivId, setAcceptedDivId] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<ApplicantDetail>(`/admin/applicants/${id}`);
      setApplicant(res.data ?? null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        localStorage.removeItem("access_token");
        window.location.href = "/admin/login";
        return;
      }
      setError(err instanceof ApiError ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<Paginated<Division>>("/admin/divisions?is_active=true&limit=100");
        setDivisions(res.data?.items ?? []);
      } catch {
        // daftar divisi gagal dimuat; select tetap dirender kosong
      }
    })();
  }, []);

  useEffect(() => {
    if (!applicant?.cv) return;
    let url = "";
    (async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API_URL}/admin/applicants/${id}/cv`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        url = URL.createObjectURL(await res.blob());
        setCvUrl(url);
      } catch {
        // tombol CV tetap tampil; gagal fetch dibiarkan diam
      }
    })();
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [applicant?.cv, id]);

  useEffect(() => {
    if (!applicant?.poster) return;
    let url = "";
    (async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API_URL}/admin/applicants/${id}/poster`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        url = URL.createObjectURL(await res.blob());
        setPosterUrl(url);
      } catch {
        // tombol poster tetap tampil; gagal fetch dibiarkan diam
      }
    })();
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [applicant?.poster, id]);

  useEffect(() => {
    if (!applicant?.portfolio) return;
    let url = "";
    (async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API_URL}/admin/applicants/${id}/portfolio`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        url = URL.createObjectURL(await res.blob());
        setPortfolioUrl(url);
      } catch {
        // tombol portofolio tetap tampil; gagal fetch dibiarkan diam
      }
    })();
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [applicant?.portfolio, id]);

  useEffect(() => {
    if (!applicant?.parental_consent) return;
    let url = "";
    (async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API_URL}/admin/applicants/${id}/parental-consent`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        url = URL.createObjectURL(await res.blob());
        setParentalConsentUrl(url);
      } catch {
        // tombol surat persetujuan tetap tampil; gagal fetch dibiarkan diam
      }
    })();
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [applicant?.parental_consent, id]);

  async function confirmUpdateStatus() {
    if (!pendingStatus) return;
    setIsUpdating(true);
    try {
      await api.patch(`/admin/applicants/${id}/status`, {
        status: pendingStatus,
        ...(pendingStatus === "ACCEPTED" ? { accepted_division_id: acceptedDivId } : {}),
      });
      setPendingStatus(null);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        localStorage.removeItem("access_token");
        window.location.href = "/admin/login";
        return;
      }
      setError(err instanceof ApiError ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsUpdating(false);
    }
  }

  if (isLoading) {
    return <p className="text-muted-foreground">Memuat...</p>;
  }
  if (error && !applicant) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" asChild>
          <Link href="/admin/applicants">← Kembali</Link>
        </Button>
      </div>
    );
  }
  if (!applicant) return null;

  const a = applicant;

  return (
    <div className="space-y-4">
      <Button variant="ghost" asChild className="-ml-2">
        <Link href="/admin/applicants">← Kembali</Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{a.name}</h1>
          <p className="text-sm text-muted-foreground">
            {a.nim} · {a.class}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[a.selection_status]} className="text-sm">
          {STATUS_LABEL[a.selection_status]}
        </Badge>
      </div>

      {a.accepted_division && a.selection_status === "ACCEPTED" && (
        <p className="text-sm">
          <span className="text-muted-foreground">Diterima di divisi:</span>{" "}
          <span className="font-medium">{a.accepted_division.name}</span>
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Pendaftar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Tanggal Lahir:</span>{" "}
              {a.birth_date
                ? new Date(a.birth_date).toLocaleDateString("id-ID", { dateStyle: "long" })
                : "-"}
            </p>
            <p>
              <span className="text-muted-foreground">No. WhatsApp:</span>{" "}
              {a.whatsapp || "-"}
            </p>
            <p>
              <span className="text-muted-foreground">Program Studi:</span> {a.program_study.name}
            </p>
            <p>
              <span className="text-muted-foreground">Divisi 1:</span> {a.division_1.name}
            </p>
            <p>
              <span className="text-muted-foreground">Divisi 2:</span>{" "}
              {a.division_2?.name ?? <span className="text-muted-foreground">Tidak memilih</span>}
            </p>
            <p>
              <span className="text-muted-foreground">Terdaftar:</span>{" "}
              {new Date(a.created_at).toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">CV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {a.cv ? (
              <>
                <p>
                  <span className="text-muted-foreground">File:</span> {a.cv.original_name} (
                  {formatBytes(a.cv.size_bytes)})
                </p>
                <div className="flex gap-2">
                  {cvUrl && (
                    <Button size="sm" onClick={() => setShowCv(!showCv)}>
                      {showCv ? "Sembunyikan" : "Lihat CV"}
                    </Button>
                  )}
                  {cvUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={cvUrl} download={a.cv.original_name}>
                        Unduh
                      </a>
                    </Button>
                  )}
                </div>
                {showCv && cvUrl && (
                  <iframe src={cvUrl} className="h-96 w-full rounded-md border" title="CV" />
                )}
              </>
            ) : (
              <p className="text-muted-foreground">Tidak ada CV.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Poster</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {a.poster ? (
              <>
                <p>
                  <span className="text-muted-foreground">File:</span> {a.poster.original_name} (
                  {formatBytes(a.poster.size_bytes)})
                </p>
                <div className="flex gap-2">
                  {posterUrl && (
                    <Button size="sm" onClick={() => setShowPoster(!showPoster)}>
                      {showPoster ? "Sembunyikan" : "Lihat Poster"}
                    </Button>
                  )}
                  {posterUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={posterUrl} download={a.poster.original_name}>
                        Unduh
                      </a>
                    </Button>
                  )}
                </div>
                {showPoster && posterUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={posterUrl} alt={a.poster.original_name} className="w-full rounded-md border" />
                )}
              </>
            ) : (
              <p className="text-muted-foreground">Tidak ada poster.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Portofolio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {a.portfolio ? (
              <>
                <p>
                  <span className="text-muted-foreground">File:</span> {a.portfolio.original_name} (
                  {formatBytes(a.portfolio.size_bytes)})
                </p>
                <div className="flex gap-2">
                  {portfolioUrl && (
                    <Button size="sm" onClick={() => setShowPortfolio(!showPortfolio)}>
                      {showPortfolio ? "Sembunyikan" : "Lihat Portofolio"}
                    </Button>
                  )}
                  {portfolioUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={portfolioUrl} download={a.portfolio.original_name}>
                        Unduh
                      </a>
                    </Button>
                  )}
                </div>
                {showPortfolio && portfolioUrl && (
                  <iframe src={portfolioUrl} className="h-96 w-full rounded-md border" title="Portofolio" />
                )}
              </>
            ) : (
              <p className="text-muted-foreground">Tidak ada portofolio.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Surat Persetujuan Orang Tua</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {a.parental_consent ? (
              <>
                <p>
                  <span className="text-muted-foreground">File:</span> {a.parental_consent.original_name} (
                  {formatBytes(a.parental_consent.size_bytes)})
                </p>
                <div className="flex gap-2">
                  {parentalConsentUrl && (
                    <Button size="sm" onClick={() => setShowParentalConsent(!showParentalConsent)}>
                      {showParentalConsent ? "Sembunyikan" : "Lihat Surat"}
                    </Button>
                  )}
                  {parentalConsentUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={parentalConsentUrl} download={a.parental_consent.original_name}>
                        Unduh
                      </a>
                    </Button>
                  )}
                </div>
                {showParentalConsent && parentalConsentUrl && (
                  <iframe src={parentalConsentUrl} className="h-96 w-full rounded-md border" title="Surat Persetujuan" />
                )}
              </>
            ) : (
              <p className="text-muted-foreground">Tidak ada surat persetujuan.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div>
        <h2 className="mb-3 font-medium">Ubah Status Seleksi</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={a.selection_status === "PENDING"}
            onClick={() => setPendingStatus("PENDING")}
          >
            Tandai Menunggu
          </Button>
          <Button
            disabled={a.selection_status === "ACCEPTED"}
            onClick={() => {
              setAcceptedDivId(a.accepted_division?.id ?? "");
              setPendingStatus("ACCEPTED");
            }}
          >
            Terima
          </Button>
          <Button
            variant="destructive"
            disabled={a.selection_status === "REJECTED"}
            onClick={() => setPendingStatus("REJECTED")}
          >
            Tolak
          </Button>
        </div>
      </div>

      <AlertDialog open={pendingStatus !== null} onOpenChange={(o) => !o && setPendingStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ubah status seleksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Status pendaftar &quot;{a.name}&quot; akan diubah menjadi{" "}
              <span className="font-medium">
                {pendingStatus ? STATUS_LABEL[pendingStatus] : ""}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingStatus === "ACCEPTED" && (
            <div className="space-y-2">
              <Select value={acceptedDivId} onValueChange={setAcceptedDivId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih divisi diterima" />
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
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUpdateStatus}
              disabled={isUpdating || (pendingStatus === "ACCEPTED" && !acceptedDivId)}
            >
              {isUpdating ? "Menyimpan..." : "Ya, Ubah"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
