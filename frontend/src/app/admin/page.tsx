"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Hourglass, UserCheck, Users, UserX } from "lucide-react";
import Link from "next/link";

import { api, ApiError } from "@/lib/api";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type DashboardData = {
  applicants: { total: number; pending: number; accepted: number; rejected: number };
  master_data: { divisions: number; program_studies: number };
  registration: { status: string; name?: string };
};

const STATUS_LABEL: Record<string, string> = { UPCOMING: "Akan Datang", OPEN: "Buka", CLOSED: "Tutup" };

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    setError("");
    api
      .get<DashboardData>("/admin/dashboard")
      .then((res) => setData(res.data ?? null))
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          localStorage.removeItem("access_token");
          window.location.href = "/admin/login";
          return;
        }
        setError("Gagal memuat dashboard.");
      })
      .finally(() => setLoading(false));
  }

  if (loading) {
    return (
      <main className="p-8">
        <h1 className="font-heading text-3xl font-medium tracking-tight">Dashboard</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="p-8">
        <h1 className="font-heading text-3xl font-medium tracking-tight">Dashboard</h1>
        <p className="mt-4 text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={load} className="mt-4">
          Coba Lagi
        </Button>
      </main>
    );
  }

  const reg = data.registration;

  return (
    <main>
      <h1 className="font-heading text-3xl font-medium tracking-tight">Dashboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Periode Pendaftaran:{" "}
        {reg.name ? (
          <>
            {reg.name} <Badge variant={reg.status === "OPEN" ? "default" : "secondary"}>{STATUS_LABEL[reg.status] ?? reg.status}</Badge>
          </>
        ) : (
          <Badge variant="secondary">Tidak ada periode aktif</Badge>
        )}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pendaftar</CardTitle>
            <CardAction>
              <div className="flex size-9 items-center justify-center rounded-md border text-muted-foreground">
                <Users className="size-4" />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-medium tabular-nums">{data.applicants.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Menunggu</CardTitle>
            <CardAction>
              <div className="flex size-9 items-center justify-center rounded-md border text-muted-foreground">
                <Hourglass className="size-4" />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-medium tabular-nums">{data.applicants.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Diterima</CardTitle>
            <CardAction>
              <div className="flex size-9 items-center justify-center rounded-md border text-muted-foreground">
                <UserCheck className="size-4" />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-medium tabular-nums text-green-600">{data.applicants.accepted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Ditolak</CardTitle>
            <CardAction>
              <div className="flex size-9 items-center justify-center rounded-md border text-muted-foreground">
                <UserX className="size-4" />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-medium tabular-nums text-red-600">{data.applicants.rejected}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Master Data</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-8">
            <div>
              <p className="font-heading text-2xl font-medium tabular-nums">{data.master_data.divisions}</p>
              <p className="text-sm text-muted-foreground">Divisi</p>
            </div>
            <div>
              <p className="font-heading text-2xl font-medium tabular-nums">{data.master_data.program_studies}</p>
              <p className="text-sm text-muted-foreground">Program Studi</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/admin/applicants">
                Kelola Pendaftar
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/registration">
                Kelola Periode
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
