package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// RequireAuth memvalidasi Bearer token sekaligus memastikan akunnya masih ada
// dan berstatus ACTIVE. Token tetap ditolak begitu adminnya dinonaktifkan atau
// dihapus, jadi pencabutan akses benar-benar berlaku, bukan menunggu token
// kedaluwarsa.
func RequireAuth(secret string, db *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		tokenStr, ok := strings.CutPrefix(header, "Bearer ")
		if !ok || tokenStr == "" {
			abortUnauthorized(c, "Token tidak ditemukan.")
			return
		}

		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(secret), nil
		})
		if err != nil || !token.Valid {
			abortUnauthorized(c, "Token tidak valid atau kedaluwarsa.")
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok || !adminAktif(c, db, claims) {
			abortUnauthorized(c, "Token tidak valid atau kedaluwarsa.")
			return
		}

		c.Set("admin_id", claims["sub"])
		c.Set("username", claims["username"])
		c.Next()
	}
}

// adminAktif memastikan subjek token masih berupa admin ACTIVE. Token lama
// (atau id yang bukan UUID) langsung dianggap tidak sah.
func adminAktif(c *gin.Context, db *pgxpool.Pool, claims jwt.MapClaims) bool {
	sub, ok := claims["sub"].(string)
	if !ok || sub == "" {
		return false
	}
	var status string
	if err := db.QueryRow(c.Request.Context(),
		`SELECT status::text FROM admins WHERE id = $1`, sub).Scan(&status); err != nil {
		return false
	}
	return status == "ACTIVE"
}

func abortUnauthorized(c *gin.Context, message string) {
	c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
		"success": false,
		"message": message,
		"error": gin.H{
			"code": "UNAUTHORIZED",
		},
	})
}
