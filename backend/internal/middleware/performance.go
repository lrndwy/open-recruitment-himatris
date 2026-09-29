package middleware

import (
	"bytes"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"himatris-oprec-backend/internal/cache"
)

// bodyWriter menyimpan body respons sambil tetap meneruskannya ke client.
type bodyWriter struct {
	gin.ResponseWriter
	status int
	body   bytes.Buffer
}

func (w *bodyWriter) WriteHeader(code int) {
	w.status = code
	w.ResponseWriter.WriteHeader(code)
}

func (w *bodyWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

func (w *bodyWriter) WriteString(s string) (int, error) {
	w.body.WriteString(s)
	return w.ResponseWriter.WriteString(s)
}

type cachedResponse struct {
	Status int             `json:"status"`
	Body   json.RawMessage `json:"body"`
}

// CacheResponse menyimpan respons JSON endpoint publik di Redis. Endpoint
// dengan lalu lintas tinggi (halaman depan) jadi tidak selalu menekan database.
func CacheResponse(c *cache.Cache, key string, ttl time.Duration) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		if ctx.Request.Method != http.MethodGet || !c.Enabled() {
			ctx.Next()
			return
		}

		var hit cachedResponse
		if c.GetJSON(ctx.Request.Context(), key, &hit) && hit.Status == http.StatusOK {
			ctx.Data(hit.Status, "application/json; charset=utf-8", hit.Body)
			ctx.Abort()
			return
		}

		rec := &bodyWriter{ResponseWriter: ctx.Writer, status: http.StatusOK}
		ctx.Writer = rec
		ctx.Next()

		if rec.status == http.StatusOK && rec.body.Len() > 0 && ctx.Writer.Written() {
			c.SetJSON(ctx.Request.Context(), key, cachedResponse{
				Status: rec.status,
				Body:   json.RawMessage(rec.body.Bytes()),
			}, ttl)
		}
	}
}

// RateLimit membatasi permintaan per IP memakai Redis. Kalau Redis mati,
// permintaan dilewatkan apa adanya supaya situs tetap melayani.
func RateLimit(c *cache.Cache, name string, limit int, window time.Duration) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		if !c.Allow(ctx.Request.Context(), "rl:"+name+":"+clientIP(ctx), limit, window) {
			ctx.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"message": "Terlalu banyak permintaan. Coba lagi sebentar lagi.",
				"error":   gin.H{"code": "TOO_MANY_REQUESTS"},
			})
			return
		}
		ctx.Next()
	}
}

func clientIP(ctx *gin.Context) string {
	if ip := ctx.ClientIP(); ip != "" {
		return ip
	}
	return ctx.Request.RemoteAddr
}

// ImmutableCache menandai file gambar publik (divisi & landing page) supaya
// boleh di-cache lama, baik oleh browser maupun proxy di depan.
// Nama filenya UUID, jadi isi satu URL tidak pernah berubah.
//
// ponytail: hanya dua prefix ini yang diberi cache panjang; berkas pendaftar
// (CV dsb) sengaja tidak, karena isinya sensitif dan harus bisa dicabut.
func ImmutableCache(prefixes ...string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		path := ctx.Request.URL.Path
		for _, prefix := range prefixes {
			if strings.HasPrefix(path, prefix) {
				ctx.Header("Cache-Control", "public, max-age=31536000, immutable")
				break
			}
		}
		ctx.Next()
	}
}
