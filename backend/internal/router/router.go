package router

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"himatris-oprec-backend/internal/config"
	"himatris-oprec-backend/internal/handler"
	"himatris-oprec-backend/internal/middleware"
)

func New(cfg *config.Config, pool *pgxpool.Pool) *gin.Engine {
	r := gin.Default()

	corsConfig := cors.Config{
		AllowOrigins: []string{cfg.FrontendURL},
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "Authorization"},
	}
	r.Use(cors.New(corsConfig))

	r.Static("/storage", cfg.StoragePath)

	api := r.Group("/api/v1")

	healthHandler := &handler.HealthHandler{DB: pool}
	api.GET("/health", healthHandler.Health)

	authHandler := &handler.AuthHandler{DB: pool, Cfg: cfg}
	api.POST("/auth/register", authHandler.Register)
	api.POST("/auth/login", authHandler.Login)

	publicHandler := &handler.PublicHandler{DB: pool, Cfg: cfg}
	public := api.Group("/public")
	public.GET("/registration", publicHandler.GetRegistration)
	public.GET("/divisions", publicHandler.ListDivisions)
	public.GET("/program-studies", publicHandler.ListProgramStudies)
	public.POST("/applications", publicHandler.CreateApplication)
	public.GET("/result", publicHandler.GetResult)

	admin := api.Group("/admin", middleware.RequireAuth(cfg.JWTSecret))

	divisionHandler := &handler.DivisionHandler{DB: pool}
	admin.GET("/divisions", divisionHandler.List)
	admin.POST("/divisions", divisionHandler.Create)
	admin.PUT("/divisions/:id", divisionHandler.Update)
	admin.DELETE("/divisions/:id", divisionHandler.Delete)

	programStudyHandler := &handler.ProgramStudyHandler{DB: pool}
	admin.GET("/program-studies", programStudyHandler.List)
	admin.POST("/program-studies", programStudyHandler.Create)
	admin.PUT("/program-studies/:id", programStudyHandler.Update)
	admin.DELETE("/program-studies/:id", programStudyHandler.Delete)

	registrationPeriodHandler := &handler.RegistrationPeriodHandler{DB: pool}
	admin.GET("/registration-periods", registrationPeriodHandler.List)
	admin.GET("/registration-periods/active", registrationPeriodHandler.GetActive)
	admin.POST("/registration-periods", registrationPeriodHandler.Create)
	admin.PUT("/registration-periods/:id", registrationPeriodHandler.Update)
	admin.DELETE("/registration-periods/:id", registrationPeriodHandler.Delete)

	applicantHandler := &handler.ApplicantHandler{DB: pool, Cfg: cfg}
	admin.GET("/applicants", applicantHandler.List)
	admin.GET("/applicants/:id", applicantHandler.Get)
	admin.PATCH("/applicants/:id/status", applicantHandler.UpdateStatus)
	admin.GET("/applicants/:id/cv", applicantHandler.GetCV)
	admin.GET("/applicants/:id/portfolio", applicantHandler.GetPortfolio)
	admin.GET("/applicants/:id/poster", applicantHandler.GetPoster)

	dashboardHandler := &handler.DashboardHandler{DB: pool}
	admin.GET("/dashboard", dashboardHandler.GetDashboard)

	exportHandler := &handler.ExportHandler{DB: pool}
	admin.GET("/export/applicants", exportHandler.ExportApplicants)

	adminHandler := &handler.AdminHandler{DB: pool}
	admin.GET("/users", adminHandler.List)
	admin.GET("/users/:id", adminHandler.Get)
	admin.POST("/users", adminHandler.Create)
	admin.PUT("/users/:id", adminHandler.Update)
	admin.DELETE("/users/:id", adminHandler.Delete)
	admin.POST("/users/:id/change-password", adminHandler.ChangePassword)

	return r
}
