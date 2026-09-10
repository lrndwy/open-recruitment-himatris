"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, KeyRound, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { AdminUser, AdminStatus } from "@/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get<AdminUser[]>("/admin/users");
      setUsers(res.data ?? []);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal memuat data admin.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function openEdit(user: AdminUser) {
    setEditUser(user);
    setEditOpen(true);
  }

  function openPassword(userId: string) {
    setPasswordUserId(userId);
    setPasswordOpen(true);
  }

  function openDelete(user: AdminUser) {
    setDeleteUser(user);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!deleteUser) return;
    try {
      await api.delete(`/admin/users/${deleteUser.id}`);
      toast.success("Admin berhasil dihapus.");
      setDeleteOpen(false);
      setDeleteUser(null);
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal menghapus admin.";
      toast.error(msg);
    }
  }

  if (loading) {
    return (
      <main>
        <h1 className="font-heading text-3xl font-medium tracking-tight">Kelola Admin</h1>
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <h1 className="font-heading text-3xl font-medium tracking-tight">Kelola Admin</h1>
        <p className="mt-4 text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={load} className="mt-4 cursor-pointer">
          Coba Lagi
        </Button>
      </main>
    );
  }

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-medium tracking-tight">Kelola Admin</h1>
        <Button onClick={() => setCreateOpen(true)} className="cursor-pointer">
          <Plus className="size-4" />
          Tambah Admin
        </Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Username</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Login Terakhir</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 text-sm font-medium">{user.username}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={user.status === "ACTIVE" ? "default" : "secondary"}>
                    {user.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm tabular-nums text-muted-foreground">
                  {user.last_login_at
                    ? new Date(user.last_login_at).toLocaleString("id-ID", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(user)}
                      className="cursor-pointer"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openPassword(user.id)}
                      className="cursor-pointer"
                    >
                      <KeyRound className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDelete(user)}
                      className="cursor-pointer text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={load} />
      <EditDialog open={editOpen} onOpenChange={setEditOpen} user={editUser} onSuccess={load} />
      <PasswordDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        userId={passwordUserId}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus admin <strong>{deleteUser?.username}</strong>? Tindakan ini
              tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="cursor-pointer">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function CreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const payload = {
      username: form.get("username"),
      email: form.get("email"),
      password: form.get("password"),
    };

    setSubmitting(true);
    try {
      await api.post("/admin/users", payload);
      formEl.reset();
      toast.success("Admin berhasil ditambahkan.");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal menambahkan admin.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Admin</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-username">Username</Label>
            <Input id="create-username" name="username" required minLength={3} maxLength={50} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-email">Email</Label>
            <Input
              id="create-email"
              name="email"
              type="email"
              required
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-password">Password</Label>
            <Input
              id="create-password"
              name="password"
              type="password"
              required
              minLength={8}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button type="submit" disabled={submitting} className="cursor-pointer">
              {submitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    const form = new FormData(e.currentTarget);
    const payload = {
      username: form.get("username"),
      email: form.get("email"),
      status: form.get("status"),
    };

    setSubmitting(true);
    try {
      await api.put(`/admin/users/${user.id}`, payload);
      toast.success("Admin berhasil diupdate.");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal mengupdate admin.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Admin</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-username">Username</Label>
            <Input
              id="edit-username"
              name="username"
              defaultValue={user.username}
              required
              minLength={3}
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              name="email"
              type="email"
              defaultValue={user.email}
              required
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select name="status" defaultValue={user.status} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Aktif</SelectItem>
                <SelectItem value="INACTIVE">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button type="submit" disabled={submitting} className="cursor-pointer">
              {submitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PasswordDialog({
  open,
  onOpenChange,
  userId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}) {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const payload = {
      old_password: form.get("old_password"),
      new_password: form.get("new_password"),
    };

    const confirm = form.get("confirm_password");
    if (payload.new_password !== confirm) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/admin/users/${userId}/change-password`, payload);
      formEl.reset();
      toast.success("Password berhasil diubah.");
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal mengubah password.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ganti Password</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="old-password">Password Lama</Label>
            <Input
              id="old-password"
              name="old_password"
              type="password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Password Baru</Label>
            <Input
              id="new-password"
              name="new_password"
              type="password"
              required
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
            <Input
              id="confirm-password"
              name="confirm_password"
              type="password"
              required
              minLength={8}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button type="submit" disabled={submitting} className="cursor-pointer">
              {submitting ? "Menyimpan..." : "Ubah Password"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
