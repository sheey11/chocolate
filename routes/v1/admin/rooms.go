package admin

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/samber/lo"
	"github.com/sheey11/chocolate/common"
	cerrors "github.com/sheey11/chocolate/errors"
	"github.com/sheey11/chocolate/middleware"
	"github.com/sheey11/chocolate/models"
	"github.com/sheey11/chocolate/service"
)

func mountRoomRoutes(r *gin.RouterGroup) {
	r.Use(middleware.AbilityRequired(models.Role{AbilityManageRoom: true}))
	g := r.Group("room")
	g.GET("/", handleListRooms)
	g.GET("/:id", handleRoomInfoRetrival)
	g.PATCH("/:id/:action", handleRoomActions)
	g.DELETE("/:id", handleRoomDeletion)
	g.GET("/:id/timeline", handleRoomTimelineRetrival)
}

func handleListRooms(c *gin.Context) {
	status := c.Query("status")
	search := c.Query("search")

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
	rooms, err := service.ListRooms(statusFilter, search)
	if err != nil {
		if rerr, ok := err.(cerrors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ToResponse())
			return
		} else {
			c.Abort()
			c.JSON(http.StatusInternalServerError, err.ToResponse())
			return
		}
	}

	type roomAdminListInfo struct {
		ID             uint                      `json:"id"`
		UID            string                    `json:"uid"`
		Viewers        uint                      `json:"viewers"`
		Title          string                    `json:"title"`
		Status         string                    `json:"status"`
		OwnerID        uint                      `json:"owner_id"`
		OwnerName      string                    `json:"owner_username"`
		PermissionType models.RoomPermissionType `json:"permission_type"`
	}

	result := lo.Map(rooms, func(room *models.Room, _ int) roomAdminListInfo {
		return roomAdminListInfo{
			ID:             room.ID,
			UID:            room.UID,
			Viewers:        room.Viewers,
			Title:          room.Title,
			Status:         room.Status.ToString(),
			OwnerID:        room.OwnerID,
			OwnerName:      room.Owner.Username,
			PermissionType: room.PermissionType,
		}
	})

	c.JSON(http.StatusOK, common.Response{
		"code":    0,
		"message": "ok",
		"rooms":   result,
	})
}

func handleRoomInfoRetrival(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id < 0 {
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(cerrors.RequestInvalidParameter, "invalid id"))
		return
	}

	room, cerr := service.GetRoomByIDWithDetail(uint(id))
	if cerr != nil {
		if rerr, ok := cerr.(cerrors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ToResponse())
			return
		} else {
			c.Abort()
			c.JSON(http.StatusInternalServerError, cerr.ToResponse())
			return
		}
	}

	type roomAdminListInfo struct {
		ID              uint                      `json:"id"`
		UID             string                    `json:"uid"`
		Viewers         uint                      `json:"viewers"`
		Title           string                    `json:"title"`
		Status          string                    `json:"status"`
		OwnerID         uint                      `json:"owner_id"`
		OwnerName       string                    `json:"owner_username"`
		PermissionType  models.RoomPermissionType `json:"permission_type"`
		PermissionItems []models.PermissionItem   `json:"permission_items"`
	}

	c.JSON(http.StatusOK, common.Response{
		"code":    0,
		"message": "ok",
		"rooms": roomAdminListInfo{
			ID:              room.ID,
			UID:             room.UID,
			Viewers:         room.Viewers,
			Title:           room.Title,
			Status:          room.Status.ToString(),
			OwnerID:         room.OwnerID,
			OwnerName:       room.Owner.Username,
			PermissionType:  room.PermissionType,
			PermissionItems: room.PermissionItems,
		},
	})
}

type RoomAction string

const (
	RoomActionCut RoomAction = "cutoff"
)

func handleRoomActions(c *gin.Context) {
	idStr := c.Param("id")
	action := c.Param("action")

	id, err := strconv.Atoi(idStr)
	if err != nil || id < 0 {
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(cerrors.RequestInvalidRoomID, "invalid room id"))
		return
	}

	room, cerr := service.GetRoomByID(uint(id))
	if cerr != nil {
		if rerr, ok := cerr.(cerrors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ToResponse())
			return
		} else {
			c.Abort()
			c.JSON(http.StatusInternalServerError, cerr.ToResponse())
			return
		}
	}

	u := service.GetUserFromContext(c)

	switch RoomAction(action) {
	case RoomActionCut:
		cerr = service.CutOffStream(room, u.ID)
		if cerr != nil {
			if rerr, ok := cerr.(cerrors.RequestError); ok {
				c.Abort()
				c.JSON(http.StatusBadRequest, rerr.ToResponse())
				return
			} else {
				c.Abort()
				c.JSON(http.StatusInternalServerError, cerr.ToResponse())
				return
			}
		}
	default:
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(cerrors.RequestUnknownRoomActionType, "unknown action"))
		return
	}
}

func handleRoomDeletion(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id < 0 {
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(cerrors.RequestInvalidRoomID, "invalid room id"))
		return
	}

	cerr := service.DeleteRoom(uint(id))
	if cerr != nil {
		if rerr, ok := cerr.(cerrors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ToResponse())
			return
		} else {
			c.Abort()
			c.JSON(http.StatusInternalServerError, cerr.ToResponse())
			return
		}
	}

	c.JSON(http.StatusOK, common.SampleResponse(0, "room deleted"))
}

func handleRoomTimelineRetrival(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id < 0 {
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(cerrors.RequestInvalidRoomID, "invalid room id"))
		return
	}

	logs, cerr := service.RetriveRoomTimeline(uint(id))
	if cerr != nil {
		if rerr, ok := cerr.(cerrors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ToResponse())
			return
		} else {
			c.Abort()
			c.JSON(http.StatusInternalServerError, cerr.ToResponse())
			return
		}

	}
	c.JSON(http.StatusOK, common.Response{
		"code":    0,
		"message": "ok",
		"logs":    logs,
	})
}
