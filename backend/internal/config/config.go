package config

import (
	"errors"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// minJWTSecretLen: HMAC-SHA256 dengan secret pendek/tebakan bisa di-brute force
// offline, dan token yang dipalsukan = akses penuh ke panel admin.
const minJWTSecretLen = 32

type Config struct {
	Port         string
	Env          string
	DatabaseHost string
	DatabasePort string
	DatabaseName string
	DatabaseUser string
	DatabasePass string
	JWTSecret    string
	JWTExpiresIn int64
	StoragePath  string
	MaxCVSize    int64
	FrontendURL  string
	BaseURL      string
	RedisURL     string
	MaxDBConns   int32
}

func Load() *Config {
	_ = godotenv.Load()

	return &Config{
		Port:         getEnv("PORT", "8080"),
		Env:          getEnv("ENV", "development"),
		DatabaseHost: getEnv("DATABASE_HOST", "localhost"),
		DatabasePort: getEnv("DATABASE_PORT", "5432"),
		DatabaseName: getEnv("DATABASE_NAME", "himatris_oprec"),
		DatabaseUser: getEnv("DATABASE_USER", "postgres"),
		DatabasePass: getEnv("DATABASE_PASSWORD", "postgres"),
		JWTSecret:    getEnv("JWT_SECRET", "change-me-in-production"),
		JWTExpiresIn: getEnvInt64("JWT_EXPIRES_IN", 86400),
		StoragePath:  getEnv("STORAGE_PATH", "./storage"),
		MaxCVSize:    getEnvInt64("MAX_CV_SIZE", 5242880),
		FrontendURL:  getEnv("FRONTEND_URL", "http://localhost:3000"),
		BaseURL:      getEnv("BASE_URL", "http://localhost:8080"),
		RedisURL:     getEnv("REDIS_URL", ""),
		MaxDBConns:   int32(getEnvInt64("DB_MAX_CONNS", 25)),
	}
}

// Validate menolak konfigurasi yang berbahaya saat produksi. Di development
// nilai default tetap jalan supaya `go run` tidak menghalangi.
func (c *Config) Validate() error {
	if c.Env != "production" {
		return nil
	}
	if c.JWTSecret == "" || c.JWTSecret == "change-me-in-production" || len(c.JWTSecret) < minJWTSecretLen {
		return errors.New("JWT_SECRET wajib diisi acak minimal 32 karakter di produksi")
	}
	return nil
}

func (c *Config) DatabaseURL() string {
	return "postgres://" + c.DatabaseUser + ":" + c.DatabasePass +
		"@" + c.DatabaseHost + ":" + c.DatabasePort + "/" + c.DatabaseName + "?sslmode=disable"
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt64(key string, fallback int64) int64 {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.ParseInt(v, 10, 64); err == nil {
			return n
		}
	}
	return fallback
}
