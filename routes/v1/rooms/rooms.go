package rooms

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/samber/lo"
	"github.com/sheey11/chocolate/common"
	"github.com/sheey11/chocolate/errors"
	cerrors "github.com/sheey11/chocolate/errors"
	"github.com/sheey11/chocolate/middleware"
	"github.com/sheey11/chocolate/models"
	"github.com/sheey11/chocolate/service"
	"github.com/sirupsen/logrus"
)

func mountRoomsRoutes(r *gin.RouterGroup) {
	r.GET("/:id", handleRoomInfoRetrievel)

	r.Use(middleware.AuthRequired())
	r.GET("/", handleListRooms)
	r.POST("/create", middleware.AbilityRequired(models.Role{AbilityCreateRoom: true}), handleRoomCreation)

	r.Use(middleware.RoomOwnershipRequired("id"))
	r.PATCH("/:id/:action", handleRoomAction)
	r.DELETE("/:id", handleRoomDeletion)
	r.PUT("/:id/title/:title", handleRoomTitleModification)

	r.PUT("/:id/permission-type/:type", handleRoomPermissionModification)

	r.PUT("/:id/permission/:subtype/:subject", handleRoomPermissionSubjectAppend)
	r.DELETE("/:id/permission/:subtype/:subject", handleRoomPermissionSubjectDelete)
}

func handleRoomCreation(c *gin.Context) {
	user := service.GetUserFromContext(c)
	if user == nil {
		c.Abort()
		c.JSON(http.StatusInternalServerError, common.SampleResponse(cerrors.RequestInternalServerError, "internal server error"))
		return
	}
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
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id < 0 {
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidParameter, "bad parameter room id"))
		return
	}

	cerr := service.DeleteRoom(uint(id))
	if cerr != nil {
		if rerr, ok := cerr.(errors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ToResponse())
		} else {
			c.Abort()
			c.JSON(http.StatusInternalServerError, cerr.ToResponse())
		}
		return
	}

	c.JSON(http.StatusOK, common.SampleResponse(0, "deleted"))
}

func handleRoomTitleModification(c *gin.Context) {
	title := c.Param("title")
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id < 0 {
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidParameter, "bad parameter room id"))
		return
	}
	if title == "" {
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidParameter, "bad parameter title"))
		return
	}
	cerr := service.ModifyRoomTitle(uint(id), title)
	if cerr != nil {
		if rerr, ok := cerr.(errors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ToResponse())
			return
		} else {
			c.Abort()
			c.JSON(http.StatusInternalServerError, cerr.ToResponse())
			return
		}
	}
	c.JSON(http.StatusOK, common.OkResponse)
}

func handleListRooms(c *gin.Context) {
	user := service.GetUserFromContext(c)
	if user == nil {
		c.Abort()
		c.JSON(http.StatusInternalServerError, common.SampleResponse(cerrors.RequestInternalServerError, "internal server error"))
		return
	}

	status := c.Query("status")
	search := c.Query("search")
	limitStr := c.Query("limit")
	pageStr := c.Query("page")

	var limit = 20
	var page = 1

	if pageStr != "" {
		var err error
		page, err = strconv.Atoi(pageStr)
		if err != nil {
			c.Abort()
			c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidParameter, "bad parameter page"))
			return
		}
		if page <= 0 {
			c.Abort()
			c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidParameter, "invalid page"))
			return
		}
	}

	if limitStr != "" {
		var err error
		limit, err = strconv.Atoi(limitStr)
		if err != nil {
			c.Abort()
			c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidParameter, "bad parameter limit"))
			return
		}
		if limit <= 0 {
			c.Abort()
			c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidParameter, "invalid limit"))
			return
		}
		if limit > 100 {
			c.Abort()
			c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidParameter, "limit too large"))
			return
		}
	}

	var statusFilter *models.RoomStatus

	if status != "" {
		sInt, err := strconv.Atoi(status)
		sStatus := models.RoomStatus(sInt)

		if err == nil {
			switch sStatus {
			case models.RoomStatusStreaming:
				fallthrough
			case models.RoomStatusIdle:
				statusFilter = &sStatus
			}
		}
	}
	total, rooms, err := service.ListRooms(user, statusFilter, search, uint(limit), uint(page))
	if err != nil {
		if rerr, ok := err.(cerrors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ToResponse())
			return
		} else {
			logrus.WithError(err).Error("error when handling list rooms")
			c.Abort()
			c.JSON(http.StatusInternalServerError, err.ToResponse())
			return
		}
	}

	type roomListInfo struct {
		ID             uint                      `json:"id"`
		UID            string                    `json:"uid"`
		Viewers        uint                      `json:"viewers"`
		Title          string                    `json:"title"`
		Status         string                    `json:"status"`
		PermissionType models.RoomPermissionType `json:"permission_type"`
	}

	result := lo.Map(rooms, func(room *models.Room, _ int) roomListInfo {
		return roomListInfo{
			ID:             room.ID,
			UID:            room.UID,
			Viewers:        room.Viewers,
			Title:          room.Title,
			Status:         room.Status.ToString(),
			PermissionType: room.PermissionType,
		}
	})

	c.JSON(http.StatusOK, common.Response{
		"code":    0,
		"message": "ok",
		"total":   total,
		"rooms":   result,
	})
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
	if cerr != nil {
		if rerr, ok := cerr.(errors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ToResponse())
		} else {
			c.Abort()
			c.JSON(http.StatusInternalServerError, cerr.ToResponse())
		}
		return
	}
	user := service.TryGetUserFromContext(c)
	allowed := service.IsUserAllowedForRoom(room, user)
	if !allowed {
		c.Abort()
		c.JSON(http.StatusForbidden, common.SampleResponse(errors.RequestRoomBanned, "banned user"))
		return
	}

	response := common.Response{
		"code":           0,
		"message":        "ok",
		"id":             room.ID,
		"title":          room.Title,
		"status":         room.Status.ToString(),
		"playback":       room.GetPlaybackInfo(),
		"viewers":        room.Viewers,
		"last_streaming": room.LastStreamingAt,
	}

	if user != nil && room.OwnerID == user.ID {
		response["permission_type"] = room.PermissionType
		response["permission_items"] = room.PermissionItems
	}

	c.JSON(http.StatusOK, response)
}

type RoomAction string

const (
	RoomActionStartStreaming = "start-streaming"
	RoomActionStopStreaming  = "stop-streaming"
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

	if err != nil {
		if rerr, ok := err.(errors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ToResponse())
			return
		} else {
			logrus.WithError(err).Error("error when setting room status")
			c.Abort()
			c.JSON(http.StatusInternalServerError, common.SampleResponse(errors.RequestInternalServerError, "internal server error"))
			return
		}
	}

	room, err := service.GetRoomByID(uint(id))
	if err != nil {
		if rerr, ok := err.(errors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ToResponse())
			return
		} else {
			logrus.WithError(err).Error("error when processing room action")
			c.Abort()
			c.JSON(http.StatusInternalServerError, common.SampleResponse(errors.RequestInternalServerError, "internal server error"))
			return
		}
	}

	if action == RoomActionStartStreaming {
		c.JSON(http.StatusOK, common.Response{
			"code":      0,
			"message":   "ok",
			"streamkey": room.GetStreamKey(),
		})
	} else {
		c.JSON(http.StatusOK, common.Response{
			"code":    0,
			"message": "ok",
		})
	}
}

func handleRoomPermissionModification(c *gin.Context) {
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

	c.JSON(http.StatusOK, common.OkResponse)
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

	c.JSON(http.StatusOK, common.OkResponse)
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
	c.JSON(http.StatusOK, common.OkResponse)
}
