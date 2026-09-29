import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
  const status = STATUS_TEXT[statusKey as keyof typeof STATUS_TEXT];
  const logo = await logoDataUri();

  const headline = status ? status.label : "OPEN RECRUITMENT";
  const accent = status ? status.color : COLORS.accent;
  const subline = status
    ? division
      ? `di divisi ${division}`
      : "Himpunan Mahasiswa Komputer dan Bisnis"
    : "Himpunan Mahasiswa Komputer dan Bisnis";

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

          <div style={{ display: "flex", fontSize: 104, fontWeight: 800, color: accent, lineHeight: 1.1 }}>
            {headline}
          </div>

          <div style={{ display: "flex", fontSize: 44, color: COLORS.foreground }}>{subline}</div>
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
          <div style={{ display: "flex" }}>Open Recruitment Mahasiswa Komputer dan Bisnis</div>
          <div style={{ display: "flex", color: COLORS.foreground }}>oprec.himatris.com</div>
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
