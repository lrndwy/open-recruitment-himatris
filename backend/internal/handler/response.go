package handler

import (
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
