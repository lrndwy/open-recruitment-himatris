"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { api, ApiError } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem("access_token")) {
      router.replace("/admin");
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      const res = await api.post<{ access_token: string }>("/auth/login", {
        username: form.get("username"),
        password: form.get("password"),
      });
      localStorage.setItem("access_token", res.data!.access_token);
      router.replace("/admin");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Terjadi kesalahan pada server. Silakan coba lagi.";
      toast.error(message);
    }
  }

  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r bg-sidebar p-10 lg:flex">
        <div className="relative">
          <Logo />
        </div>
        <div className="relative space-y-3">
          <h1 className="max-w-md font-heading text-5xl font-medium leading-[1.1] tracking-tight text-pretty">
            Open Recruitment <span className="italic">HIMATRIS</span>
          </h1>
          <p className="max-w-md text-muted-foreground">
            Himpunan Mahasiswa Komputer dan Bisnis — kelola pendaftar, periode, dan
            divisi dari satu dasbor.
          </p>
        </div>
        <p className="relative text-sm text-muted-foreground">
          © {new Date().getFullYear()} HIMATRIS
        </p>
      </div>

      <div className="flex items-center justify-center p-4">
        <div className="card-outline w-full max-w-sm p-6 sm:p-8">
          <div className="mb-6 lg:hidden">
            <Logo />
          </div>
          <h2 className="font-heading text-2xl font-medium tracking-tight">Login Admin</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Masuk untuk mengelola open recruitment HIMATRIS.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username / Email</Label>
              <Input id="username" name="username" required autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full cursor-pointer">
              Masuk
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
