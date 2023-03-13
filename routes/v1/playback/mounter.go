package playback

import "github.com/gin-gonic/gin"

func Mount(r *gin.RouterGroup) {
	r.Group("/playback")
	mountPlaybackRoutes(r)
}
