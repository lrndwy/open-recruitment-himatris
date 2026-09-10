package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DivisionHandler struct {
	DB *pgxpool.Pool
}

func (h *DivisionHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if limit < 1 || limit > 100 {
		limit = 50
	}
	search := c.Query("search")

	where := "deleted_at IS NULL"
	if c.Query("include_deleted") == "true" {
		where = "TRUE"
	}
	args := []any{}
	if search != "" {
		args = append(args, "%"+search+"%")
		where += " AND name ILIKE $" + strconv.Itoa(len(args))
	}
	if v := c.Query("is_active"); v != "" {
		args = append(args, v == "true")
		where += " AND is_active = $" + strconv.Itoa(len(args))
	}

	var total int
	h.DB.QueryRow(c, "SELECT count(*) FROM divisions WHERE "+where, args...).Scan(&total)

	args = append(args, limit, (page-1)*limit)
	rows, err := h.DB.Query(c,
		`SELECT id, name, description, is_active, created_at, updated_at
		 FROM divisions WHERE `+where+` ORDER BY created_at
		 LIMIT $`+strconv.Itoa(len(args)-1)+` OFFSET $`+strconv.Itoa(len(args)),
		args...)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}
	defer rows.Close()

	items := []gin.H{}
	for rows.Next() {
		var id, name string
		var description *string
		var isActive bool
		var createdAt, updatedAt any
		if err := rows.Scan(&id, &name, &description, &isActive, &createdAt, &updatedAt); err != nil {
			respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
			return
		}
		items = append(items, gin.H{
			"id": id, "name": name, "description": description,
			"is_active": isActive, "created_at": createdAt, "updated_at": updatedAt,
		})
	}

	respondSuccess(c, http.StatusOK, "Divisi berhasil diambil.", gin.H{
		"items": items,
		"pagination": gin.H{
			"page": page, "limit": limit, "total": total,
			"total_pages": (total + limit - 1) / limit,
		},
	})
}

type divisionRequest struct {
	Name        string `json:"name" binding:"required,min=1,max=100"`
	Description string `json:"description"`
	IsActive    *bool  `json:"is_active"`
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func isForeignKeyViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23503"
}

func (h *DivisionHandler) Create(c *gin.Context) {
	var req divisionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusUnprocessableEntity, "Nama divisi wajib diisi (maks 100 karakter).", "VALIDATION_ERROR")
		return
	}
	isActive := req.IsActive == nil || *req.IsActive

	var id string
	err := h.DB.QueryRow(c,
		`INSERT INTO divisions (name, description, is_active) VALUES ($1, $2, $3) RETURNING id`,
		req.Name, req.Description, isActive,
	).Scan(&id)
	if isUniqueViolation(err) {
		respondError(c, http.StatusConflict, "Nama divisi sudah digunakan.", "DUPLICATE_DIVISION")
		return
	}

	respondSuccess(c, http.StatusCreated, "Divisi berhasil dibuat.", gin.H{
		"id": id, "name": req.Name, "description": req.Description, "is_active": isActive,
	})
}

func (h *DivisionHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var req divisionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusUnprocessableEntity, "Nama divisi wajib diisi (maks 100 karakter).", "VALIDATION_ERROR")
		return
	}
	isActive := req.IsActive == nil || *req.IsActive

	tag, err := h.DB.Exec(c,
		`UPDATE divisions SET name=$1, description=$2, is_active=$3, updated_at=now()
		 WHERE id=$4 AND deleted_at IS NULL`,
		req.Name, req.Description, isActive, id,
	)
	if isUniqueViolation(err) {
		respondError(c, http.StatusConflict, "Nama divisi sudah digunakan.", "DUPLICATE_DIVISION")
		return
	}
	if tag.RowsAffected() == 0 {
		respondError(c, http.StatusNotFound, "Divisi tidak ditemukan.", "NOT_FOUND")
		return
	}

	respondSuccess(c, http.StatusOK, "Divisi berhasil diperbarui.", gin.H{
		"id": id, "name": req.Name, "description": req.Description, "is_active": isActive,
	})
}

func (h *DivisionHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	tag, err := h.DB.Exec(c,
		`UPDATE divisions SET deleted_at=now(), is_active=false, updated_at=now()
		 WHERE id=$1 AND deleted_at IS NULL`, id)
	if err != nil || tag.RowsAffected() == 0 {
		respondError(c, http.StatusNotFound, "Divisi tidak ditemukan.", "NOT_FOUND")
		return
	}
	respondSuccess(c, http.StatusOK, "Divisi berhasil dihapus.", nil)
}
