package auth

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sheey11/chocolate/common"
	"github.com/sheey11/chocolate/errors"
	"github.com/sheey11/chocolate/service"
	"github.com/sirupsen/logrus"
)

func mountAuthRoutes(r *gin.RouterGroup) {
	r.POST("/password", handlePasswordAuthenticate)
}

func handlePasswordAuthenticate(c *gin.Context) {
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

	user, session, err := service.TryLogin(data.Username, data.Password, c.ClientIP(), c.Request.UserAgent())
	if err != nil {
		if rerr, ok := err.(errors.RequestError); ok {
			c.JSON(http.StatusBadRequest, common.SampleResponse(rerr.ID, rerr.Message))
		} else {
			logrus.WithError(err).Error("error when login")
			c.JSON(http.StatusInternalServerError, common.SampleResponse(errors.RequestInternalServerError, "internal server error"))
		}
		return
	}

	jwtPayload := common.JwtPayload{
		Session:       session.ID,
		SessionExpire: uint32(session.ValidUntil.Unix()),
		User:          user.ID,
		UserRole:      user.RoleName,
		Username:      user.Username,
	}
	jwt := common.CreateJwt(jwtPayload)

	response := common.Response{
		"code":     0,
		"message":  "ok",
		"jwt":      jwt,
		"username": user.Username,
		"role":     strings.ToLower(user.Role.Name),
	}
	c.JSON(http.StatusOK, response)
}
