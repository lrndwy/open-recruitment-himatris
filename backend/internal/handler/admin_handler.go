package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type AdminHandler struct {
	DB *pgxpool.Pool
}

type adminResponse struct {
	ID          string  `json:"id"`
	Username    string  `json:"username"`
	Email       string  `json:"email"`
	Status      string  `json:"status"`
	LastLoginAt *string `json:"last_login_at"`
	CreatedAt   string  `json:"created_at"`
	UpdatedAt   string  `json:"updated_at"`
}

type createAdminRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email,max=255"`
	Password string `json:"password" binding:"required,min=8"`
}

type updateAdminRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email,max=255"`
	Status   string `json:"status" binding:"required,oneof=ACTIVE INACTIVE"`
}

type changePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=8"`
}

func (h *AdminHandler) List(c *gin.Context) {
	rows, err := h.DB.Query(c.Request.Context(), `
		SELECT id, username, email, status::text, last_login_at, created_at, updated_at
		FROM admins
		ORDER BY created_at DESC
	`)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Gagal mengambil data admin.", "INTERNAL_SERVER_ERROR")
		return
	}
	defer rows.Close()

	var admins []adminResponse
	for rows.Next() {
		var a adminResponse
		var lastLogin *time.Time
		var createdAt, updatedAt time.Time
		if err := rows.Scan(&a.ID, &a.Username, &a.Email, &a.Status, &lastLogin, &createdAt, &updatedAt); err != nil {
			respondError(c, http.StatusInternalServerError, "Gagal memproses data admin.", "INTERNAL_SERVER_ERROR")
			return
		}
		if lastLogin != nil {
			ts := lastLogin.Format(time.RFC3339)
			a.LastLoginAt = &ts
		}
		a.CreatedAt = createdAt.Format(time.RFC3339)
		a.UpdatedAt = updatedAt.Format(time.RFC3339)
		admins = append(admins, a)
	}

	if admins == nil {
		admins = []adminResponse{}
	}

	respondSuccess(c, http.StatusOK, "Data admin berhasil diambil.", admins)
}

func (h *AdminHandler) Get(c *gin.Context) {
	id := c.Param("id")

	var a adminResponse
	var lastLogin *time.Time
	var createdAt, updatedAt time.Time
	err := h.DB.QueryRow(c.Request.Context(), `
		SELECT id, username, email, status::text, last_login_at, created_at, updated_at
		FROM admins WHERE id = $1
	`, id).Scan(&a.ID, &a.Username, &a.Email, &a.Status, &lastLogin, &createdAt, &updatedAt)
	if err == pgx.ErrNoRows {
		respondError(c, http.StatusNotFound, "Admin tidak ditemukan.", "ADMIN_NOT_FOUND")
		return
	}
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Gagal mengambil data admin.", "INTERNAL_SERVER_ERROR")
		return
	}

	if lastLogin != nil {
		ts := lastLogin.Format(time.RFC3339)
		a.LastLoginAt = &ts
	}
	a.CreatedAt = createdAt.Format(time.RFC3339)
	a.UpdatedAt = updatedAt.Format(time.RFC3339)

	respondSuccess(c, http.StatusOK, "Data admin berhasil diambil.", a)
}

func (h *AdminHandler) Create(c *gin.Context) {
	var req createAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "Data tidak valid.", "VALIDATION_ERROR")
		return
	}

	// Check duplicate username or email
	var exists bool
	err := h.DB.QueryRow(c.Request.Context(),
		`SELECT EXISTS(SELECT 1 FROM admins WHERE username = $1 OR email = $2)`,
		req.Username, req.Email,
	).Scan(&exists)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Gagal memvalidasi data.", "INTERNAL_SERVER_ERROR")
		return
	}
	if exists {
		respondError(c, http.StatusConflict, "Username atau email sudah digunakan.", "DUPLICATE_ADMIN")
		return
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Gagal memproses password.", "INTERNAL_SERVER_ERROR")
		return
	}

	var a adminResponse
	var lastLogin *time.Time
	var createdAt, updatedAt time.Time
	err = h.DB.QueryRow(c.Request.Context(), `
		INSERT INTO admins (username, email, password_hash)
		VALUES ($1, $2, $3)
		RETURNING id, username, email, status::text, last_login_at, created_at, updated_at
	`, req.Username, req.Email, string(hash)).Scan(&a.ID, &a.Username, &a.Email, &a.Status, &lastLogin, &createdAt, &updatedAt)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Gagal membuat admin.", "INTERNAL_SERVER_ERROR")
		return
	}
	if lastLogin != nil {
		ts := lastLogin.Format(time.RFC3339)
		a.LastLoginAt = &ts
	}
	a.CreatedAt = createdAt.Format(time.RFC3339)
	a.UpdatedAt = updatedAt.Format(time.RFC3339)

	respondSuccess(c, http.StatusCreated, "Admin berhasil dibuat.", a)
}

func (h *AdminHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req updateAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "Data tidak valid.", "VALIDATION_ERROR")
		return
	}

	// Check duplicate username or email (excluding self)
	var exists bool
	err := h.DB.QueryRow(c.Request.Context(),
		`SELECT EXISTS(SELECT 1 FROM admins WHERE (username = $1 OR email = $2) AND id != $3)`,
		req.Username, req.Email, id,
	).Scan(&exists)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Gagal memvalidasi data.", "INTERNAL_SERVER_ERROR")
		return
	}
	if exists {
		respondError(c, http.StatusConflict, "Username atau email sudah digunakan.", "DUPLICATE_ADMIN")
		return
	}

	var a adminResponse
	var lastLogin *time.Time
	var createdAt, updatedAt time.Time
	err = h.DB.QueryRow(c.Request.Context(), `
		UPDATE admins
		SET username = $1, email = $2, status = $3::admin_status, updated_at = NOW()
		WHERE id = $4
		RETURNING id, username, email, status::text, last_login_at, created_at, updated_at
	`, req.Username, req.Email, req.Status, id).Scan(&a.ID, &a.Username, &a.Email, &a.Status, &lastLogin, &createdAt, &updatedAt)
	if err == pgx.ErrNoRows {
		respondError(c, http.StatusNotFound, "Admin tidak ditemukan.", "ADMIN_NOT_FOUND")
		return
	}
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Gagal mengupdate admin.", "INTERNAL_SERVER_ERROR")
		return
	}
	if lastLogin != nil {
		ts := lastLogin.Format(time.RFC3339)
		a.LastLoginAt = &ts
	}
	a.CreatedAt = createdAt.Format(time.RFC3339)
	a.UpdatedAt = updatedAt.Format(time.RFC3339)

	respondSuccess(c, http.StatusOK, "Admin berhasil diupdate.", a)
}

func (h *AdminHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	// Prevent deleting self
	currentAdminID, _ := c.Get("admin_id")
	if currentAdminID == id {
		respondError(c, http.StatusForbidden, "Tidak dapat menghapus akun sendiri.", "CANNOT_DELETE_SELF")
		return
	}

	// Check if admin exists and count remaining admins
	var count int
	err := h.DB.QueryRow(c.Request.Context(),
		`SELECT COUNT(*) FROM admins WHERE id != $1`,
		id,
	).Scan(&count)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Gagal memvalidasi data.", "INTERNAL_SERVER_ERROR")
		return
	}
	if count == 0 {
		respondError(c, http.StatusForbidden, "Tidak dapat menghapus admin terakhir.", "CANNOT_DELETE_LAST_ADMIN")
		return
	}

	result, err := h.DB.Exec(c.Request.Context(), `DELETE FROM admins WHERE id = $1`, id)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Gagal menghapus admin.", "INTERNAL_SERVER_ERROR")
		return
	}
	if result.RowsAffected() == 0 {
		respondError(c, http.StatusNotFound, "Admin tidak ditemukan.", "ADMIN_NOT_FOUND")
		return
	}

	respondSuccess(c, http.StatusOK, "Admin berhasil dihapus.", nil)
}

func (h *AdminHandler) ChangePassword(c *gin.Context) {
	id := c.Param("id")

	// Only allow changing own password
	currentAdminID, _ := c.Get("admin_id")
	if currentAdminID != id {
		respondError(c, http.StatusForbidden, "Hanya dapat mengganti password sendiri.", "FORBIDDEN")
		return
	}

	var req changePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "Data tidak valid.", "VALIDATION_ERROR")
		return
	}

	// Verify old password
	var passwordHash string
	err := h.DB.QueryRow(c.Request.Context(),
		`SELECT password_hash FROM admins WHERE id = $1`,
		id,
	).Scan(&passwordHash)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Gagal memvalidasi password lama.", "INTERNAL_SERVER_ERROR")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.OldPassword)); err != nil {
		respondError(c, http.StatusUnauthorized, "Password lama salah.", "INVALID_OLD_PASSWORD")
		return
	}

	// Hash new password
	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Gagal memproses password baru.", "INTERNAL_SERVER_ERROR")
		return
	}

	_, err = h.DB.Exec(c.Request.Context(), `
		UPDATE admins SET password_hash = $1, updated_at = NOW() WHERE id = $2
	`, string(newHash), id)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Gagal mengupdate password.", "INTERNAL_SERVER_ERROR")
		return
	}

	respondSuccess(c, http.StatusOK, "Password berhasil diubah.", nil)
}
