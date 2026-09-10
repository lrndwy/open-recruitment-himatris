"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, ApiError } from "@/lib/api";
import type {
  ApplicantListItem,
  Division,
  Paginated,
  ProgramStudy,
  SelectionStatus,
} from "@/types";

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

export default function ApplicantsPage() {
  const [data, setData] = useState<Paginated<ApplicantListItem> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [programStudyId, setProgramStudyId] = useState("all");
  const [divisionId, setDivisionId] = useState("all");
  const [page, setPage] = useState(1);

  const [divisions, setDivisions] = useState<Division[]>([]);
  const [programStudies, setProgramStudies] = useState<ProgramStudy[]>([]);

  useEffect(() => {
    api
      .get<Paginated<Division>>("/admin/divisions?limit=100")
      .then((r) => setDivisions(r.data?.items ?? []))
      .catch(() => {});
    api
      .get<Paginated<ProgramStudy>>("/admin/program-studies?limit=100")
      .then((r) => setProgramStudies(r.data?.items ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (status !== "all") params.set("status", status);
      if (programStudyId !== "all") params.set("program_study_id", programStudyId);
      if (divisionId !== "all") params.set("division_id", divisionId);
      const res = await api.get<Paginated<ApplicantListItem>>(
        `/admin/applicants?${params.toString()}`,
      );
      setData(res.data ?? null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        localStorage.removeItem("access_token");
        window.location.href = "/admin/login";
        return;
      }
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [search, status, programStudyId, divisionId, page]);

  useEffect(() => {
    load();
  }, [load]);

  const pagination = data?.pagination;

  async function handleExport() {
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (programStudyId !== "all") params.set("program_study_id", programStudyId);
      if (divisionId !== "all") params.set("division_id", divisionId);
      const qs = params.toString();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/export/applicants${qs ? `?${qs}` : ""}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` } },
      );
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ?? "export-applicants.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Gagal mengexport data.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pendaftar</h1>
        <Button variant="outline" onClick={handleExport}>
          Export Excel
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Cari nama / NIM..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-56"
        />
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="PENDING">Menunggu</SelectItem>
            <SelectItem value="ACCEPTED">Diterima</SelectItem>
            <SelectItem value="REJECTED">Ditolak</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={programStudyId}
          onValueChange={(v) => {
            setProgramStudyId(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Prodi</SelectItem>
            {programStudies.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={divisionId}
          onValueChange={(v) => {
            setDivisionId(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Divisi</SelectItem>
            {divisions.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>NIM</TableHead>
              <TableHead>Prodi</TableHead>
              <TableHead>Divisi 1</TableHead>
              <TableHead>Divisi 2</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Memuat...
                </TableCell>
              </TableRow>
            ) : !data?.items.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Tidak ada data.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>{a.nim}</TableCell>
                  <TableCell>{a.program_study.name}</TableCell>
                  <TableCell>{a.division_1.name}</TableCell>
                  <TableCell>{a.division_2?.name ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[a.selection_status]}>
                      {STATUS_LABEL[a.selection_status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/applicants/${a.id}`}>Detail</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Halaman {pagination.page} dari {pagination.total_pages} ({pagination.total} pendaftar)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.total_pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
