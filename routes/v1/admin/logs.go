package admin

import "github.com/gin-gonic/gin"

func mountLogsRoutes(r *gin.RouterGroup) {
	r.GET("/logs", handleLogsRetrieval)
}

func handleLogsRetrieval(c *gin.Context) {
	// TODO
}
