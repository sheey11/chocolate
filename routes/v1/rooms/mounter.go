package rooms

import (
	"github.com/gin-gonic/gin"
)

func Mount(r *gin.RouterGroup) {
	rooms := r.Group("rooms")
	mountChatRoutes(rooms)
	mountRoomsRoutes(rooms)
}
