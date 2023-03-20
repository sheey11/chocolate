package middleware

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sheey11/chocolate/common"
	"github.com/sheey11/chocolate/errors"
	"github.com/sheey11/chocolate/service"
	"github.com/sirupsen/logrus"
)

func RoomOwnershipRequired(paramName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		idStr := c.Param(paramName)
		if idStr == "" {
			c.Abort()
			c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestBadParameter, "empty id parameter given"))
			return
		}

		id, err := strconv.Atoi(idStr)
		if err != nil {
			c.Abort()
			c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidRoomID, "bad id parameter"))
			return
		}

		room, err := service.GetRoomByID(uint(id))
		if err != nil {
			c.Abort()
			if rerr, ok := err.(errors.RequestError); ok {
				c.JSON(http.StatusNotFound, rerr.ToResponse())
			} else {
				logrus.WithError(err).Error("error retriving room")
				c.JSON(http.StatusInternalServerError, common.SampleResponse(http.StatusInternalServerError, "internal server error"))
			}
			return
		}

		user := service.GetUserFromContext(c)
		if room.OwnerID != user.ID {
			c.Abort()
			c.JSON(http.StatusForbidden, common.SampleResponse(errors.RequestNotRoomOwner, "you are not the owner of request room"))
			return
		}
	}
}
