package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"himatris-oprec-backend/internal/config"
)

type AuthHandler struct {
	DB  *pgxpool.Pool
	Cfg *config.Config
}

type loginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type registerRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "Username dan password wajib diisi.", "VALIDATION_ERROR")
		return
	}

	var id, username, email, passwordHash, status string
	err := h.DB.QueryRow(c.Request.Context(),
		`SELECT id, username, email, password_hash, status::text
		 FROM admins WHERE username = $1 OR email = $1 LIMIT 1`,
		req.Username,
	).Scan(&id, &username, &email, &passwordHash, &status)
	if err != nil || bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)) != nil {
		respondError(c, http.StatusUnauthorized, "Username atau password salah.", "INVALID_CREDENTIALS")
		return
	}
	if status != "ACTIVE" {
		respondError(c, http.StatusForbidden, "Akun tidak aktif.", "ACCOUNT_INACTIVE")
		return
	}

	now := time.Now()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":      id,
		"username": username,
		"iat":      now.Unix(),
		"exp":      now.Add(time.Duration(h.Cfg.JWTExpiresIn) * time.Second).Unix(),
	})
	accessToken, err := token.SignedString([]byte(h.Cfg.JWTSecret))
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	respondSuccess(c, http.StatusOK, "Login berhasil.", gin.H{
		"access_token": accessToken,
		"token_type":   "Bearer",
		"expires_in":   h.Cfg.JWTExpiresIn,
		"admin": gin.H{
			"id":       id,
			"username": username,
			"email":    email,
		},
	})
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "Data tidak valid.", "VALIDATION_ERROR")
		return
	}

	var exists bool
	err := h.DB.QueryRow(c.Request.Context(),
		`SELECT EXISTS(SELECT 1 FROM admins WHERE username = $1 OR email = $2)`,
		req.Username, req.Email,
	).Scan(&exists)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}
	if exists {
		respondError(c, http.StatusConflict, "Username atau email sudah terdaftar.", "USER_EXISTS")
		return
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	var id string
	err = h.DB.QueryRow(c.Request.Context(),
		`INSERT INTO admins (username, email, password_hash, status)
		 VALUES ($1, $2, $3, 'ACTIVE') RETURNING id`,
		req.Username, req.Email, string(passwordHash),
	).Scan(&id)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	respondSuccess(c, http.StatusCreated, "Registrasi berhasil.", gin.H{
		"admin": gin.H{
			"id":       id,
			"username": req.Username,
			"email":    req.Email,
		},
	})
}
