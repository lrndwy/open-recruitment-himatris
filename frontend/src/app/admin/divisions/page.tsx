"use client";

import { useCallback, useEffect, useState } from "react";

import { Images } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api, ApiError, storageUrl } from "@/lib/api";
import type { Division, Paginated } from "@/types";

export default function DivisionsPage() {
  const [data, setData] = useState<Paginated<Division>>();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Division | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get<Paginated<Division>>(
        `/admin/divisions?page=${page}&limit=10&search=${encodeURIComponent(search)}`,
      );
      setData(res.data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        localStorage.removeItem("access_token");
        window.location.href = "/admin/login";
      }
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setError("");
    setIsActive(true);
    setOpen(true);
  }

  function openEdit(item: Division) {
    setEditing(item);
    setError("");
    setIsActive(item.is_active);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      description: form.get("description"),
      is_active: isActive,
    };
    try {
      if (editing) {
        await api.put(`/admin/divisions/${editing.id}`, payload);
      } else {
        await api.post("/admin/divisions", payload);
      }
      setOpen(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Terjadi kesalahan.");
    }
  }

  async function handleDelete(item: Division) {
    if (!confirm(`Hapus divisi "${item.name}"?`)) return;
    try {
      await api.delete(`/admin/divisions/${item.id}`);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Terjadi kesalahan.");
    }
  }

  async function handleImageUpload(item: Division, file?: File) {
    if (!file) return;
    const body = new FormData();
    body.append("image", file);
    try {
      await api.put(`/admin/divisions/${item.id}/image`, body);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Terjadi kesalahan.");
    }
  }

  async function handleImageDelete(item: Division) {
    if (!confirm(`Hapus gambar divisi "${item.name}"?`)) return;
    try {
      await api.delete(`/admin/divisions/${item.id}/image`);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Terjadi kesalahan.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Divisi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gambar divisi tampil di landing page. Format JPG/PNG/WEBP maksimal 8
            MB, otomatis dikompres dan diperkecil ke lebar 1280 px.
          </p>
        </div>
        <Button onClick={openCreate}>Tambah Divisi</Button>
      </div>

      <Input
        placeholder="Cari divisi..."
        value={search}
        onChange={(e) => {
          setPage(1);
          setSearch(e.target.value);
        }}
        className="max-w-sm"
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Gambar</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-40 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {item.image_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={storageUrl(item.image_path)}
                        alt={`Gambar divisi ${item.name}`}
                        className="h-10 w-16 rounded border object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-16 items-center justify-center rounded border border-dashed text-muted-foreground">
                        <Images className="size-4" aria-hidden />
                      </span>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <label htmlFor={`image-${item.id}`} className="cursor-pointer">
                        {item.image_path ? "Ganti" : "Unggah"}
                      </label>
                    </Button>
                    <input
                      id={`image-${item.id}`}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(e) => {
                        handleImageUpload(item, e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                    {item.image_path && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleImageDelete(item)}
                      >
                        Hapus gambar
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={item.is_active ? "default" : "secondary"}>
                    {item.is_active ? "Aktif" : "Nonaktif"}
                  </Badge>
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
            {data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!data || data.pagination.page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Sebelumnya
        </Button>
        <span className="text-sm text-muted-foreground">
          Halaman {data?.pagination.page ?? 1} dari {data?.pagination.total_pages ?? 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!data || data.pagination.page >= data.pagination.total_pages}
          onClick={() => setPage((p) => p + 1)}
        >
          Selanjutnya
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Divisi" : "Tambah Divisi"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama</Label>
              <Input id="name" name="name" required maxLength={100} defaultValue={editing?.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Input
                id="description"
                name="description"
                defaultValue={editing?.description ?? ""}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="is_active" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="is_active">Aktif</Label>
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
