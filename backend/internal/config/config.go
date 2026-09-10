package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	Env            string
	DatabaseHost   string
	DatabasePort   string
	DatabaseName   string
	DatabaseUser   string
	DatabasePass   string
	JWTSecret      string
	JWTExpiresIn   int64
	StoragePath    string
	MaxCVSize      int64
	FrontendURL    string
	BaseURL        string
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
	}
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
