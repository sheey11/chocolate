package admin

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sheey11/chocolate/common"
	"github.com/sheey11/chocolate/errors"
	"github.com/sheey11/chocolate/middleware"
	"github.com/sheey11/chocolate/models"
	"github.com/sheey11/chocolate/service"
	"github.com/sirupsen/logrus"
)

func mountAccountsRoutes(r *gin.RouterGroup) {
	r.POST("/init", handleServerInitFirstAdminCreation)
	r.Use(middleware.AbilityRequired(models.Role{AbilityManageAccount: true}))
	r.POST("/account", handleAccountCreation)
	r.DELETE("/account/:username", handleAccountDeletion)
	r.PUT("/account/:username/password", handleAccountPasswordModification)
	r.PUT("/account/:username/role", handleAccountRoleModification)
	r.PUT("/account/:username/label/:label", handleAccountLabelAppend)
	r.DELETE("/account/:username/label/:label", handleAccountLabelDeletion)
	r.PUT("/account/:username/max-rooms", handleAccountMaxRoomModification)
}

// this method is only used when the serve is backed
// by an empty database(with no admin account),
// and this method create a new admin account without
// any authorization.
func handleServerInitFirstAdminCreation(c *gin.Context) {
	if has, err := service.HasAdminAccount(); err != nil {
		c.Abort()
		c.JSON(http.StatusInternalServerError, common.SampleResponse(errors.RequestInternalServerError, "internal server error when count admin accounts"))
		return
	} else if has {
		c.Abort()
		c.JSON(http.StatusForbidden, common.SampleResponse(errors.RequestPermissionDenied, "there's already admin accounts"))
		return
	}

	data := struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}{}
	err := c.Bind(&data)
	if err != nil {
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestUnknownContentType, "unknown content type"))
		return
	}
	err = service.CreateAdminAccount(data.Username, data.Password)
	if err != nil {
		c.Abort()
		if rerr, ok := err.(errors.RequestError); ok {
			c.JSON(http.StatusBadRequest, common.SampleResponse(rerr.ID, rerr.Message))
		} else {
			logrus.WithError(err).Error("failed to init the first admin account")
			c.JSON(http.StatusInternalServerError, common.SampleResponse(errors.RequestInternalServerError, "internal server error"))
		}
		return
	}
	c.JSON(http.StatusCreated, common.SampleResponse(0, "ok"))
}

func handleAccountCreation(c *gin.Context) {
	users := make([]service.UserCreationInfo, 0)

	if err := c.Bind(&users); err != nil {
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestUnknownContentType, "unknown content type"))
		return
	}

	if len(users) == 0 {
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestBadParameter, "empty request"))
		return
	}

	if err := service.CreateUserAccounts(users); err != nil {
		if rerr, ok := err.(errors.RequestError); ok {
			c.JSON(http.StatusBadRequest, rerr.ResponseFriendly("zh"))
			return
		} else {
			logrus.WithError(err).Error("error when handle account creation")
			c.Abort()
			c.JSON(http.StatusInternalServerError, common.SampleResponse(errors.RequestInternalServerError, "internal server err"))
			return
		}
	}
}

func handleAccountDeletion(c *gin.Context) {
	username := c.Param("username")

	err := service.DeleteUser(username)
	if err != nil {

		if rerr, ok := err.(errors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ResponseFriendly("zh"))
			return
		} else {
			logrus.WithError(err).Error("error when handle account deletion")
			c.Abort()
			c.JSON(http.StatusInternalServerError, common.SampleResponse(errors.RequestInternalServerError, "internal server err"))
			return
		}
	}

	c.JSON(http.StatusOK, common.SampleResponse(0, "ok"))
}

func handleAccountPasswordModification(c *gin.Context) {
	username := c.Param("username")

	data := struct {
		Password string `json:"password"`
	}{}
	err := c.Bind(&data)
	if err != nil {
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestUnknownContentType, "unknown content type"))
		return
	}

	err = service.UpdatePassword(username, data.Password)
	if err != nil {
		if rerr, ok := err.(errors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ResponseFriendly("zh"))
			return
		} else {
			logrus.WithError(err).Error("error when handle account deletion")
			c.Abort()
			c.JSON(http.StatusInternalServerError, common.SampleResponse(errors.RequestInternalServerError, "internal server err"))
			return
		}
	}

	c.JSON(http.StatusOK, common.OkResponse)
}

func handleAccountRoleModification(c *gin.Context) {
	username := c.Param("username")

	data := struct {
		Role string `json:"role"`
	}{}
	err := c.Bind(&data)
	if err != nil {
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestUnknownContentType, "unknown content type"))
		return
	}

	err = service.UpdateRole(username, data.Role)
	if err != nil {
		if rerr, ok := err.(errors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ResponseFriendly("zh"))
			return
		} else {
			logrus.WithError(err).Error("error when handle account role modification")
			c.Abort()
			c.JSON(http.StatusInternalServerError, common.SampleResponse(errors.RequestInternalServerError, "internal server err"))
			return
		}
	}

	c.JSON(http.StatusOK, common.OkResponse)
}

func handleAccountLabelAppend(c *gin.Context) {
	// TODO
}

func handleAccountLabelDeletion(c *gin.Context) {
	// TODO
}

func handleAccountMaxRoomModification(c *gin.Context) {
	// TODO
}
