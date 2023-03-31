package user

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/samber/lo"
	"github.com/sheey11/chocolate/common"
	cerrors "github.com/sheey11/chocolate/errors"
	"github.com/sheey11/chocolate/middleware"
	"github.com/sheey11/chocolate/models"
	"github.com/sheey11/chocolate/service"
)

func mountUserRoutes(r *gin.RouterGroup) {
	r.GET("/me", middleware.AuthRequired(), handleMe)
	r.GET("/:username", handleInfoLookup)
}

func handleMe(c *gin.Context) {
	user := service.GetUserFromContext(c)
	if user == nil {
		c.Abort()
		c.JSON(http.StatusInternalServerError, common.SampleResponse(cerrors.RequestInternalServerError, "internal server error"))
		return
	}
	session := service.GetSessionFromContext(c)
	c.JSON(http.StatusOK, common.Response{
		"code":           0,
		"message":        "ok",
		"id":             user.ID,
		"username":       user.Username,
		"role":           user.Role.Name,
		"session_expire": session.ValidUntil,
		"labels":         lo.Map(user.Labels, func(label models.Label, _ int) string { return label.Name }),
		"max_rooms":      user.MaxRoomCount,
		"rooms":          user.SummaryRooms(true),
	})
}

func handleInfoLookup(c *gin.Context) {
	username := c.Param("username")
	if username == "" {
		c.JSON(http.StatusBadRequest, common.SampleResponse(cerrors.RequestInvalidParameter, "invalid username"))
		c.Abort()
		return
	}

	user, err := service.GetUserByUsername(username)
	if err != nil {
		if rerr, ok := err.(cerrors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ToResponse())
			return
		} else {
			c.JSON(http.StatusBadRequest, err.ToResponse())
			c.Abort()
			return
		}
	}
	c.JSON(http.StatusOK, common.Response{
		"code":     0,
		"message":  "ok",
		"id":       user.ID,
		"username": user.Username,
		"role":     user.Role.Name,
		"labels":   user.Labels,
		"rooms":    user.SummaryRooms(false),
	})
}
