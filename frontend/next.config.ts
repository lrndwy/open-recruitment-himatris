import type { NextConfig } from "next";

// Origin backend dipakai di connect-src/img-src; nilainya sama dengan yang
// dipakai lib/api.ts supaya CSP tidak memblokir panggilan API sendiri.
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
const apiOrigin = new URL(apiUrl).origin;

// 'unsafe-inline' dibutuhkan Next.js (bootstrap script & style inline) dan
// 'unsafe-eval' hanya di development (HMR/source map). Kalau nanti tambah
// skrip dari domain lain, tambahkan domainnya di script-src — jangan longgarkan
// ke 'unsafe-eval'.
const csp = [
  "default-src 'self'",
  process.env.NODE_ENV === "production"
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  // picsum.photos hanya dipakai sebagai foto hero cadangan saat admin belum
  // mengunggah foto (lihat HERO_FALLBACK_PHOTO di components/landing-page.tsx).
  // fastly.* ikut didaftarkan karena picsum mengalihkan permintaan ke sana.
  // Keduanya bisa dihapus begitu foto hero asli sudah diunggah.
  `img-src 'self' data: blob: ${apiOrigin} https://picsum.photos https://fastly.picsum.photos`,
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
