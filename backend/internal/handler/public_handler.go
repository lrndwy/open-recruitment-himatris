package handler

import (
	"database/sql"
	"errors"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"himatris-oprec-backend/internal/config"
)

type PublicHandler struct {
	DB  *pgxpool.Pool
	Cfg *config.Config
}

// GET /public/registration
func (h *PublicHandler) GetRegistration(c *gin.Context) {
	var id, name string
	var startAt, endAt time.Time
	err := h.DB.QueryRow(c,
		`SELECT id, name, start_at, end_at FROM registration_periods
		 WHERE now() >= start_at AND now() <= end_at
		 ORDER BY start_at DESC LIMIT 1`,
	).Scan(&id, &name, &startAt, &endAt)
	if errors.Is(err, sql.ErrNoRows) {
		respondSuccess(c, http.StatusOK, "Registration status berhasil diambil.", nil)
		return
	}
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}
	respondSuccess(c, http.StatusOK, "Registration status berhasil diambil.", gin.H{
		"id":       id,
		"name":     name,
		"start_at": startAt.Format(time.RFC3339),
		"end_at":   endAt.Format(time.RFC3339),
		"status":   "OPEN",
	})
}

// GET /public/divisions
func (h *PublicHandler) ListDivisions(c *gin.Context) {
	type pubDivision struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	rows, err := h.DB.Query(c,
		`SELECT id, name, COALESCE(description, '') FROM divisions
		 WHERE deleted_at IS NULL AND is_active = true ORDER BY name`)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}
	defer rows.Close()
	items := []pubDivision{}
	for rows.Next() {
		var d pubDivision
		if err := rows.Scan(&d.ID, &d.Name, &d.Description); err != nil {
			respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
			return
		}
		items = append(items, d)
	}
	respondSuccess(c, http.StatusOK, "Divisi berhasil diambil.", items)
}

// GET /public/program-studies
func (h *PublicHandler) ListProgramStudies(c *gin.Context) {
	type pubProgramStudy struct {
		ID   string `json:"id"`
		Name string `json:"name"`
		Code string `json:"code"`
	}
	rows, err := h.DB.Query(c,
		`SELECT id, name, code FROM program_studies
		 WHERE deleted_at IS NULL AND is_active = true ORDER BY name`)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}
	defer rows.Close()
	items := []pubProgramStudy{}
	for rows.Next() {
		var p pubProgramStudy
		if err := rows.Scan(&p.ID, &p.Name, &p.Code); err != nil {
			respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
			return
		}
		items = append(items, p)
	}
	respondSuccess(c, http.StatusOK, "Program studi berhasil diambil.", items)
}

// GET /public/result?nim=...
func (h *PublicHandler) GetResult(c *gin.Context) {
	nim := strings.TrimSpace(c.Query("nim"))
	if nim == "" {
		respondError(c, http.StatusUnprocessableEntity, "NIM wajib diisi.", "VALIDATION_ERROR")
		return
	}
	var status string
	var divAccID, divAccName *string
	err := h.DB.QueryRow(c,
		`SELECT a.selection_status::text, dacc.id, dacc.name
		 FROM applicants a
		 LEFT JOIN divisions dacc ON dacc.id = a.accepted_division_id
		 WHERE a.nim = $1`, nim).Scan(&status, &divAccID, &divAccName)
	if errors.Is(err, pgx.ErrNoRows) {
		respondError(c, http.StatusNotFound, "Data pendaftar tidak ditemukan.", "APPLICANT_NOT_FOUND")
		return
	}
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}
	data := gin.H{"nim": nim, "status": status}
	if divAccID != nil && divAccName != nil {
		data["accepted_division"] = gin.H{"id": *divAccID, "name": *divAccName}
	}
	respondSuccess(c, http.StatusOK, "Hasil seleksi berhasil ditemukan.", data)
}

// POST /public/applications (multipart/form-data)
func (h *PublicHandler) CreateApplication(c *gin.Context) {
	// Parse form fields
	name := strings.TrimSpace(c.PostForm("name"))
	nim := strings.TrimSpace(c.PostForm("nim"))
	class := strings.TrimSpace(c.PostForm("class"))
	birthDate := strings.TrimSpace(c.PostForm("birth_date"))
	programStudyID := strings.TrimSpace(c.PostForm("program_study_id"))
	division1ID := strings.TrimSpace(c.PostForm("division_1_id"))
	division2ID := strings.TrimSpace(c.PostForm("division_2_id"))

	// Validate required fields
	if name == "" || nim == "" || class == "" || birthDate == "" || programStudyID == "" || division1ID == "" || division2ID == "" {
		respondError(c, http.StatusUnprocessableEntity, "Data pendaftaran tidak lengkap.", "VALIDATION_ERROR")
		return
	}

	// Validate birth date
	birth, err := time.Parse("2006-01-02", birthDate)
	if err != nil || birth.After(time.Now()) {
		respondError(c, http.StatusUnprocessableEntity, "Tanggal lahir tidak valid.", "VALIDATION_ERROR")
		return
	}

	// Validate program study exists
	var programStudyExists bool
	err = h.DB.QueryRow(c, `SELECT EXISTS(SELECT 1 FROM program_studies WHERE id = $1)`, programStudyID).Scan(&programStudyExists)
	if err != nil {
		log.Printf("ERROR: failed to check program study: %v", err)
		respondError(c, http.StatusInternalServerError, "Gagal memproses pendaftaran.", "INTERNAL_ERROR")
		return
	}
	if !programStudyExists {
		respondError(c, http.StatusUnprocessableEntity, "Jurusan tidak valid.", "INVALID_PROGRAM_STUDY")
		return
	}

	// Validate portfolio file (optional, PDF)
	var portfolioFileHeader *multipart.FileHeader
	portfolioExt := ""
	if fh, err := c.FormFile("portfolio"); err == nil && fh.Size > 0 {
		if fh.Size > h.Cfg.MaxCVSize {
			respondError(c, http.StatusUnprocessableEntity, "Ukuran file portofolio maksimal 5 MB.", "PORTFOLIO_TOO_LARGE")
			return
		}
		portfolioExt = strings.ToLower(strings.TrimPrefix(filepath.Ext(fh.Filename), "."))
		if portfolioExt != "pdf" {
			respondError(c, http.StatusUnprocessableEntity, "File portofolio harus berupa PDF.", "INVALID_PORTFOLIO")
			return
		}
		portfolioFileHeader = fh
	}

	// Validate CV file
	cvFileHeader, err := c.FormFile("cv")
	if err != nil {
		respondError(c, http.StatusUnprocessableEntity, "File CV wajib diunggah.", "INVALID_CV")
		return
	}
	if cvFileHeader.Size > h.Cfg.MaxCVSize {
		respondError(c, http.StatusUnprocessableEntity, "Ukuran file CV maksimal 5 MB.", "CV_TOO_LARGE")
		return
	}
	cvExt := strings.ToLower(strings.TrimPrefix(filepath.Ext(cvFileHeader.Filename), "."))
	if cvFileHeader.Size == 0 || cvExt != "pdf" {
		respondError(c, http.StatusUnprocessableEntity, "File CV harus berupa PDF.", "INVALID_CV")
		return
	}

	// Validate poster file (required)
	posterFileHeader, err := c.FormFile("poster")
	if err != nil {
		respondError(c, http.StatusUnprocessableEntity, "File poster wajib diunggah.", "INVALID_POSTER")
		return
	}
	if posterFileHeader.Size > h.Cfg.MaxCVSize {
		respondError(c, http.StatusUnprocessableEntity, "Ukuran file poster maksimal 5 MB.", "POSTER_TOO_LARGE")
		return
	}
	posterExt := strings.ToLower(strings.TrimPrefix(filepath.Ext(posterFileHeader.Filename), "."))
	allowedPosterExts := map[string]bool{"jpg": true, "jpeg": true, "png": true, "webp": true}
	if posterFileHeader.Size == 0 || !allowedPosterExts[posterExt] {
		respondError(c, http.StatusUnprocessableEntity, "File poster harus berupa JPG, PNG, atau WEBP.", "INVALID_POSTER")
		return
	}

	// Validate surrogate consent file (required, PDF)
	parentalConsentFileHeader, err := c.FormFile("parental_consent")
	if err != nil {
		respondError(c, http.StatusUnprocessableEntity, "Surat persetujuan orang tua wajib diunggah.", "INVALID_PARENTAL_CONSENT")
		return
	}
	if parentalConsentFileHeader.Size > h.Cfg.MaxCVSize {
		respondError(c, http.StatusUnprocessableEntity, "Ukuran surat persetujuan maksimal 5 MB.", "PARENTAL_CONSENT_TOO_LARGE")
		return
	}
	parentalConsentExt := strings.ToLower(strings.TrimPrefix(filepath.Ext(parentalConsentFileHeader.Filename), "."))
	if parentalConsentFileHeader.Size == 0 || parentalConsentExt != "pdf" {
		respondError(c, http.StatusUnprocessableEntity, "Surat persetujuan harus berupa PDF.", "INVALID_PARENTAL_CONSENT")
		return
	}

	// Get active registration period
	var registrationPeriodID string
	var periodStart, periodEnd time.Time
	err = h.DB.QueryRow(c,
		`SELECT id, start_at, end_at FROM registration_periods 
		 WHERE now() >= start_at AND now() <= end_at 
		 ORDER BY start_at DESC LIMIT 1`,
	).Scan(&registrationPeriodID, &periodStart, &periodEnd)
	if errors.Is(err, pgx.ErrNoRows) {
		respondError(c, http.StatusForbidden, "Pendaftaran sedang tidak dibuka.", "REGISTRATION_CLOSED")
		return
	}
	if err != nil {
		log.Printf("ERROR: failed to get active registration period: %v", err)
		respondError(c, http.StatusInternalServerError, "Gagal memproses pendaftaran.", "INTERNAL_ERROR")
		return
	}

	// Check for duplicate NIM
	var existingID string
	err = h.DB.QueryRow(c, `SELECT id FROM applicants WHERE nim = $1`, nim).Scan(&existingID)
	if err == nil {
		respondError(c, http.StatusConflict, "NIM sudah terdaftar.", "DUPLICATE_REGISTRATION")
		return
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		log.Printf("ERROR: failed to check duplicate NIM: %v", err)
		respondError(c, http.StatusInternalServerError, "Gagal memproses pendaftaran.", "INTERNAL_ERROR")
		return
	}

	// Verify program study exists
	var progExists bool
	err = h.DB.QueryRow(c, `SELECT EXISTS(SELECT 1 FROM program_studies WHERE id = $1)`, programStudyID).Scan(&progExists)
	if err != nil {
		log.Printf("ERROR: failed to check program study: %v", err)
		respondError(c, http.StatusInternalServerError, "Gagal memproses pendaftaran.", "INTERNAL_ERROR")
		return
	}
	if !progExists {
		respondError(c, http.StatusNotFound, "Program studi tidak ditemukan.", "PROGRAM_STUDY_NOT_FOUND")
		return
	}

	// Verify division 1 exists
	var div1Exists bool
	err = h.DB.QueryRow(c, `SELECT EXISTS(SELECT 1 FROM divisions WHERE id = $1)`, division1ID).Scan(&div1Exists)
	if err != nil {
		log.Printf("ERROR: failed to check division 1: %v", err)
		respondError(c, http.StatusInternalServerError, "Gagal memproses pendaftaran.", "INTERNAL_ERROR")
		return
	}
	if !div1Exists {
		respondError(c, http.StatusNotFound, "Divisi 1 tidak ditemukan.", "DIVISION_NOT_FOUND")
		return
	}

	// Verify division 2 exists
	if division2ID == division1ID {
		respondError(c, http.StatusUnprocessableEntity, "Divisi 2 tidak boleh sama dengan Divisi 1.", "DUPLICATE_DIVISION")
		return
	}
	var div2Exists bool
	err = h.DB.QueryRow(c, `SELECT EXISTS(SELECT 1 FROM divisions WHERE id = $1)`, division2ID).Scan(&div2Exists)
	if err != nil {
		log.Printf("ERROR: failed to check division 2: %v", err)
		respondError(c, http.StatusInternalServerError, "Gagal memproses pendaftaran.", "INTERNAL_ERROR")
		return
	}
	if !div2Exists {
		respondError(c, http.StatusNotFound, "Divisi 2 tidak ditemukan.", "DIVISION_NOT_FOUND")
		return
	}

	// Save CV file
	year := time.Now().Format("2006")
	cvStoredName := uuid.NewString() + "." + cvExt
	cvRelPath := filepath.Join("cvs", year, cvStoredName)
	cvAbsPath := filepath.Join(h.Cfg.StoragePath, cvRelPath)

	if err := os.MkdirAll(filepath.Dir(cvAbsPath), 0o755); err != nil {
		log.Printf("ERROR: failed to create CV directory: %v", err)
		respondError(c, http.StatusInternalServerError, "Gagal memproses pendaftaran.", "INTERNAL_ERROR")
		return
	}

	if err := c.SaveUploadedFile(cvFileHeader, cvAbsPath); err != nil {
		log.Printf("ERROR: failed to save CV file: %v", err)
		respondError(c, http.StatusInternalServerError, "Gagal memproses pendaftaran.", "INTERNAL_ERROR")
		return
	}

	// Save poster file
	posterStoredName := uuid.NewString() + "." + posterExt
	posterRelPath := filepath.Join("posters", year, posterStoredName)
	posterAbsPath := filepath.Join(h.Cfg.StoragePath, posterRelPath)

	if err := os.MkdirAll(filepath.Dir(posterAbsPath), 0o755); err != nil {
		os.Remove(cvAbsPath)
		log.Printf("ERROR: failed to create poster directory: %v", err)
		respondError(c, http.StatusInternalServerError, "Gagal memproses pendaftaran.", "INTERNAL_ERROR")
		return
	}

	if err := c.SaveUploadedFile(posterFileHeader, posterAbsPath); err != nil {
		os.Remove(cvAbsPath)
		log.Printf("ERROR: failed to save poster file: %v", err)
		respondError(c, http.StatusInternalServerError, "Gagal memproses pendaftaran.", "INTERNAL_ERROR")
		return
	}

	posterMimeType := posterFileHeader.Header.Get("Content-Type")
	if posterMimeType == "" {
		posterMimeType = "image/" + posterExt
	}

	// Save parental consent file
	parentalConsentStoredName := uuid.NewString() + "." + parentalConsentExt
	parentalConsentRelPath := filepath.Join("parental_consents", year, parentalConsentStoredName)
	parentalConsentAbsPath := filepath.Join(h.Cfg.StoragePath, parentalConsentRelPath)

	if err := os.MkdirAll(filepath.Dir(parentalConsentAbsPath), 0o755); err != nil {
		os.Remove(cvAbsPath)
		os.Remove(posterAbsPath)
		log.Printf("ERROR: failed to create parental consent directory: %v", err)
		respondError(c, http.StatusInternalServerError, "Gagal memproses pendaftaran.", "INTERNAL_ERROR")
		return
	}

	if err := c.SaveUploadedFile(parentalConsentFileHeader, parentalConsentAbsPath); err != nil {
		os.Remove(cvAbsPath)
		os.Remove(posterAbsPath)
		log.Printf("ERROR: failed to save parental consent file: %v", err)
		respondError(c, http.StatusInternalServerError, "Gagal memproses pendaftaran.", "INTERNAL_ERROR")
		return
	}

	parentalConsentMimeType := parentalConsentFileHeader.Header.Get("Content-Type")
	if parentalConsentMimeType == "" {
		parentalConsentMimeType = "application/pdf"
	}

	// Save portfolio file (optional)
	portfolioRelPath := ""
	portfolioStoredName := ""
	if portfolioFileHeader != nil {
		portfolioStoredName = uuid.NewString() + ".pdf"
		portfolioRelPath = filepath.Join("portfolios", year, portfolioStoredName)
		portfolioAbsPath := filepath.Join(h.Cfg.StoragePath, portfolioRelPath)
		if err := os.MkdirAll(filepath.Dir(portfolioAbsPath), 0o755); err != nil {
			os.Remove(cvAbsPath)
			os.Remove(posterAbsPath)
			log.Printf("ERROR: failed to create portfolio directory: %v", err)
			respondError(c, http.StatusInternalServerError, "Gagal memproses pendaftaran.", "INTERNAL_ERROR")
			return
		}
		if err := c.SaveUploadedFile(portfolioFileHeader, portfolioAbsPath); err != nil {
			os.Remove(cvAbsPath)
			os.Remove(posterAbsPath)
			log.Printf("ERROR: failed to save portfolio file: %v", err)
			respondError(c, http.StatusInternalServerError, "Gagal memproses pendaftaran.", "INTERNAL_ERROR")
			return
		}
	}

	cvMimeType := cvFileHeader.Header.Get("Content-Type")
	if cvMimeType == "" {
		cvMimeType = "application/pdf"
	}

	// Start transaction
	tx, err := h.DB.Begin(c)
	if err != nil {
		os.Remove(cvAbsPath)
		os.Remove(posterAbsPath)
		log.Printf("ERROR: failed to begin transaction: %v", err)
		respondError(c, http.StatusInternalServerError, "Gagal memproses pendaftaran.", "INTERNAL_ERROR")
		return
	}
	defer tx.Rollback(c)

	// Insert applicant
	applicantID := uuid.NewString()
	createdAt := time.Now()
	_, err = tx.Exec(c,
		`INSERT INTO applicants
			(id, registration_period_id, nim, name, class, birth_date, program_study_id,
			 division_1_id, division_2_id,
			 selection_status, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING', $10, $10)`,
		applicantID, registrationPeriodID, nim, name, class, birth,
		programStudyID, division1ID, division2ID,
		createdAt)
	if err != nil {
		log.Printf("ERROR: failed to insert applicant: %v", err)
		os.Remove(cvAbsPath)
		os.Remove(posterAbsPath)
		respondError(c, http.StatusInternalServerError, "Gagal memproses pendaftaran.", "INTERNAL_ERROR")
		return
	}

	// Insert CV file record
	_, err = tx.Exec(c,
		`INSERT INTO files
			(applicant_id, original_name, stored_name, path, mime_type, extension, size_bytes, file_type)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, 'CV')`,
		applicantID, filepath.Base(cvFileHeader.Filename), cvStoredName, cvRelPath, cvMimeType, cvExt, cvFileHeader.Size)
	if err != nil {
		log.Printf("ERROR: failed to insert CV file record: %v", err)
		os.Remove(cvAbsPath)
		os.Remove(posterAbsPath)
		respondError(c, http.StatusInternalServerError, "Gagal memproses pendaftaran.", "INTERNAL_ERROR")
		return
	}

	// Insert poster file record
	_, err = tx.Exec(c,
		`INSERT INTO files
			(applicant_id, original_name, stored_name, path, mime_type, extension, size_bytes, file_type)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, 'POSTER')`,
		applicantID, filepath.Base(posterFileHeader.Filename), posterStoredName, posterRelPath, posterMimeType, posterExt, posterFileHeader.Size)
	if err != nil {
		log.Printf("ERROR: failed to insert poster file record: %v", err)
		os.Remove(cvAbsPath)
		os.Remove(posterAbsPath)
		respondError(c, http.StatusInternalServerError, "Gagal memproses pendaftaran.", "INTERNAL_ERROR")
		return
	}

	// Insert parental consent file record
	_, err = tx.Exec(c,
		`INSERT INTO files
			(applicant_id, original_name, stored_name, path, mime_type, extension, size_bytes, file_type)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, 'PARENTAL_CONSENT')`,
		applicantID, filepath.Base(parentalConsentFileHeader.Filename), parentalConsentStoredName, parentalConsentRelPath,
		parentalConsentMimeType, parentalConsentExt, parentalConsentFileHeader.Size)
	if err != nil {
		log.Printf("ERROR: failed to insert parental consent file record: %v", err)
		os.Remove(cvAbsPath)
		os.Remove(posterAbsPath)
		os.Remove(parentalConsentAbsPath)
		respondError(c, http.StatusInternalServerError, "Gagal memproses pendaftaran.", "INTERNAL_ERROR")
		return
	}

	// Insert portfolio file record (optional)
	if portfolioFileHeader != nil {
		_, err = tx.Exec(c,
			`INSERT INTO files
				(applicant_id, original_name, stored_name, path, mime_type, extension, size_bytes, file_type)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, 'PORTFOLIO')`,
			applicantID, filepath.Base(portfolioFileHeader.Filename), portfolioStoredName, portfolioRelPath,
			"application/pdf", portfolioExt, portfolioFileHeader.Size)
		if err != nil {
			log.Printf("ERROR: failed to insert portfolio file record: %v", err)
			os.Remove(cvAbsPath)
			os.Remove(posterAbsPath)
			os.Remove(parentalConsentAbsPath)
			os.Remove(filepath.Join(h.Cfg.StoragePath, portfolioRelPath))
			respondError(c, http.StatusInternalServerError, "Gagal memproses pendaftaran.", "INTERNAL_ERROR")
			return
		}
	}

	if err := tx.Commit(c); err != nil {
		log.Printf("ERROR: failed to commit transaction: %v", err)
		os.Remove(cvAbsPath)
		os.Remove(posterAbsPath)
		os.Remove(parentalConsentAbsPath)
		respondError(c, http.StatusInternalServerError, "Gagal memproses pendaftaran.", "INTERNAL_ERROR")
		return
	}

	respondSuccess(c, http.StatusCreated, "Pendaftaran berhasil.", gin.H{
		"id":            applicantID,
		"nim":           nim,
		"status":        "PENDING",
		"registered_at": createdAt.Format(time.RFC3339),
	})
}
