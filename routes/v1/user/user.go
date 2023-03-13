package user

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sheey11/chocolate/common"
	"github.com/sheey11/chocolate/errors"
	"github.com/sheey11/chocolate/middleware"
	"github.com/sheey11/chocolate/models"
	"github.com/sheey11/chocolate/service"
)

func mountUserRoutes(r *gin.RouterGroup) {
	r.GET("/me", middleware.AuthRequired(), handleMe)
	r.GET("/:id", handleInfoLookup)
}

func handleMe(c *gin.Context) {
	user := service.GetUserFromContext(c)
	session := service.GetSessionFromContext(c)
	c.JSON(http.StatusOK, common.Response{
		"code":           0,
		"message":        "ok",
		"username":       user.Username,
		"role":           user.Role.Name,
		"session_expire": session.ValidUntil,
		"labels":         user.Labels,
		"max_rooms":      user.MaxRoomCount,
		"rooms":          user.SummaryRooms(),
	})
}

func handleInfoLookup(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestBadParameter, "bad id given"))
		c.Abort()
		return
	}

	user := models.GetUserByID(uint(id))
	if user == nil {
		c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestUserNotExist, "the given user is not exist"))
		c.Abort()
		return
	}
	c.JSON(http.StatusOK, common.Response{
		"code":     0,
		"message":  "ok",
		"username": user.Username,
		"role":     user.Role.Name,
		"labels":   user.Labels,
	})
}
