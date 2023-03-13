package middleware

import (
	"fmt"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

func Log() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		log.WithFields(log.Fields{
			"type":   "request",
			"url":    c.Request.URL,
			"method": c.Request.Method,
		}).Info(fmt.Sprintf("Request from %s, responses with %d.", c.ClientIP(), c.Writer.Status()))
	}
}
