package router

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"himatris-oprec-backend/internal/cache"
	"himatris-oprec-backend/internal/config"
	"himatris-oprec-backend/internal/handler"
	"himatris-oprec-backend/internal/middleware"
)

// Konten publik di-cache singkat: cukup untuk menyerap lonjakan pengunjung,
// tapi perubahan dari admin tetap cepat terlihat (dan di-invalidate langsung
// pada operasi tulis).
const publicCacheTTL = 30 * time.Second

// Batas permintaan per IP. Dibuat longgar supaya pengunjung yang berbagi satu
// IP (WiFi kampus/kos) tidak ikut terblokir, tapi tetap menutup penyalahgunaan.
const (
	resultLookupLimit = 120
	applicationLimit  = 20
	rateLimitWindow   = time.Minute
)

func New(cfg *config.Config, pool *pgxpool.Pool, c *cache.Cache) *gin.Engine {
	r := gin.Default()

	// Hanya proxy internal (Traefik/Dokploy) yang dipercaya membaca
	// X-Forwarded-For, supaya IP pengunjung tidak bisa dipalsukan lewat header.
	_ = r.SetTrustedProxies([]string{"127.0.0.1", "::1", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"})

	corsConfig := cors.Config{
		AllowOrigins: []string{cfg.FrontendURL},
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "Authorization"},
	}
	r.Use(cors.New(corsConfig))

	api := r.Group("/api/v1")

	// File uploads served di bawah /api/v1 agar dirutekan ke backend oleh reverse proxy
	api.Use(middleware.ImmutableCache("/api/v1/storage/divisions/", "/api/v1/storage/landing/"))
	api.Static("/storage", cfg.StoragePath)

	healthHandler := &handler.HealthHandler{DB: pool, Cache: c}
	api.GET("/health", healthHandler.Health)

	authHandler := &handler.AuthHandler{DB: pool, Cfg: cfg}
	api.POST("/auth/register", authHandler.Register)
	api.POST("/auth/login", authHandler.Login)

	publicHandler := &handler.PublicHandler{DB: pool, Cfg: cfg}
	mediaHandler := &handler.MediaHandler{DB: pool, Cfg: cfg, Cache: c}
	public := api.Group("/public")
	public.GET("/registration", middleware.CacheResponse(c, cache.KeyRegistration, publicCacheTTL), publicHandler.GetRegistration)
	public.GET("/settings", middleware.CacheResponse(c, cache.KeySettings, publicCacheTTL), mediaHandler.GetPublicSettings)
	public.GET("/divisions", middleware.CacheResponse(c, cache.KeyDivisions, publicCacheTTL), publicHandler.ListDivisions)
	public.GET("/program-studies", middleware.CacheResponse(c, cache.KeyProgramStudies, publicCacheTTL), publicHandler.ListProgramStudies)
	public.POST("/applications", middleware.RateLimit(c, "applications", applicationLimit, rateLimitWindow), publicHandler.CreateApplication)
	public.GET("/result", middleware.RateLimit(c, "result", resultLookupLimit, rateLimitWindow), publicHandler.GetResult)

	admin := api.Group("/admin", middleware.RequireAuth(cfg.JWTSecret))

	divisionHandler := &handler.DivisionHandler{DB: pool, Cache: c}
	admin.GET("/divisions", divisionHandler.List)
	admin.POST("/divisions", divisionHandler.Create)
	admin.PUT("/divisions/:id", divisionHandler.Update)
	admin.DELETE("/divisions/:id", divisionHandler.Delete)
	admin.PUT("/divisions/:id/image", mediaHandler.UploadDivisionImage)
	admin.DELETE("/divisions/:id/image", mediaHandler.DeleteDivisionImage)

	admin.PUT("/landing-hero", mediaHandler.UploadLandingHero)
	admin.DELETE("/landing-hero", mediaHandler.DeleteLandingHero)

	programStudyHandler := &handler.ProgramStudyHandler{DB: pool, Cache: c}
	admin.GET("/program-studies", programStudyHandler.List)
	admin.POST("/program-studies", programStudyHandler.Create)
	admin.PUT("/program-studies/:id", programStudyHandler.Update)
	admin.DELETE("/program-studies/:id", programStudyHandler.Delete)

	registrationPeriodHandler := &handler.RegistrationPeriodHandler{DB: pool, Cache: c}
	admin.GET("/registration-periods", registrationPeriodHandler.List)
	admin.GET("/registration-periods/active", registrationPeriodHandler.GetActive)
	admin.POST("/registration-periods", registrationPeriodHandler.Create)
	admin.PUT("/registration-periods/:id", registrationPeriodHandler.Update)
	admin.DELETE("/registration-periods/:id", registrationPeriodHandler.Delete)

	applicantHandler := &handler.ApplicantHandler{DB: pool, Cfg: cfg}
	admin.GET("/applicants", applicantHandler.List)
	admin.GET("/applicants/:id", applicantHandler.Get)
	admin.DELETE("/applicants/:id", applicantHandler.Delete)
	admin.POST("/applicants/bulk-delete", applicantHandler.BulkDelete)
	admin.PATCH("/applicants/:id/status", applicantHandler.UpdateStatus)
	admin.GET("/applicants/:id/cv", applicantHandler.GetCV)
	admin.GET("/applicants/:id/portfolio", applicantHandler.GetPortfolio)
	admin.GET("/applicants/:id/poster", applicantHandler.GetPoster)
	admin.GET("/applicants/:id/parental-consent", applicantHandler.GetParentalConsent)

	dashboardHandler := &handler.DashboardHandler{DB: pool}
	admin.GET("/dashboard", dashboardHandler.GetDashboard)

	exportHandler := &handler.ExportHandler{DB: pool}
	admin.GET("/export/applicants", exportHandler.ExportApplicants)

	importHandler := &handler.ImportHandler{DB: pool}
	admin.GET("/import/applicants/template", importHandler.DownloadTemplate)
	admin.POST("/import/applicants", importHandler.ImportApplicants)

	adminHandler := &handler.AdminHandler{DB: pool}
	admin.GET("/users", adminHandler.List)
	admin.GET("/users/:id", adminHandler.Get)
	admin.POST("/users", adminHandler.Create)
	admin.PUT("/users/:id", adminHandler.Update)
	admin.DELETE("/users/:id", adminHandler.Delete)
	admin.POST("/users/:id/change-password", adminHandler.ChangePassword)

	return r
}
