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
	"himatris-oprec-backend/internal/cache"
	"himatris-oprec-backend/internal/config"
	"himatris-oprec-backend/internal/database"
	"himatris-oprec-backend/internal/router"
)

func main() {
	cfg := config.Load()

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
