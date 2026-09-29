package handler

import (
	"fmt"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

func respondSuccess(c *gin.Context, status int, message string, data any) {
	c.JSON(status, gin.H{
		"success": true,
		"message": message,
		"data":    data,
	})
}

func respondError(c *gin.Context, status int, message, code string) {
	c.JSON(status, gin.H{
		"success": false,
		"message": message,
		"error": gin.H{
			"code": code,
		},
	})
}

// contentDisposition membentuk header Content-Disposition dengan nama berkas
// yang sudah dibersihkan. Nama berasal dari unggahan pengguna, jadi tanda kutip,
// backslash, dan karakter kontrol harus dibuang supaya tidak bisa menyisipkan
// parameter/baris baru ke dalam header.
func contentDisposition(disposition, name string) string {
	clean := strings.Map(func(r rune) rune {
		if r < 0x20 || r == 0x7f || r == '"' || r == '\\' {
			return -1
		}
		return r
	}, filepath.Base(name))
	if clean == "" || clean == "." {
		clean = "file"
	}
	return fmt.Sprintf(`%s; filename="%s"`, disposition, clean)
}
