package stats

import "github.com/gin-gonic/gin"

func Mount(r *gin.RouterGroup) {
	stats := r.Group("/stats")
	mountStatsRoutes(stats)
}
