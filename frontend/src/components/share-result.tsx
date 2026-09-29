"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

const PLATFORMS = [
  { label: "WhatsApp", buildUrl: (text: string, url: string) => `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}` },
  { label: "X", buildUrl: (text: string, url: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
  { label: "Facebook", buildUrl: (_text: string, url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  { label: "Telegram", buildUrl: (text: string, url: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
];

export function ShareResult({ division }: { division?: string | null }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  /*
    Komponen ini baru dirender setelah user mengecek hasil (tidak pernah saat
    SSR), jadi `window`/`navigator` aman diakses di sini.
    Tautan yang dibagikan sengaja halaman depan plus status/divisi (tanpa NIM
    atau nama), supaya kartu preview di media sosial bisa menyesuaikan.
  */
  const shareParams = new URLSearchParams({ status: "ACCEPTED" });
  if (division) shareParams.set("divisi", division);
  const url = `${window.location.origin}/?${shareParams.toString()}`;
  const text = division
    ? `Aku diterima di divisi ${division} pada Open Recruitment HIMATRIS!`
    : "Aku diterima pada Open Recruitment HIMATRIS!";
  const canNativeShare = typeof navigator.share === "function";

  async function handleNativeShare() {
    try {
      await navigator.share({ title: "Open Recruitment HIMATRIS", text, url });
    } catch {
      // User menutup share sheet, tidak perlu aksi apa pun.
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setCopyError(false);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  }

  const buttonClass =
    "h-10 cursor-pointer rounded-full border-white/15 bg-white/5 text-sm font-medium text-zinc-100 hover:border-white/30 hover:bg-white/10";

  return (
    <div className="mt-8 border-t border-white/10 pt-6">
      <p className="text-sm text-zinc-400">Bagikan hasilmu</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {canNativeShare && (
          <Button
            onClick={handleNativeShare}
            className="h-10 cursor-pointer rounded-full bg-white px-5 text-sm font-medium text-zinc-950 transition-transform hover:bg-zinc-200 active:scale-[0.98]"
          >
            <Share2 className="size-4" aria-hidden />
            Bagikan
          </Button>
        )}

        {PLATFORMS.map((platform) => (
          <Button key={platform.label} asChild variant="outline" className={buttonClass}>
            <a
              href={platform.buildUrl(text, url)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {platform.label}
            </a>
          </Button>
        ))}

        <Button variant="outline" onClick={handleCopy} className={buttonClass}>
          {copied ? (
            <Check className="size-4 text-emerald-300" aria-hidden />
          ) : (
            <Link2 className="size-4" aria-hidden />
          )}
          {copied ? "Tersalin" : "Salin tautan"}
        </Button>
      </div>

      {copyError && (
        <p className="mt-3 text-sm text-zinc-400">
          Browser memblokir akses clipboard. Salin manual:{" "}
          <span className="text-zinc-200 select-all">{url}</span>
        </p>
      )}
    </div>
  );
}
