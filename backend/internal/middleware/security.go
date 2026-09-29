package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// maxBodySize membatasi ukuran body satu permintaan. Unggahan multipart
// disimpan ke berkas temp sebelum handler sempat memeriksa ukuran tiap berkas,
// jadi tanpa batas ini siapa pun bisa mengisi disk server. Nilainya di atas
// total unggahan terbesar yang sah (form pendaftaran: 4 berkas x 5 MB).
const maxBodySize = 30 << 20

// SecurityHeaders memasang header keamanan dasar pada semua respons.
// CSP tidak di sini karena API hanya mengembalikan JSON/berkas; CSP halaman
// diatur Next.js (lihat frontend/next.config.ts).
func SecurityHeaders(production bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		h := c.Writer.Header()
		// Berkas unggahan (PDF/gambar) tidak boleh ditebak browser sebagai HTML.
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("X-Frame-Options", "DENY")
		h.Set("Referrer-Policy", "no-referrer")
		h.Set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()")
		if production {
			// Hanya bermakna kalau situs diakses lewat HTTPS (reverse proxy).
			h.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}
		c.Next()
	}
}

// MaxBody menolak body permintaan yang melebihi batas dengan 413.
func MaxBody() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Body != nil {
			c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBodySize)
		}
		c.Next()
	}
}
