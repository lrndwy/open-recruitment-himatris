"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { api } from "@/lib/api";
import type { RegistrationPeriod } from "@/types";

export function SiteHeader() {
  // Tombol "Daftar Sekarang" hanya muncul kalau pendaftaran memang dibuka,
  // supaya pengunjung tidak diarahkan ke halaman yang sudah ditutup.
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<RegistrationPeriod | null>("/public/registration")
      .then((res) => {
        if (!cancelled) setIsOpen(res.data?.status === "OPEN");
      })
      .catch(() => {
        if (!cancelled) setIsOpen(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/90 backdrop-blur-none sm:backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:h-20 sm:gap-6 sm:px-6">
        <Link href="/" aria-label="Beranda HIMATRIS" className="shrink-0">
          <Logo
            className="h-9 sm:h-12"
            textClassName="hidden text-white min-[480px]:inline sm:text-xl"
          />
        </Link>
        <nav className="flex shrink-0 items-center gap-3 sm:gap-6">
          <Link
            href="/result"
            className="link-underline whitespace-nowrap text-sm text-zinc-400 transition-colors hover:text-white"
          >
            Cek Hasil
          </Link>
          {isOpen && (
            <Button
              asChild
              size="sm"
              className="whitespace-nowrap rounded-full bg-white px-4 font-medium text-zinc-950 hover:bg-zinc-200 sm:px-5"
            >
              <Link href="/register">Daftar Sekarang</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
