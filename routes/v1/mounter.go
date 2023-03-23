package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/sheey11/chocolate/routes/v1/admin"
	"github.com/sheey11/chocolate/routes/v1/auth"
	"github.com/sheey11/chocolate/routes/v1/callbacks"
	"github.com/sheey11/chocolate/routes/v1/rooms"
	"github.com/sheey11/chocolate/routes/v1/stats"
	"github.com/sheey11/chocolate/routes/v1/user"
)

func Mount(engine *gin.Engine) {
	g := engine.Group("v1")
	admin.Mount(g)
	rooms.Mount(g)
	auth.Mount(g)
	stats.Mount(g)
	user.Mount(g)
	callbacks.Mount(g)
}
