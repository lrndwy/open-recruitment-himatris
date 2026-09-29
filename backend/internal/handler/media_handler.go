package handler

import (
	"bytes"
	"errors"
	"image"
	"image/color"
	draw "image/draw"
	"image/jpeg"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	xdraw "golang.org/x/image/draw"
	_ "golang.org/x/image/webp" // daftarkan decoder WEBP ke image.Decode

	"himatris-oprec-backend/internal/cache"
	"himatris-oprec-backend/internal/config"
)

// Gambar landing page: foto hero dan gambar per divisi.
// File disimpan di storage/<dir>/<uuid>.jpg dan diakses publik lewat /storage/...
const (
	landingHeroKey = "landing_hero"

	// Batas file yang diterima (sebelum dikompres). Foto dari kamera HP
	// biasanya 3-8 MB, jadi batasnya dinaikkan tapi hasil simpannya kecil.
	maxImageSize = 8 << 20

	imageQuality      = 82
	divisionImageMaxW = 1280
	heroImageMaxW     = 1920
)

var allowedImageExts = map[string]bool{"jpg": true, "jpeg": true, "png": true, "webp": true}

type MediaHandler struct {
	DB    *pgxpool.Pool
	Cfg   *config.Config
	Cache *cache.Cache
}

// prosesGambar mengecilkan gambar ke lebar maksimum lalu meng-encode ulang jadi
// JPEG. Ini yang menjaga storage dan bandwidth tetap kecil: foto 4000 px dari HP
// (5 MB) jadi sekitar 200-400 KB tanpa terlihat pecah.
func prosesGambar(data []byte, maxWidth int) ([]byte, error) {
	src, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, err
	}

	bounds := src.Bounds()
	width, height := bounds.Dx(), bounds.Dy()
	if width <= 0 || height <= 0 {
		return nil, errors.New("ukuran gambar tidak valid")
	}
	if width > maxWidth {
		height = height * maxWidth / width
		width = maxWidth
	}

	// JPEG tidak menyimpan alpha, jadi gambar transparan diletakkan di atas
	// latar putih; scaling sekaligus menggabungkan alpha-nya.
	dst := image.NewRGBA(image.Rect(0, 0, width, height))
	draw.Draw(dst, dst.Bounds(), image.NewUniform(color.White), image.Point{}, draw.Src)
	if width == bounds.Dx() && height == bounds.Dy() {
		draw.Draw(dst, dst.Bounds(), src, bounds.Min, draw.Over)
	} else {
		xdraw.CatmullRom.Scale(dst, dst.Bounds(), src, bounds, xdraw.Over, nil)
	}

	var out bytes.Buffer
	if err := jpeg.Encode(&out, dst, &jpeg.Options{Quality: imageQuality}); err != nil {
		return nil, err
	}
	return out.Bytes(), nil
}

// simpanGambar memvalidasi file gambar multipart, mengompresnya, lalu
// menyimpannya ke storage/<dir>/<uuid>.jpg.
// Kalau gagal, respons error sudah dikirim dan ok bernilai false.
func (h *MediaHandler) simpanGambar(c *gin.Context, field, dir string, maxWidth int) (string, bool) {
	fh, err := c.FormFile(field)
	if err != nil {
		respondError(c, http.StatusUnprocessableEntity, "File gambar wajib diunggah.", "INVALID_IMAGE")
		return "", false
	}

	ext := strings.ToLower(strings.TrimPrefix(filepath.Ext(fh.Filename), "."))
	if fh.Size == 0 || fh.Size > maxImageSize || !allowedImageExts[ext] {
		respondError(c, http.StatusUnprocessableEntity,
			"Gambar harus berupa JPG, PNG, atau WEBP dengan ukuran maksimal 8 MB.", "INVALID_IMAGE")
		return "", false
	}

	file, err := fh.Open()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Gambar gagal dibaca.", "INTERNAL_SERVER_ERROR")
		return "", false
	}
	defer file.Close()

	raw, err := io.ReadAll(file)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Gambar gagal dibaca.", "INTERNAL_SERVER_ERROR")
		return "", false
	}

	processed, err := prosesGambar(raw, maxWidth)
	if err != nil {
		respondError(c, http.StatusUnprocessableEntity, "File gambar tidak dikenali.", "INVALID_IMAGE")
		return "", false
	}

	// Hasil selalu JPEG, jadi nama file pun berakhiran .jpg.
	relPath := filepath.Join(dir, uuid.NewString()+".jpg")
	absPath := filepath.Join(h.Cfg.StoragePath, relPath)
	if err := os.MkdirAll(filepath.Dir(absPath), 0o755); err != nil {
		respondError(c, http.StatusInternalServerError, "Gambar gagal disimpan.", "INTERNAL_SERVER_ERROR")
		return "", false
	}
	if err := os.WriteFile(absPath, processed, 0o644); err != nil {
		respondError(c, http.StatusInternalServerError, "Gambar gagal disimpan.", "INTERNAL_SERVER_ERROR")
		return "", false
	}

	origKB := len(raw) / 1024
	newKB := len(processed) / 1024
	if origKB > 0 {
		log.Printf("gambar %s: %d KB -> %d KB (%d%%)", relPath, origKB, newKB, newKB*100/origKB)
	}

	return relPath, true
}

// hapusGambar membuang file lama setelah diganti atau dihapus. File yang sudah
// tidak ada di disk diabaikan.
func (h *MediaHandler) hapusGambar(relPath *string) {
	if relPath == nil || *relPath == "" {
		return
	}
	_ = os.Remove(filepath.Join(h.Cfg.StoragePath, *relPath))
}

// PUT /admin/divisions/:id/image
func (h *MediaHandler) UploadDivisionImage(c *gin.Context) {
	var oldPath *string
	err := h.DB.QueryRow(c,
		`SELECT image_path FROM divisions WHERE id = $1 AND deleted_at IS NULL`, c.Param("id"),
	).Scan(&oldPath)
	if errors.Is(err, pgx.ErrNoRows) {
		respondError(c, http.StatusNotFound, "Divisi tidak ditemukan.", "NOT_FOUND")
		return
	}
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	relPath, ok := h.simpanGambar(c, "image", "divisions", divisionImageMaxW)
	if !ok {
		return
	}

	if _, err := h.DB.Exec(c,
		`UPDATE divisions SET image_path = $1, updated_at = now() WHERE id = $2`, relPath, c.Param("id"),
	); err != nil {
		h.hapusGambar(&relPath)
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	h.hapusGambar(oldPath)
	h.Cache.Del(c.Request.Context(), cache.KeyDivisions)
	respondSuccess(c, http.StatusOK, "Gambar divisi berhasil diunggah.", gin.H{"image_path": relPath})
}

// DELETE /admin/divisions/:id/image
func (h *MediaHandler) DeleteDivisionImage(c *gin.Context) {
	var oldPath *string
	err := h.DB.QueryRow(c,
		`SELECT image_path FROM divisions WHERE id = $1 AND deleted_at IS NULL`, c.Param("id"),
	).Scan(&oldPath)
	if errors.Is(err, pgx.ErrNoRows) {
		respondError(c, http.StatusNotFound, "Divisi tidak ditemukan.", "NOT_FOUND")
		return
	}
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	if _, err := h.DB.Exec(c,
		`UPDATE divisions SET image_path = NULL, updated_at = now() WHERE id = $1`, c.Param("id"),
	); err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	h.hapusGambar(oldPath)
	h.Cache.Del(c.Request.Context(), cache.KeyDivisions)
	respondSuccess(c, http.StatusOK, "Gambar divisi berhasil dihapus.", nil)
}

// PUT /admin/landing-hero
func (h *MediaHandler) UploadLandingHero(c *gin.Context) {
	var oldPath *string
	err := h.DB.QueryRow(c, `SELECT value FROM site_settings WHERE key = $1`, landingHeroKey).Scan(&oldPath)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	relPath, ok := h.simpanGambar(c, "image", "landing", heroImageMaxW)
	if !ok {
		return
	}

	if _, err := h.DB.Exec(c,
		`INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2, now())
		 ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
		landingHeroKey, relPath,
	); err != nil {
		h.hapusGambar(&relPath)
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	h.hapusGambar(oldPath)
	h.Cache.Del(c.Request.Context(), cache.KeySettings)
	respondSuccess(c, http.StatusOK, "Foto landing page berhasil diunggah.", gin.H{"landing_hero_path": relPath})
}

// DELETE /admin/landing-hero
func (h *MediaHandler) DeleteLandingHero(c *gin.Context) {
	var oldPath *string
	err := h.DB.QueryRow(c, `SELECT value FROM site_settings WHERE key = $1`, landingHeroKey).Scan(&oldPath)
	if errors.Is(err, pgx.ErrNoRows) {
		respondError(c, http.StatusNotFound, "Belum ada foto landing page.", "NOT_FOUND")
		return
	}
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	if _, err := h.DB.Exec(c, `DELETE FROM site_settings WHERE key = $1`, landingHeroKey); err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	h.hapusGambar(oldPath)
	h.Cache.Del(c.Request.Context(), cache.KeySettings)
	respondSuccess(c, http.StatusOK, "Foto landing page berhasil dihapus.", nil)
}

// GET /public/settings
func (h *MediaHandler) GetPublicSettings(c *gin.Context) {
	var heroPath *string
	err := h.DB.QueryRow(c, `SELECT value FROM site_settings WHERE key = $1`, landingHeroKey).Scan(&heroPath)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	respondSuccess(c, http.StatusOK, "Pengaturan berhasil diambil.", gin.H{
		"landing_hero_path": heroPath,
	})
}
