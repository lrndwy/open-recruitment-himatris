package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RegistrationPeriodHandler struct {
	DB *pgxpool.Pool
}

type registrationPeriodResponse struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	StartAt   time.Time `json:"start_at"`
	EndAt     time.Time `json:"end_at"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (h *RegistrationPeriodHandler) toResponse(r registrationPeriodRow) registrationPeriodResponse {
	return registrationPeriodResponse{
		ID:        r.ID,
		Name:      r.Name,
		StartAt:   r.StartAt.Time,
		EndAt:     r.EndAt.Time,
		CreatedAt: r.CreatedAt.Time,
		UpdatedAt: r.UpdatedAt.Time,
	}
}

type registrationPeriodRow struct {
	ID        string
	Name      string
	StartAt   pgtype.Timestamptz
	EndAt     pgtype.Timestamptz
	CreatedAt pgtype.Timestamptz
	UpdatedAt pgtype.Timestamptz
}

const periodColumns = `id, name, start_at, end_at, created_at, updated_at`

type periodRequest struct {
	Name    string `json:"name" binding:"required,max=200"`
	StartAt string `json:"start_at" binding:"required"`
	EndAt   string `json:"end_at" binding:"required"`
}

// computeStatus derives UPCOMING/OPEN/CLOSED from now vs start/end.
func computeStatus(start, end time.Time) string {
	now := time.Now()
	switch {
	case now.Before(start):
		return "UPCOMING"
	case now.After(end):
		return "CLOSED"
	default:
		return "OPEN"
	}
}

func (h *RegistrationPeriodHandler) List(c *gin.Context) {
	rows, err := h.DB.Query(c.Request.Context(),
		`SELECT `+periodColumns+` FROM registration_periods ORDER BY start_at DESC`)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Gagal mengambil data periode.", "INTERNAL_SERVER_ERROR")
		return
	}
	defer rows.Close()

	items := []gin.H{}
	for rows.Next() {
		var r registrationPeriodRow
		if err := rows.Scan(&r.ID, &r.Name, &r.StartAt, &r.EndAt, &r.CreatedAt, &r.UpdatedAt); err != nil {
			respondError(c, http.StatusInternalServerError, "Gagal mengambil data periode.", "INTERNAL_SERVER_ERROR")
			return
		}
		p := h.toResponse(r)
		items = append(items, gin.H{
			"id":         p.ID,
			"name":       p.Name,
			"start_at":   p.StartAt,
			"end_at":     p.EndAt,
			"status":     computeStatus(p.StartAt, p.EndAt),
			"created_at": p.CreatedAt,
			"updated_at": p.UpdatedAt,
		})
	}
	respondSuccess(c, http.StatusOK, "Data periode berhasil diambil.", items)
}

func (h *RegistrationPeriodHandler) GetActive(c *gin.Context) {
	var r registrationPeriodRow
	err := h.DB.QueryRow(c.Request.Context(),
		`SELECT `+periodColumns+` FROM registration_periods WHERE now() >= start_at AND now() <= end_at ORDER BY start_at DESC LIMIT 1`).
		Scan(&r.ID, &r.Name, &r.StartAt, &r.EndAt, &r.CreatedAt, &r.UpdatedAt)
	if err == pgx.ErrNoRows {
		respondSuccess(c, http.StatusOK, "Tidak ada periode pendaftaran yang aktif.", nil)
		return
	}
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Gagal mengambil periode aktif.", "INTERNAL_SERVER_ERROR")
		return
	}
	p := h.toResponse(r)
	respondSuccess(c, http.StatusOK, "Periode aktif berhasil diambil.", gin.H{
		"id": p.ID, "name": p.Name, "start_at": p.StartAt, "end_at": p.EndAt, "status": computeStatus(p.StartAt, p.EndAt),
	})
}

func (h *RegistrationPeriodHandler) Create(c *gin.Context) {
	var req periodRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusUnprocessableEntity, "Data tidak valid.", "VALIDATION_ERROR")
		return
	}
	startAt, err := time.Parse(time.RFC3339, req.StartAt)
	if err != nil {
		respondError(c, http.StatusUnprocessableEntity, "Format start_at tidak valid (harus ISO 8601).", "VALIDATION_ERROR")
		return
	}
	endAt, err := time.Parse(time.RFC3339, req.EndAt)
	if err != nil {
		respondError(c, http.StatusUnprocessableEntity, "Format end_at tidak valid (harus ISO 8601).", "VALIDATION_ERROR")
		return
	}
	if !endAt.After(startAt) {
		respondError(c, http.StatusUnprocessableEntity, "Waktu selesai harus setelah waktu mulai.", "VALIDATION_ERROR")
		return
	}

	var r registrationPeriodRow
	err = h.DB.QueryRow(c.Request.Context(),
		`INSERT INTO registration_periods (name, start_at, end_at) VALUES ($1, $2, $3) RETURNING `+periodColumns,
		req.Name, startAt, endAt).
		Scan(&r.ID, &r.Name, &r.StartAt, &r.EndAt, &r.CreatedAt, &r.UpdatedAt)
	if err != nil {
		if isUniqueViolation(err) {
			respondError(c, http.StatusConflict, "Nama periode sudah digunakan.", "DUPLICATE_REGISTRATION_PERIOD")
			return
		}
		respondError(c, http.StatusInternalServerError, "Gagal membuat periode.", "INTERNAL_SERVER_ERROR")
		return
	}
	p := h.toResponse(r)
	respondSuccess(c, http.StatusCreated, "Periode berhasil dibuat.", gin.H{
		"id": p.ID, "name": p.Name, "start_at": p.StartAt, "end_at": p.EndAt,
		"status": computeStatus(p.StartAt, p.EndAt), "created_at": p.CreatedAt, "updated_at": p.UpdatedAt,
	})
}

func (h *RegistrationPeriodHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var req periodRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusUnprocessableEntity, "Data tidak valid.", "VALIDATION_ERROR")
		return
	}
	startAt, err := time.Parse(time.RFC3339, req.StartAt)
	if err != nil {
		respondError(c, http.StatusUnprocessableEntity, "Format start_at tidak valid (harus ISO 8601).", "VALIDATION_ERROR")
		return
	}
	endAt, err := time.Parse(time.RFC3339, req.EndAt)
	if err != nil {
		respondError(c, http.StatusUnprocessableEntity, "Format end_at tidak valid (harus ISO 8601).", "VALIDATION_ERROR")
		return
	}
	if !endAt.After(startAt) {
		respondError(c, http.StatusUnprocessableEntity, "Waktu selesai harus setelah waktu mulai.", "VALIDATION_ERROR")
		return
	}

	var r registrationPeriodRow
	err = h.DB.QueryRow(c.Request.Context(),
		`UPDATE registration_periods SET name=$2, start_at=$3, end_at=$4, updated_at=now() WHERE id=$1 RETURNING `+periodColumns,
		id, req.Name, startAt, endAt).
		Scan(&r.ID, &r.Name, &r.StartAt, &r.EndAt, &r.CreatedAt, &r.UpdatedAt)
	if err == pgx.ErrNoRows {
		respondError(c, http.StatusNotFound, "Periode tidak ditemukan.", "NOT_FOUND")
		return
	}
	if err != nil {
		if isUniqueViolation(err) {
			respondError(c, http.StatusConflict, "Nama periode sudah digunakan.", "DUPLICATE_REGISTRATION_PERIOD")
			return
		}
		respondError(c, http.StatusInternalServerError, "Gagal memperbarui periode.", "INTERNAL_SERVER_ERROR")
		return
	}
	p := h.toResponse(r)
	respondSuccess(c, http.StatusOK, "Periode berhasil diperbarui.", gin.H{
		"id": p.ID, "name": p.Name, "start_at": p.StartAt, "end_at": p.EndAt,
		"status": computeStatus(p.StartAt, p.EndAt), "created_at": p.CreatedAt, "updated_at": p.UpdatedAt,
	})
}

func (h *RegistrationPeriodHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	tag, err := h.DB.Exec(c.Request.Context(),
		`DELETE FROM registration_periods WHERE id=$1`, id)
	if err != nil {
		if isForeignKeyViolation(err) {
			respondError(c, http.StatusConflict, "Periode tidak dapat dihapus karena masih dipakai oleh pendaftar.", "PERIOD_IN_USE")
			return
		}
		respondError(c, http.StatusInternalServerError, "Gagal menghapus periode.", "INTERNAL_SERVER_ERROR")
		return
	}
	if tag.RowsAffected() == 0 {
		respondError(c, http.StatusNotFound, "Periode tidak ditemukan.", "NOT_FOUND")
		return
	}
	respondSuccess(c, http.StatusOK, "Periode berhasil dihapus.", nil)
}
