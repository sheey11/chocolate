package rooms

import "github.com/gin-gonic/gin"

func mountChatRoutes(r *gin.RouterGroup) {
	r.GET("/:id/chat", handleChatConnect)
}

func handleChatConnect(c *gin.Context) {
	// TODO
}
