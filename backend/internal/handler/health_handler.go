package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"himatris-oprec-backend/internal/cache"
)

type HealthHandler struct {
	DB    *pgxpool.Pool
	Cache *cache.Cache
}

func (h *HealthHandler) Health(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()

	dbStatus := "up"
	if err := h.DB.Ping(ctx); err != nil {
		dbStatus = "down"
	}

	// Redis hanya lapisan percepatan: kalau mati, situs tetap melayani
	// permintaan, jadi health check HTTP tetap 200 dan container tidak
	// ikut di-restart.
	cacheStatus := "disabled"
	if h.Cache != nil && h.Cache.Enabled() {
		cacheStatus = "up"
		if !h.Cache.Ping(ctx) {
			cacheStatus = "down"
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Server berjalan.",
		"data": gin.H{
			"status":   "ok",
			"database": dbStatus,
			"cache":    cacheStatus,
			"time":     time.Now().UTC(),
		},
	})
}
