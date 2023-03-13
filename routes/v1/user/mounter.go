package user

import "github.com/gin-gonic/gin"

func Mount(r *gin.RouterGroup) {
	user := r.Group("/user")
	mountUserRoutes(user)
}
