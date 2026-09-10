package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ProgramStudyHandler struct {
	DB *pgxpool.Pool
}

func (h *ProgramStudyHandler) List(c *gin.Context) {
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
		where += " AND (name ILIKE $" + strconv.Itoa(len(args)) + " OR code ILIKE $" + strconv.Itoa(len(args)) + ")"
		args = append(args, "%"+search+"%")
	}
	if v := c.Query("is_active"); v != "" {
		args = append(args, v == "true")
		where += " AND is_active = $" + strconv.Itoa(len(args))
	}

	var total int
	h.DB.QueryRow(c, "SELECT count(*) FROM program_studies WHERE "+where, args...).Scan(&total)

	args = append(args, limit, (page-1)*limit)
	rows, err := h.DB.Query(c,
		`SELECT id, name, code, is_active, created_at, updated_at
		 FROM program_studies WHERE `+where+` ORDER BY name
		 LIMIT $`+strconv.Itoa(len(args)-1)+` OFFSET $`+strconv.Itoa(len(args)),
		args...)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}
	defer rows.Close()

	items := []gin.H{}
	for rows.Next() {
		var id, name, code string
		var isActive bool
		var createdAt, updatedAt any
		if err := rows.Scan(&id, &name, &code, &isActive, &createdAt, &updatedAt); err != nil {
			respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
			return
		}
		items = append(items, gin.H{
			"id": id, "name": name, "code": code,
			"is_active": isActive, "created_at": createdAt, "updated_at": updatedAt,
		})
	}

	respondSuccess(c, http.StatusOK, "Program Studi berhasil diambil.", gin.H{
		"items": items,
		"pagination": gin.H{
			"page": page, "limit": limit, "total": total,
			"total_pages": (total + limit - 1) / limit,
		},
	})
}

type programStudyRequest struct {
	Name     string `json:"name" binding:"required,min=1,max=100"`
	Code     string `json:"code" binding:"required,min=1,max=20"`
	IsActive *bool  `json:"is_active"`
}

func (h *ProgramStudyHandler) Create(c *gin.Context) {
	var req programStudyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusUnprocessableEntity, "Nama dan kode program studi wajib diisi.", "VALIDATION_ERROR")
		return
	}
	isActive := req.IsActive == nil || *req.IsActive

	var id string
	err := h.DB.QueryRow(c,
		`INSERT INTO program_studies (name, code, is_active) VALUES ($1, $2, $3) RETURNING id`,
		req.Name, req.Code, isActive,
	).Scan(&id)
	if isUniqueViolation(err) {
		respondError(c, http.StatusConflict, "Nama atau kode program studi sudah digunakan.", "DUPLICATE_PROGRAM_STUDY")
		return
	}

	respondSuccess(c, http.StatusCreated, "Program Studi berhasil dibuat.", gin.H{
		"id": id, "name": req.Name, "code": req.Code, "is_active": isActive,
	})
}

func (h *ProgramStudyHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var req programStudyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusUnprocessableEntity, "Nama dan kode program studi wajib diisi.", "VALIDATION_ERROR")
		return
	}
	isActive := req.IsActive == nil || *req.IsActive

	tag, err := h.DB.Exec(c,
		`UPDATE program_studies SET name=$1, code=$2, is_active=$3, updated_at=now()
		 WHERE id=$4 AND deleted_at IS NULL`,
		req.Name, req.Code, isActive, id,
	)
	if isUniqueViolation(err) {
		respondError(c, http.StatusConflict, "Nama atau kode program studi sudah digunakan.", "DUPLICATE_PROGRAM_STUDY")
		return
	}
	if tag.RowsAffected() == 0 {
		respondError(c, http.StatusNotFound, "Program Studi tidak ditemukan.", "NOT_FOUND")
		return
	}

	respondSuccess(c, http.StatusOK, "Program Studi berhasil diperbarui.", gin.H{
		"id": id, "name": req.Name, "code": req.Code, "is_active": isActive,
	})
}

func (h *ProgramStudyHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	tag, err := h.DB.Exec(c,
		`UPDATE program_studies SET deleted_at=now(), is_active=false, updated_at=now()
		 WHERE id=$1 AND deleted_at IS NULL`, id)
	if err != nil || tag.RowsAffected() == 0 {
		respondError(c, http.StatusNotFound, "Program Studi tidak ditemukan.", "NOT_FOUND")
		return
	}
	respondSuccess(c, http.StatusOK, "Program Studi berhasil dihapus.", nil)
}
