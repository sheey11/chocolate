package callbacks

import "github.com/gin-gonic/gin"

func Mount(r *gin.RouterGroup) {
	callbacks := r.Group("callbacks")
	mountCallbackRoutes(callbacks)
}
