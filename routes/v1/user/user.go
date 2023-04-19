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
	"github.com/sirupsen/logrus"
)

func mountUserRoutes(r *gin.RouterGroup) {
	r.GET("/me", middleware.AuthRequired(), handleMe)
	r.GET("/:username", handleInfoLookup)
	r.PUT("/password/:new", handlePasswordChange)
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
			logrus.WithError(err).Error("error while lookup user info")
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

func handlePasswordChange(c *gin.Context) {
	data := struct {
		Old    string `json:"old"`
		Logout bool   `json:"logout"`
	}{}

	err := c.ShouldBind(&data)
	if err != nil {
		c.JSON(http.StatusBadRequest, common.SampleResponse(cerrors.RequestInvalidRequestData, "invalid data"))
		c.Abort()
		return
	}

	newPassword := c.Param("new")

	user := service.GetUserFromContext(c)
	if user == nil {
		c.Abort()
		c.Status(http.StatusForbidden)
		return
	}
	session := service.GetSessionFromContext(c)

	cerr := service.ChangePassword(user, data.Old, newPassword, data.Logout, session)
	if cerr != nil {
		if rerr, ok := cerr.(cerrors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ToResponse())
			return
		} else {
			logrus.WithError(cerr).Error("error while updating user password")
			c.JSON(http.StatusBadRequest, cerr.ToResponse())
			c.Abort()
			return
		}
	}

	c.JSON(http.StatusOK, common.OkResponse)
}
