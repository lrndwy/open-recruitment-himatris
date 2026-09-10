package handler

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"himatris-oprec-backend/internal/config"
)

type ApplicantHandler struct {
	DB  *pgxpool.Pool
	Cfg *config.Config
}

type ref struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type applicantItem struct {
	ID              string  `json:"id"`
	Name            string  `json:"name"`
	NIM             string  `json:"nim"`
	Class           string  `json:"class"`
	WhatsApp        string  `json:"whatsapp"`
	BirthDate       any     `json:"birth_date,omitempty"`
	PortfolioURL    *string `json:"portfolio_url,omitempty"`
	ProgramStudy    ref     `json:"program_study"`
	Division1       ref     `json:"division_1"`
	Division2       *ref    `json:"division_2"`
	AcceptedDiv     *ref    `json:"accepted_division"`
	SelectionStatus string  `json:"selection_status"`
	CreatedAt       any     `json:"created_at"`
}

const applicantSelect = `
	SELECT a.id, a.name, a.nim, a.class, a.birth_date,
		ps.id, ps.name,
		d1.id, d1.name,
		d2.id, d2.name,
		dacc.id, dacc.name,
		a.selection_status::text, a.created_at
	FROM applicants a
	JOIN program_studies ps ON ps.id = a.program_study_id
	JOIN divisions d1 ON d1.id = a.division_1_id
	LEFT JOIN divisions d2 ON d2.id = a.division_2_id
	LEFT JOIN divisions dacc ON dacc.id = a.accepted_division_id`

// GET /admin/applicants
func (h *ApplicantHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	offset := (page - 1) * limit

	var conds []string
	var args []any
	n := func(v any) string {
		args = append(args, v)
		return "$" + strconv.Itoa(len(args))
	}

	if search := strings.TrimSpace(c.Query("search")); search != "" {
		v := "%" + search + "%"
		conds = append(conds, fmt.Sprintf("(a.name ILIKE %s OR a.nim ILIKE %s)", n(v), n(v)))
	}
	if nim := strings.TrimSpace(c.Query("nim")); nim != "" {
		conds = append(conds, "a.nim = "+n(nim))
	}
	if v := strings.TrimSpace(c.Query("program_study_id")); v != "" {
		conds = append(conds, "a.program_study_id = "+n(v))
	}
	if v := strings.TrimSpace(c.Query("division_id")); v != "" {
		conds = append(conds, fmt.Sprintf("(a.division_1_id = %s OR a.division_2_id = %s)", n(v), n(v)))
	}
	if v := strings.TrimSpace(c.Query("status")); v != "" {
		conds = append(conds, "a.selection_status::text = "+n(v))
	}
	if v := strings.TrimSpace(c.Query("registration_period_id")); v != "" {
		conds = append(conds, "a.registration_period_id = "+n(v))
	}

	where := " WHERE TRUE"
	for _, cond := range conds {
		where += " AND " + cond
	}

	sortCol := map[string]string{
		"created_at": "a.created_at",
		"name":       "a.name",
		"nim":        "a.nim",
	}[c.Query("sort")]
	if sortCol == "" {
		sortCol = "a.created_at"
	}
	order := strings.ToUpper(c.Query("order"))
	if order != "ASC" && order != "DESC" {
		order = "DESC"
	}

	var total int
	if err := h.DB.QueryRow(c, "SELECT COUNT(*) FROM applicants a"+where, args...).Scan(&total); err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	q := applicantSelect + where + " ORDER BY " + sortCol + " " + order +
		" LIMIT " + n(limit) + " OFFSET " + n(offset)
	rows, err := h.DB.Query(c, q, args...)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}
	defer rows.Close()

	items := []applicantItem{}
	for rows.Next() {
		var it applicantItem
		var div2ID, div2Name, divAccID, divAccName *string
		if err := rows.Scan(&it.ID, &it.Name, &it.NIM, &it.Class, &it.BirthDate,
			&it.ProgramStudy.ID, &it.ProgramStudy.Name,
			&it.Division1.ID, &it.Division1.Name,
			&div2ID, &div2Name,
			&divAccID, &divAccName,
			&it.SelectionStatus, &it.CreatedAt); err != nil {
			respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
			return
		}
		if div2ID != nil && div2Name != nil {
			it.Division2 = &ref{ID: *div2ID, Name: *div2Name}
		}
		if divAccID != nil && divAccName != nil {
			it.AcceptedDiv = &ref{ID: *divAccID, Name: *divAccName}
		}
		items = append(items, it)
	}
	respondSuccess(c, http.StatusOK, "Data pendaftar berhasil diambil.", gin.H{
		"items": items,
		"pagination": gin.H{
			"page": page, "limit": limit, "total": total,
			"total_pages": (total + limit - 1) / limit,
		},
	})
}

// GET /admin/applicants/:id
func (h *ApplicantHandler) Get(c *gin.Context) {
	var it applicantItem
	var updatedAt any
	var div2ID, div2Name, divAccID, divAccName *string
	var cvID, cvOriginalName, cvMimeType *string
	var cvSize *int64

	err := h.DB.QueryRow(c,
		`SELECT a.id, a.name, a.nim, a.class, COALESCE(a.whatsapp, ''), a.birth_date,
		ps.id, ps.name,
		d1.id, d1.name,
		d2.id, d2.name,
		dacc.id, dacc.name,
		a.selection_status::text, a.created_at, a.updated_at
		FROM applicants a
		JOIN program_studies ps ON ps.id = a.program_study_id
		JOIN divisions d1 ON d1.id = a.division_1_id
		LEFT JOIN divisions d2 ON d2.id = a.division_2_id
		LEFT JOIN divisions dacc ON dacc.id = a.accepted_division_id
		WHERE a.id = $1`, c.Param("id"),
	).Scan(&it.ID, &it.Name, &it.NIM, &it.Class, &it.WhatsApp, &it.BirthDate,
		&it.ProgramStudy.ID, &it.ProgramStudy.Name,
		&it.Division1.ID, &it.Division1.Name,
		&div2ID, &div2Name,
		&divAccID, &divAccName,
		&it.SelectionStatus, &it.CreatedAt, &updatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		respondError(c, http.StatusNotFound, "Pendaftar tidak ditemukan.", "NOT_FOUND")
		return
	}
	if err != nil {
		c.Error(err) // Log to Gin
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	h.DB.QueryRow(c,
		`SELECT id, original_name, mime_type, size_bytes
		 FROM files WHERE applicant_id = $1 AND file_type = 'CV'`,
		it.ID).Scan(&cvID, &cvOriginalName, &cvMimeType, &cvSize)

	// Fetch poster file
	var posterID, posterOriginalName, posterMimeType *string
	var posterSize *int64
	h.DB.QueryRow(c,
		`SELECT id, original_name, mime_type, size_bytes
		 FROM files WHERE applicant_id = $1 AND file_type = 'POSTER'`,
		it.ID).Scan(&posterID, &posterOriginalName, &posterMimeType, &posterSize)

	if div2ID != nil && div2Name != nil {
		it.Division2 = &ref{ID: *div2ID, Name: *div2Name}
	}

	data := gin.H{
		"id": it.ID, "name": it.Name, "nim": it.NIM, "class": it.Class,
		"whatsapp":   it.WhatsApp,
		"birth_date": it.BirthDate,
		"program_study": it.ProgramStudy,
		"division_1": gin.H{
			"id": it.Division1.ID, "name": it.Division1.Name,
		},
		"selection_status": it.SelectionStatus,
		"created_at":       it.CreatedAt,
		"updated_at":       updatedAt,
	}
	if it.Division2 != nil {
		data["division_2"] = gin.H{"id": it.Division2.ID, "name": it.Division2.Name}
	}
	if divAccID != nil && divAccName != nil {
		data["accepted_division"] = gin.H{"id": *divAccID, "name": *divAccName}
	}
	if cvID != nil {
		data["cv"] = gin.H{
			"id": *cvID, "original_name": *cvOriginalName,
			"mime_type": *cvMimeType, "size_bytes": *cvSize,
		}
	}
	if posterID != nil {
		data["poster"] = gin.H{
			"id": *posterID, "original_name": *posterOriginalName,
			"mime_type": *posterMimeType, "size_bytes": *posterSize,
		}
	}

	// Fetch portfolio file
	var portID, portOriginalName, portMimeType *string
	var portSize *int64
	h.DB.QueryRow(c,
		`SELECT id, original_name, mime_type, size_bytes
		 FROM files WHERE applicant_id = $1 AND file_type = 'PORTFOLIO'`,
		it.ID).Scan(&portID, &portOriginalName, &portMimeType, &portSize)
	if portID != nil {
		data["portfolio"] = gin.H{
			"id": *portID, "original_name": *portOriginalName,
			"mime_type": *portMimeType, "size_bytes": *portSize,
		}
	}

	// Fetch parental consent file
	var pcID, pcOriginalName, pcMimeType *string
	var pcSize *int64
	h.DB.QueryRow(c,
		`SELECT id, original_name, mime_type, size_bytes
		 FROM files WHERE applicant_id = $1 AND file_type = 'PARENTAL_CONSENT'`,
		it.ID).Scan(&pcID, &pcOriginalName, &pcMimeType, &pcSize)
	if pcID != nil {
		data["parental_consent"] = gin.H{
			"id": *pcID, "original_name": *pcOriginalName,
			"mime_type": *pcMimeType, "size_bytes": *pcSize,
		}
	}
	respondSuccess(c, http.StatusOK, "Detail pendaftar berhasil diambil.", data)
}

// PATCH /admin/applicants/:id/status
func (h *ApplicantHandler) UpdateStatus(c *gin.Context) {
	var req struct {
		Status             string  `json:"status" binding:"required"`
		AcceptedDivisionID *string `json:"accepted_division_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusUnprocessableEntity, "Status wajib diisi.", "VALIDATION_ERROR")
		return
	}
	status := strings.ToUpper(strings.TrimSpace(req.Status))
	if status != "PENDING" && status != "ACCEPTED" && status != "REJECTED" {
		respondError(c, http.StatusUnprocessableEntity, "Status tidak valid.", "VALIDATION_ERROR")
		return
	}

	var acceptedDivID *string
	if status == "ACCEPTED" && req.AcceptedDivisionID != nil && strings.TrimSpace(*req.AcceptedDivisionID) != "" {
		id := strings.TrimSpace(*req.AcceptedDivisionID)
		var exists bool
		if err := h.DB.QueryRow(c,
			`SELECT EXISTS(SELECT 1 FROM divisions WHERE id=$1 AND is_active AND deleted_at IS NULL)`,
			id,
		).Scan(&exists); err != nil {
			respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
			return
		}
		if !exists {
			respondError(c, http.StatusUnprocessableEntity, "Divisi tidak valid.", "INVALID_DIVISION")
			return
		}
		acceptedDivID = &id
	}

	var updatedAt any
	err := h.DB.QueryRow(c,
		`UPDATE applicants SET selection_status=$1, accepted_division_id=$2, updated_at=now()
		 WHERE id=$3 RETURNING updated_at`,
		status, acceptedDivID, c.Param("id"),
	).Scan(&updatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		respondError(c, http.StatusNotFound, "Pendaftar tidak ditemukan.", "NOT_FOUND")
		return
	}
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}
	respondSuccess(c, http.StatusOK, "Status pendaftar berhasil diperbarui.", gin.H{
		"id": c.Param("id"), "status": status, "updated_at": updatedAt,
	})
}

// GET /admin/applicants/:id/cv
func (h *ApplicantHandler) GetCV(c *gin.Context) {
	var relPath, originalName string
	err := h.DB.QueryRow(c,
		`SELECT f.path, f.original_name FROM files f
		 JOIN applicants a ON a.id = f.applicant_id
		 WHERE a.id = $1 AND f.file_type = 'CV'`, c.Param("id"),
	).Scan(&relPath, &originalName)
	if errors.Is(err, pgx.ErrNoRows) {
		respondError(c, http.StatusNotFound, "CV tidak ditemukan.", "NOT_FOUND")
		return
	}
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	absPath := filepath.Join(h.Cfg.StoragePath, relPath)
	if _, err := os.Stat(absPath); err != nil {
		respondError(c, http.StatusNotFound, "File CV tidak ditemukan.", "NOT_FOUND")
		return
	}
	c.Header("Content-Disposition", `inline; filename="`+originalName+`"`)
	c.File(absPath)
}

// GET /admin/applicants/:id/poster
func (h *ApplicantHandler) GetPoster(c *gin.Context) {
	var relPath, originalName string
	err := h.DB.QueryRow(c,
		`SELECT f.path, f.original_name FROM files f
		 JOIN applicants a ON a.id = f.applicant_id
		 WHERE a.id = $1 AND f.file_type = 'POSTER'`, c.Param("id"),
	).Scan(&relPath, &originalName)
	if errors.Is(err, pgx.ErrNoRows) {
		respondError(c, http.StatusNotFound, "Poster tidak ditemukan.", "NOT_FOUND")
		return
	}
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}
	absPath := filepath.Join(h.Cfg.StoragePath, relPath)
	if _, err := os.Stat(absPath); os.IsNotExist(err) {
		respondError(c, http.StatusNotFound, "File poster tidak ditemukan.", "FILE_NOT_FOUND")
		return
	}
	c.Header("Content-Disposition", fmt.Sprintf(`inline; filename="%s"`, originalName))
	c.File(absPath)
}

// GET /admin/applicants/:id/portfolio
func (h *ApplicantHandler) GetPortfolio(c *gin.Context) {
	var relPath, originalName string
	err := h.DB.QueryRow(c,
		`SELECT f.path, f.original_name FROM files f
		 JOIN applicants a ON a.id = f.applicant_id
		 WHERE a.id = $1 AND f.file_type = 'PORTFOLIO'`, c.Param("id"),
	).Scan(&relPath, &originalName)
	if errors.Is(err, pgx.ErrNoRows) {
		respondError(c, http.StatusNotFound, "Portofolio tidak ditemukan.", "NOT_FOUND")
		return
	}
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}
	absPath := filepath.Join(h.Cfg.StoragePath, relPath)
	if _, err := os.Stat(absPath); err != nil {
		respondError(c, http.StatusNotFound, "File portofolio tidak ditemukan.", "FILE_NOT_FOUND")
		return
	}
	c.Header("Content-Disposition", fmt.Sprintf(`inline; filename="%s"`, originalName))
	c.File(absPath)
}

// DELETE /admin/applicants/:id
func (h *ApplicantHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	// Kumpulkan path file fisik sebelum baris dihapus (record files ikut terhapus via CASCADE)
	rows, err := h.DB.Query(c, `SELECT path FROM files WHERE applicant_id = $1`, id)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}
	var filePaths []string
	for rows.Next() {
		var p string
		if err := rows.Scan(&p); err != nil {
			rows.Close()
			respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
			return
		}
		filePaths = append(filePaths, p)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	tag, err := h.DB.Exec(c, `DELETE FROM applicants WHERE id = $1`, id)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}
	if tag.RowsAffected() == 0 {
		respondError(c, http.StatusNotFound, "Pendaftar tidak ditemukan.", "NOT_FOUND")
		return
	}

	// Hapus file fisik dari storage (best-effort; record DB sudah bersih via cascade)
	for _, p := range filePaths {
		_ = os.Remove(filepath.Join(h.Cfg.StoragePath, p))
	}

	respondSuccess(c, http.StatusOK, "Pendaftar berhasil dihapus.", nil)
}

// GET /admin/applicants/:id/parental-consent
func (h *ApplicantHandler) GetParentalConsent(c *gin.Context) {
	var relPath, originalName string
	err := h.DB.QueryRow(c,
		`SELECT f.path, f.original_name FROM files f
		 JOIN applicants a ON a.id = f.applicant_id
		 WHERE a.id = $1 AND f.file_type = 'PARENTAL_CONSENT'`, c.Param("id"),
	).Scan(&relPath, &originalName)
	if errors.Is(err, pgx.ErrNoRows) {
		respondError(c, http.StatusNotFound, "Surat persetujuan tidak ditemukan.", "NOT_FOUND")
		return
	}
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}
	absPath := filepath.Join(h.Cfg.StoragePath, relPath)
	if _, err := os.Stat(absPath); err != nil {
		respondError(c, http.StatusNotFound, "File surat persetujuan tidak ditemukan.", "FILE_NOT_FOUND")
		return
	}
	c.Header("Content-Disposition", fmt.Sprintf(`inline; filename="%s"`, originalName))
	c.File(absPath)
}
