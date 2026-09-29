import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/*
  Rute ini SENGAJA di `/og`, bukan `/api/og`: reverse proxy produksi mengarahkan
  seluruh prefix `/api` ke backend Go, jadi kartu preview share akan 404 dan
  gambarnya tidak pernah muncul kalau ditaruh di sana.
*/

// Warna ditulis sebagai hex karena satori tidak mendukung oklch().
const COLORS = {
  bg: "#09090b",
  panel: "#18181b",
  border: "#ffffff1a",
  foreground: "#f4f4f5",
  muted: "#a1a1aa",
  accent: "#2b7fff",
  accepted: "#34d399",
  pending: "#fbbf24",
  rejected: "#fb7185",
};

const STATUS_TEXT = {
  ACCEPTED: { label: "DITERIMA", color: COLORS.accepted },
  PENDING: { label: "MENUNGGU SELEKSI", color: COLORS.pending },
  REJECTED: { label: "TIDAK DITERIMA", color: COLORS.rejected },
} as const;

// Logo diambil dari public/ supaya kartu tetap punya identitas brand.
// Kalau file tidak ada, kartu tetap dibuat tanpa logo.
async function logoDataUri(): Promise<string | null> {
  try {
    const file = await readFile(join(process.cwd(), "public/logo.png"));
    return `data:image/png;base64,${file.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusKey = searchParams.get("status")?.toUpperCase() ?? "";
  const division = searchParams.get("divisi")?.trim() ?? "";
  const name = searchParams.get("nama")?.trim() ?? "";
  const nim = searchParams.get("nim")?.trim() ?? "";
  const status = STATUS_TEXT[statusKey as keyof typeof STATUS_TEXT];
  const logo = await logoDataUri();

  const headline = status ? status.label : "OPEN RECRUITMENT";
  const accent = status ? status.color : COLORS.accent;
  // Nama dan NIM diisi pemanggil (halaman hasil & kartu preview) supaya gambar
  // yang dibagikan menampilkan identitas pendaftar, bukan cuma statusnya.
  const detail = [nim && `NIM ${nim}`, division && `Divisi ${division}`]
    .filter(Boolean)
    .join(" • ");
  const subline = detail || "Himpunan Mahasiswa Komputer dan Bisnis";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: COLORS.bg,
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" width={72} height={72} />
          )}
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: COLORS.foreground }}>
            HIMATRIS
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", width: 56, height: 6, background: accent }} />
            <div
              style={{
                display: "flex",
                fontSize: 24,
                letterSpacing: 6,
                fontWeight: 600,
                color: COLORS.muted,
              }}
            >
              HASIL SELEKSI
            </div>
          </div>

          <div style={{ display: "flex", fontSize: 96, fontWeight: 800, color: accent, lineHeight: 1.1 }}>
            {headline}
          </div>

          {name && (
            <div
              style={{
                display: "flex",
                fontSize: 72,
                fontWeight: 700,
                color: COLORS.foreground,
                lineHeight: 1.2,
                maxWidth: 1056,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {name}
            </div>
          )}

          <div style={{ display: "flex", fontSize: 40, color: COLORS.muted, maxWidth: 1056, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {subline}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: `2px solid ${COLORS.border}`,
            paddingTop: 28,
            fontSize: 26,
            color: COLORS.muted,
          }}
        >
          <div style={{ display: "flex" }}>Open Recruitment HIMATRIS 2026</div>
          <div style={{ display: "flex", color: COLORS.foreground }}>oprek-himatris.teknostudio.id</div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
