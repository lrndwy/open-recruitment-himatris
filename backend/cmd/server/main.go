package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"himatris-oprec-backend/internal/cache"
	"himatris-oprec-backend/internal/config"
	"himatris-oprec-backend/internal/database"
	"himatris-oprec-backend/internal/router"
)

func main() {
	cfg := config.Load()
	if err := cfg.Validate(); err != nil {
		log.Fatalf("konfigurasi tidak aman: %v", err)
	}

	ctx := context.Background()
	pool, err := database.Connect(ctx, cfg.DatabaseURL(), cfg.MaxDBConns)
	if err != nil {
		log.Fatalf("gagal terhubung ke database: %v", err)
	}
	defer pool.Close()

	cacheClient := cache.New(cfg.RedisURL)
	defer cacheClient.Close()

	if err := database.Migrate(ctx, pool, "migrations"); err != nil {
		log.Fatalf("migrasi gagal: %v", err)
	}

	peringatkanAdminDefault(ctx, pool)

	if err := os.MkdirAll(filepath.Join(cfg.StoragePath, "cvs"), 0755); err != nil {
		log.Fatalf("gagal membuat direktori storage: %v", err)
	}

	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := router.New(cfg, pool, cacheClient)

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,

		// Batas waktu supaya koneksi yang menggantung tidak menahan resource
		// server ketika pengunjung ramai.
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       60 * time.Second,  // unggah berkas sampai 8 MB
		WriteTimeout:      120 * time.Second, // ekspor Excel / unduh berkas
		IdleTimeout:       120 * time.Second,
	}

	go func() {
		log.Printf("server berjalan di port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server error: %v", err)
		}
	}()
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("mematikan server...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("shutdown error: %v", err)
	}
	log.Println("server berhenti.")
}

// seedAdminPasswordHash adalah hash bcrypt password "admin123" dari migrasi
// 010_seed.sql. Migrasi ikut jalan di produksi, jadi akun default itu ada di
// database sampai passwordnya diganti — dan password default = pintu belakang.
const seedAdminPasswordHash = "$2a$10$m.jM2cyHVZOwYNiUUHgr.e2onU1ufRPynzlSRvLmHHJQAMe9flAjq"

// peringatkanAdminDefault mencatat peringatan keras kalau masih ada akun admin
// yang memakai password default. Sengaja tidak fatal: server harus tetap hidup
// supaya passwordnya bisa diganti dari panel admin.
func peringatkanAdminDefault(ctx context.Context, pool *pgxpool.Pool) {
	var jumlah int
	if err := pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM admins WHERE password_hash = $1`, seedAdminPasswordHash,
	).Scan(&jumlah); err != nil {
		return
	}
	if jumlah > 0 {
		log.Printf("PERINGATAN KEAMANAN: %d akun admin masih memakai password default dari seed migrasi (admin123). "+
			"Segera ganti lewat menu Kelola Admin.", jumlah)
	}
}
