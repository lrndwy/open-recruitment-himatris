import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="HIMATRIS Politeknik Negeri Cilacap"
        className="h-9 w-auto"
      />
      <span className="font-heading text-xl font-bold text-white">HIMATRIS</span>
    </div>
  );
}
