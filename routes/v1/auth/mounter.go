package auth

import "github.com/gin-gonic/gin"

func Mount(r *gin.RouterGroup) {
	auth := r.Group("/auth")
	mountAuthRoutes(auth)
}
