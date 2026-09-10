package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DashboardHandler struct {
	DB *pgxpool.Pool
}

// GET /admin/dashboard
func (h *DashboardHandler) GetDashboard(c *gin.Context) {
	var total, pending, accepted, rejected int
	err := h.DB.QueryRow(c,
		`SELECT count(*),
			count(*) FILTER (WHERE selection_status = 'PENDING'),
			count(*) FILTER (WHERE selection_status = 'ACCEPTED'),
			count(*) FILTER (WHERE selection_status = 'REJECTED')
		 FROM applicants`).Scan(&total, &pending, &accepted, &rejected)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	var divisions, programStudies int
	err = h.DB.QueryRow(c,
		`SELECT (SELECT count(*) FROM divisions WHERE deleted_at IS NULL),
		 (SELECT count(*) FROM program_studies WHERE deleted_at IS NULL)`).
		Scan(&divisions, &programStudies)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	var regName any
	var startAt, endAt any
	err = h.DB.QueryRow(c,
		`SELECT name, start_at, end_at FROM registration_periods
		 WHERE now() >= start_at AND now() <= end_at
		 ORDER BY start_at DESC LIMIT 1`).Scan(&regName, &startAt, &endAt)
	reg := gin.H{}
	switch {
	case errors.Is(err, pgx.ErrNoRows):
		reg["status"] = "CLOSED"
	case err != nil:
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	default:
		reg["status"] = "OPEN"
		reg["name"] = regName
	}

	respondSuccess(c, http.StatusOK, "Dashboard berhasil diambil.", gin.H{
		"applicants": gin.H{
			"total":    total,
			"pending":  pending,
			"accepted": accepted,
			"rejected": rejected,
		},
		"master_data": gin.H{
			"divisions":       divisions,
			"program_studies": programStudies,
		},
		"registration": reg,
	})
}
