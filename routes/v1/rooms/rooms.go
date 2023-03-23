package rooms

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sheey11/chocolate/common"
	"github.com/sheey11/chocolate/errors"
	"github.com/sheey11/chocolate/middleware"
	"github.com/sheey11/chocolate/models"
	"github.com/sheey11/chocolate/service"
	"github.com/sirupsen/logrus"
)

func mountRoomsRoutes(r *gin.RouterGroup) {
	r.GET("/:id", handleRoomInfoRetrievel)

	r.Use(middleware.AuthRequired())
	r.POST("/create", middleware.AbilityRequired(models.Role{AbilityCreateRoom: true}), handleRoomCreation)

	r.Use(middleware.RoomOwnershipRequired("id"))
	r.PATCH("/:id/:action", handleRoomAction)
	r.DELETE("/:id", handleRoomDeletion)

	r.PUT("/:id/permission-type/:type", handleRoomPermissionModify)

	r.PUT("/:id/permission/:subtype/:subject", handleRoomPermissionSubjectAppend)
	r.DELETE("/:id/permission/:subtype/:subject", handleRoomPermissionSubjectDelete)
}

func handleRoomCreation(c *gin.Context) {
	user := service.GetUserFromContext(c)
	data := struct {
		Title string `json:"title"`
	}{}
	err := c.Bind(&data)
	if err != nil {
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidRequestData, "bad request payload"))
		return
	}

	room, err := service.CreateRoomForUser(user, data.Title)
	if err != nil {
		if rerr, ok := err.(errors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ToResponse())
			return
		} else {
			logrus.WithError(err).Error("error creating room")
			c.Abort()
			c.JSON(http.StatusInternalServerError, common.SampleResponse(errors.RequestInternalServerError, "count exists room count failed"))
			return
		}
	}

	c.JSON(http.StatusCreated, common.Response{
		"code":    0,
		"message": "ok",
		"room_id": room.ID,
		"title":   room.Title,
	})
}

func handleRoomDeletion(c *gin.Context) {
	// TODO
}

func handleRoomInfoRetrievel(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id < 0 {
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidParameter, "bad parameter room id"))
		return
	}

	room, cerr := service.GetRoomByID(uint(id))
	if err != nil {
		if rerr, ok := cerr.(errors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ToResponse())
		} else {
			c.Abort()
			c.JSON(http.StatusInternalServerError, cerr.ToResponse())
		}
		return
	}

	response := common.Response{
		"code":     0,
		"message":  "ok",
		"id":       room.ID,
		"title":    room.Title,
		"status":   room.Status.ToString(),
		"playback": room.GetPlaybackInfo(),
		"viewers":  0, // TODO
	}
	user := service.TryGetUserFromContext(c)
	if user != nil && room.OwnerID == user.ID {
		response["permission_type"] = room.PermissionType
		response["permission_items"] = room.PermissionItems
	}

	c.JSON(http.StatusOK, response)
}

type RoomAction string

const (
	RoomActionStartStreaming = "start_streaming"
	RoomActionStopStreaming  = "stop_streaming"
)

func handleRoomAction(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id < 0 {
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidRequestData, "bad request payload"))
		return
	}
	action := RoomAction(c.Param("action"))

	switch action {
	case RoomActionStartStreaming:
		err = service.SetRoomStartStreaming(uint(id))
	case RoomActionStopStreaming:
		err = service.SetRoomStopStreaming(uint(id))
	default:
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestUnknownRoomActionType, "bad action type"))
		return
	}
}

func handleRoomPermissionModify(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	permissionType := models.RoomPermissionType(c.Param("type"))

	data := struct {
		ClearPrevious bool `json:"clear_previous"`
	}{false}
	if c.Request.ContentLength != 0 {
		err := c.Bind(&data)
		if err != nil {
			c.Abort()
			c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidRequestData, "bad request payload"))
			return
		}
	}

	err := service.ChangeRoomPermission(uint(id), permissionType, data.ClearPrevious)
	if err != nil {
		if rerr, ok := err.(errors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ToResponse())
			return
		} else {
			logrus.WithError(err).Error("error when handling room permission modify")
			c.Abort()
			c.JSON(http.StatusInternalServerError, common.SampleResponse(errors.RequestInternalServerError, "internal server error"))
			return
		}
	}
}

func handleRoomPermissionSubjectAppend(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	permissionType := models.PermissionSubjectType(c.Param("subtype"))
	subject := c.Param("subject")

	var err error

	if permissionType == models.PermissionSubjectTypeLabel {
		label := string(subject)
		err = service.AddRoomPermissionItem_Label(uint(id), label)
	} else if permissionType == models.PermissionSubjectTypeUser {
		var uid int
		uid, err = strconv.Atoi(subject)
		if err != nil || uid < 0 {
			c.Abort()
			c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidRequestData, "invalid subject"))
			return
		}
		err = service.AddRoomPermissionItem_User(uint(id), uint(uid))
	} else {
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestUnknownRoomPermissionItemType, "unknown permission item type"))
		return
	}

	if err != nil {
		if rerr, ok := err.(errors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ToResponse())
			return
		} else {
			logrus.WithError(err).Error("error when handling room permission item deletion")
			c.Abort()
			c.JSON(http.StatusInternalServerError, common.SampleResponse(errors.RequestInternalServerError, "internal server error"))
			return
		}
	}
}

func handleRoomPermissionSubjectDelete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	permissionType := models.PermissionSubjectType(c.Param("subtype"))
	subject := c.Param("subject")

	var err error

	if permissionType == models.PermissionSubjectTypeLabel {
		label := string(subject)
		err = service.DeleteRoomPermissionItem_Label(uint(id), label)
	} else if permissionType == models.PermissionSubjectTypeUser {
		var uid int
		uid, err = strconv.Atoi(subject)
		if err != nil {
			c.Abort()
			c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidRequestData, "invalid subject"))
			return
		}
		err = service.DeleteRoomPermissionItem_User(uint(id), uint(uid))
	} else {
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestUnknownRoomPermissionItemType, "unknown permission item type"))
		return
	}

	if err != nil {
		if rerr, ok := err.(errors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ToResponse())
			return
		} else {
			logrus.WithError(err).Error("error when handling room permission item deletion")
			c.Abort()
			c.JSON(http.StatusInternalServerError, common.SampleResponse(errors.RequestInternalServerError, "internal server error"))
			return
		}
	}
}
