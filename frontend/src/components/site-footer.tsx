import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-center sm:flex-row sm:px-6 sm:text-left">
        <div className="flex flex-col items-center gap-1.5 sm:items-start">
          <Logo className="scale-90" />
          <p className="text-sm text-zinc-400">
            Himpunan Mahasiswa Teknologi Informasi.
          </p>
        </div>
        <p className="text-sm text-zinc-400">
          © {new Date().getFullYear()} HIMATRIS
        </p>
      </div>
    </footer>
  );
}
