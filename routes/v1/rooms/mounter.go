package rooms

import (
	"github.com/gin-gonic/gin"
)

func Mount(r *gin.RouterGroup) {
	r.Group("rooms")
	mountRoomsRoutes(r)
	mountChatRoutes(r)
}
