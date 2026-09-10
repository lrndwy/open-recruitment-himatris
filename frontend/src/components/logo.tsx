import { cn } from "@/lib/utils";

export function Logo({
  className,
  textClassName,
}: {
  className?: string;
  textClassName?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="HIMATRIS Politeknik Negeri Cilacap"
        className="h-9 w-auto"
      />
      <span className={cn("font-heading text-xl font-bold", textClassName ?? "text-white")}>
        HIMATRIS
      </span>
    </div>
  );
}
