package admin

import "github.com/gin-gonic/gin"

func mountRolesRoutes(r *gin.RouterGroup) {
	r.GET("/roles", handleRolesRetrieval)
}

func handleRolesRetrieval(c *gin.Context) {
	// TODO
}
