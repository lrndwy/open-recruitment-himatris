"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarRange,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  Users,
  UsersRound,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/applicants", label: "Pendaftar", icon: Users },
  { href: "/admin/registration", label: "Periode Pendaftaran", icon: CalendarRange },
  { href: "/admin/divisions", label: "Divisi", icon: Network },
  { href: "/admin/program-studies", label: "Program Studi", icon: GraduationCap },
  { href: "/admin/users", label: "Kelola Admin", icon: UsersRound },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") return;
    if (!localStorage.getItem("access_token")) {
      router.replace("/admin/login");
    } else {
      setChecked(true);
    }
  }, [router, pathname]);

  // Tutup sidebar setiap pindah halaman
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  function handleLogout() {
    localStorage.removeItem("access_token");
    router.replace("/admin/login");
  }

  if (pathname === "/admin/login") return <>{children}</>;
  if (!checked) return null;

  const sidebar = (onNavigate?: () => void) => (
    <>
      <div className="mb-6 px-2">
        <Logo />
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
              pathname === item.href
                ? "bg-secondary font-medium text-foreground"
                : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
            }`}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <Button
        variant="ghost"
        onClick={handleLogout}
        className="cursor-pointer justify-start text-muted-foreground"
      >
        <LogOut className="size-4" />
        Keluar
      </Button>
    </>
  );

  return (
    <div className="flex min-h-svh">
      {/* Sidebar desktop */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar p-4 md:flex">
        {sidebar()}
      </aside>

      {/* Sidebar mobile: overlay + toggle */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Tutup menu"
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r bg-sidebar p-4 shadow-xl">
            <div className="flex items-center justify-end">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Tutup menu"
                onClick={() => setSidebarOpen(false)}
                className="cursor-pointer text-muted-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="mt-6 flex flex-1 flex-col">
              {sidebar(() => setSidebarOpen(false))}
            </div>
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        {/* Top bar mobile: hanya toggle + logout, tanpa nav */}
        <div className="flex items-center justify-between border-b p-4 md:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Buka menu"
            onClick={() => setSidebarOpen(true)}
            className="cursor-pointer"
          >
            <Menu className="size-5" />
          </Button>
          <Logo />
          <Button variant="ghost" size="sm" onClick={handleLogout} className="cursor-pointer">
            <LogOut className="size-4" />
            <span className="sr-only">Keluar</span>
          </Button>
        </div>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
