package service

import (
	"github.com/gin-gonic/gin"
	"github.com/sheey11/chocolate/common"
	"github.com/sheey11/chocolate/models"
	"github.com/sirupsen/logrus"
)

// only call this method **after** verified the jwt.
func GetSessionFromContext(c *gin.Context) *models.Session {
	auth := c.GetHeader("Authorization")
	if len(auth) <= 8 {
		logrus.
			WithField("url", c.Request.URL).
			Errorf("a handler precessing non-authorized request have called GetSessionFromContext method, check your code.")
		return nil
	}
	jwt := auth[7:]
	payload, err := common.DecryptJwt(jwt)
	if err != nil {
		logrus.
			WithError(err).
			WithField("url", c.Request.URL).
			Errorf("a handler precessing non-authorized request have called GetSessionFromContext method, check your code.")
		return nil
	}

	return models.GetSessionByID(payload.Session)
}
