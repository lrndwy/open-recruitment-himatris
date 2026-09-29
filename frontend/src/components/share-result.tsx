"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Download, Link2, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

const PLATFORMS = [
  { label: "WhatsApp", buildUrl: (text: string, url: string) => `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}` },
  { label: "X", buildUrl: (text: string, url: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
  { label: "Facebook", buildUrl: (_text: string, url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  { label: "Telegram", buildUrl: (text: string, url: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
];

const SHARE_TITLE = "Open Recruitment HIMATRIS";

type Props = {
  nim?: string | null;
  division?: string | null;
};

export function ShareResult({ nim, division }: Props) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  /*
    Komponen ini baru dirender setelah user mengecek hasil (tidak pernah saat
    SSR), jadi `window`/`navigator` aman diakses di sini.
    Tautan yang dibagikan memakai NIM — bukan status/divisi — supaya kartu
    preview diambil dari data pendaftar yang sebenarnya dan tidak bisa diubah
    dari URL. Gambarnya sendiri dibuat server pada `/og`.
  */
  const origin = window.location.origin;
  const url = nim ? `${origin}/?nim=${encodeURIComponent(nim)}` : origin;
  const text = division
    ? `Aku diterima di divisi ${division} pada Open Recruitment HIMATRIS!`
    : "Aku diterima pada Open Recruitment HIMATRIS!";

  const imageParams = new URLSearchParams({ status: "ACCEPTED" });
  if (division) imageParams.set("divisi", division);
  const imageUrl = `${origin}/og?${imageParams.toString()}`;
  const imageName = `hasil-seleksi-${nim ?? "himatris"}.png`;

  const canNativeShare = typeof navigator.share === "function";

  /*
    Gambar diunduh dulu supaya bisa dilampirkan lewat `files`: WhatsApp dan
    aplikasi lain menerima gambarnya langsung, bukan cuma tautan. Browser yang
    belum bisa berbagi file tetap dapat versi teks + tautan.
  */
  async function handleNativeShare() {
    try {
      const res = await fetch(imageUrl);
      const blob = res.ok ? await res.blob() : null;
      const file = blob
        ? new File([blob], imageName, { type: blob.type || "image/png" })
        : null;

      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: SHARE_TITLE, text: `${text} ${url}` });
      } else {
        await navigator.share({ title: SHARE_TITLE, text, url });
      }
    } catch {
      // User menutup share sheet atau berbagi gagal, tidak perlu aksi apa pun.
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

        <Button variant="outline" className={buttonClass} asChild>
          <a href={imageUrl} download={imageName}>
            <Download className="size-4" aria-hidden />
            Unduh gambar
          </a>
        </Button>

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
