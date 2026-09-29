import type { Metadata } from "next";
import { headers } from "next/headers";

import { LandingPage } from "@/components/landing-page";
import type { SelectionStatus } from "@/types";

type SearchParams = Promise<{ nim?: string }>;

type PublicResult = {
  status: SelectionStatus;
  name?: string;
  accepted_division?: { name: string } | null;
};

/*
  Tautan share memakai parameter NIM, bukan status/divisi. Status dan divisi
  selalu diambil dari data pendaftar di backend, jadi kartu preview tidak bisa
  dipalsukan lewat URL — yang tampil selalu hasil seleksi NIM tersebut.
*/
async function lookupResult(nim: string, apiBase: string): Promise<PublicResult | null> {
  try {
    const res = await fetch(`${apiBase}/public/result?nim=${encodeURIComponent(nim)}`, {
      // Cache singkat supaya crawler (WhatsApp/X/Telegram) tidak membanjiri
      // endpoint publik yang dibatasi rate limit.
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.success ? (body.data as PublicResult) : null;
  } catch {
    return null;
  }
}

/*
  Halaman ini server component supaya kartu preview (OG image) ikut menyesuaikan
  hasil yang dibagikan. Isi tampilannya tetap di komponen client.
*/
export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const nim = params.nim?.trim() ?? "";

  // Base URL diambil dari request supaya og:image tetap absolut di domain mana pun.
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "https";
  const metadataBase = host ? new URL(`${protocol}://${host}`) : undefined;

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ?? (metadataBase ? `${metadataBase.origin}/api/v1` : "");
  const result = nim && apiBase ? await lookupResult(nim, apiBase) : null;

  const division = result?.accepted_division?.name?.trim() ?? "";
  const imageParams = new URLSearchParams();
  if (result) {
    imageParams.set("status", result.status);
    if (result.name) imageParams.set("nama", result.name);
    imageParams.set("nim", nim);
    if (division) imageParams.set("divisi", division);
  }
  const query = imageParams.toString();

  const accepted = result?.status === "ACCEPTED";
  const title = accepted
    ? division
      ? `Diterima di divisi ${division}`
      : "Diterima pada Open Recruitment HIMATRIS"
    : result
      ? "Hasil seleksi Open Recruitment HIMATRIS"
      : "Open Recruitment HIMATRIS";
  const description = result
    ? "Hasil seleksi Open Recruitment HIMATRIS. Cek hasil seleksimu dengan NIM."
    : "Pendaftaran dan seleksi anggota baru Himpunan Mahasiswa Komputer dan Bisnis.";

  const ogImage = {
    url: `/og${query ? `?${query}` : ""}`,
    width: 1200,
    height: 630,
    alt: title,
  };

  return {
    metadataBase,
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "HIMATRIS",
      locale: "id_ID",
      type: "website",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url],
    },
  };
}

export default function Page() {
  return <LandingPage />;
}
