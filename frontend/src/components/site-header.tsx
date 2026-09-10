"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Beranda HIMATRIS">
          <Logo className="h-12" />
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/result"
            className="link-underline text-sm text-zinc-400 transition-colors hover:text-white"
          >
            Cek Hasil
          </Link>
          <Button
            asChild
            size="sm"
            className="rounded-full bg-white px-5 font-medium text-zinc-950 hover:bg-zinc-200"
          >
            <Link href="/register">Daftar Sekarang</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
