package rooms

import (
	"github.com/gin-gonic/gin"
	"github.com/sheey11/chocolate/middleware"
	"github.com/sheey11/chocolate/service"
)

func mountRoomsRoutes(r *gin.RouterGroup) {
	r.Use(middleware.AuthRequired())
	r.POST("/create", handleRoomCreation)

	r.DELETE("/:id", handleRoomDeletion)
	r.GET("/:id", handleRoomInfoRetrievel)
	r.PATCH("/:id", handleRoomAction)

	r.PUT("/:id/permission", handleRoomPermissionModify)

	r.PUT("/:id/permission/:subtype/:subject", handleRoomPermissionSubjectAppend)
	r.DELETE("/:id/permission/:subtype/:subject", handleRoomPermissionSubjectDelete)
}

func handleRoomCreation(c *gin.Context) {
	user := service.GetUserFromContext(c)
	// TODO
}

func handleRoomDeletion(c *gin.Context) {
	// TODO
}

func handleRoomInfoRetrievel(c *gin.Context) {
	// TODO
}

type RoomAction string

const (
	RoomActionStartStreaming = "start_streaming"
	RoomActionStopStreaming  = "stop_streaming"
)

func handleRoomAction(c *gin.Context) {
	// TODO
	// on start_streaming, generate new pushkey
}

func handleRoomPermissionModify(c *gin.Context) {
	// TODO
}

func handleRoomPermissionSubjectAppend(c *gin.Context) {
	// TODO
}

func handleRoomPermissionSubjectDelete(c *gin.Context) {
	// TODO
}
