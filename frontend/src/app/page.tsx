import type { Metadata } from "next";
import { headers } from "next/headers";

import { LandingPage } from "@/components/landing-page";

type SearchParams = Promise<{ status?: string; divisi?: string }>;

const SHARED_STATUS = ["ACCEPTED", "PENDING", "REJECTED"] as const;
type SharedStatus = (typeof SHARED_STATUS)[number];

function isSharedStatus(value: string | undefined): value is SharedStatus {
  return SHARED_STATUS.includes(value as SharedStatus);
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
  const status = params.status?.toUpperCase();
  const division = params.divisi?.trim();

  // Base URL diambil dari request supaya og:image tetap absolut di domain mana pun.
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "https";
  const metadataBase = host ? new URL(`${protocol}://${host}`) : undefined;

  const imageParams = new URLSearchParams();
  if (isSharedStatus(status)) imageParams.set("status", status);
  if (division) imageParams.set("divisi", division);
  const query = imageParams.toString();
  const ogImage = { url: `/api/og${query ? `?${query}` : ""}`, width: 1200, height: 630 };

  const shared = isSharedStatus(status);
  const title = shared
    ? division
      ? `Diterima di divisi ${division}`
      : "Hasil seleksi Open Recruitment HIMATRIS"
    : "Open Recruitment HIMATRIS";
  const description = shared
    ? "Hasil seleksi Open Recruitment HIMATRIS. Cek hasil seleksimu dengan NIM."
    : "Pendaftaran dan seleksi anggota baru Himpunan Mahasiswa Komputer dan Bisnis.";

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
