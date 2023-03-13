package callbacks

import "github.com/gin-gonic/gin"

func Mount(r *gin.RouterGroup) {
	mountCallbackRoutes(r)
}
