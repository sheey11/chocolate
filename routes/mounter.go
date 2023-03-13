package routes

import (
	"github.com/gin-gonic/gin"
	v1 "github.com/sheey11/chocolate/routes/v1"
)

func Mount(engine *gin.Engine) {
	v1.Mount(engine)
}
