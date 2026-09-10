"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api";
import type { RegistrationPeriod, RegistrationStatus } from "@/types";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const STATUS_VARIANT: Record<RegistrationStatus, "default" | "secondary" | "outline"> = {
  UPCOMING: "secondary",
  OPEN: "default",
  CLOSED: "outline",
};

const STATUS_LABEL: Record<RegistrationStatus, string> = {
  UPCOMING: "Akan Datang",
  OPEN: "Buka",
  CLOSED: "Tutup",
};

export default function RegistrationPeriodsPage() {
  const [items, setItems] = useState<RegistrationPeriod[]>([]);
  const [editing, setEditing] = useState<RegistrationPeriod | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get<RegistrationPeriod[]>("/admin/registration-periods");
      setItems(res.data ?? []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        localStorage.removeItem("access_token");
        window.location.href = "/admin/login";
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setError("");
    setOpen(true);
  }

  function openEdit(item: RegistrationPeriod) {
    setEditing(item);
    setError("");
    setOpen(true);
  }

  // combine date+time input into ISO with +07:00 offset
  function toISO(date: string, time: string) {
    if (!date || !time) return "";
    return `${date}T${time}:00+07:00`;
  }

  function fromISO(iso: string) {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    // convert to +07:00 parts
    const jakarta = new Date(d.getTime() + (7 * 60 + d.getTimezoneOffset()) * 60000);
    return {
      date: `${jakarta.getFullYear()}-${pad(jakarta.getMonth() + 1)}-${pad(jakarta.getDate())}`,
      time: `${pad(jakarta.getHours())}:${pad(jakarta.getMinutes())}`,
    };
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const startAt = toISO(form.get("start_date") as string, form.get("start_time") as string);
    const endAt = toISO(form.get("end_date") as string, form.get("end_time") as string);
    const payload = {
      name: form.get("name"),
      start_at: startAt,
      end_at: endAt,
    };
    if (!startAt || !endAt) {
      setError("Tanggal dan waktu wajib diisi.");
      return;
    }
    try {
      if (editing) {
        await api.put(`/admin/registration-periods/${editing.id}`, payload);
      } else {
        await api.post("/admin/registration-periods", payload);
      }
      setOpen(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Terjadi kesalahan.");
    }
  }

  async function handleDelete(item: RegistrationPeriod) {
    if (!confirm(`Hapus periode "${item.name}"?`)) return;
    try {
      await api.delete(`/admin/registration-periods/${item.id}`);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Terjadi kesalahan.");
    }
  }

  const editStart = editing ? fromISO(editing.start_at) : null;
  const editEnd = editing ? fromISO(editing.end_at) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Periode Pendaftaran</h1>
        <Button onClick={openCreate}>Tambah Periode</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Mulai</TableHead>
              <TableHead>Selesai</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-40 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{formatDateTime(item.start_at)}</TableCell>
                <TableCell>{formatDateTime(item.end_at)}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[item.status]}>{STATUS_LABEL[item.status]}</Badge>
                </TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(item)}>
                    Hapus
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Periode" : "Tambah Periode"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama</Label>
              <Input id="name" name="name" required maxLength={200} defaultValue={editing?.name} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="start_date">Mulai</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  required
                  defaultValue={editStart?.date}
                />
                <Input id="start_time" name="start_time" type="time" required defaultValue={editStart?.time} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Selesai</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  required
                  defaultValue={editEnd?.date}
                />
                <Input id="end_time" name="end_time" type="time" required defaultValue={editEnd?.time} />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">
              Simpan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
