package admin

import "github.com/gin-gonic/gin"

func Mount(r *gin.RouterGroup) {
	admin := r.Group("/admin")
	mountAccountsRoutes(admin)
	mountLogsRoutes(admin)
	mountRoomRoutes(admin)
	mountRolesRoutes(admin)
}
