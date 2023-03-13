package admin

import "github.com/gin-gonic/gin"

func mountRoomRoutes(r *gin.RouterGroup) {
	r.PATCH("/room/:id", handleRoomActions)
}

type RoomAction string

const (
	RoomActionCut RoomAction = "cut"
)

func handleRoomActions(c *gin.Context) {
	// TODO
}
