package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type HealthHandler struct {
	DB *pgxpool.Pool
}

func (h *HealthHandler) Health(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()

	dbStatus := "up"
	if err := h.DB.Ping(ctx); err != nil {
		dbStatus = "down"
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Server berjalan.",
		"data": gin.H{
			"status":   "ok",
			"database": dbStatus,
			"time":     time.Now().UTC(),
		},
	})
}
