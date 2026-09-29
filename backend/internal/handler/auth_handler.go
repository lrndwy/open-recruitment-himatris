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
