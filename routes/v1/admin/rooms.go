package admin

import (
	"net/http"
	"strconv"
	"time"

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
		} else if limit < 10 {
			c.Abort()
			c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidParameter, "limit too small"))
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
	total, rooms, err := service.ListRooms(nil, statusFilter, search, uint(limit), uint(page))
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

	type roomAdminListInfo struct {
		ID             uint                      `json:"id"`
		UID            string                    `json:"uid"`
		Viewers        uint                      `json:"viewers"`
		Title          string                    `json:"title"`
		Status         string                    `json:"status"`
		OwnerID        uint                      `json:"owner_id"`
		OwnerName      string                    `json:"owner_username"`
		PermissionType models.RoomPermissionType `json:"permission_type"`
		LastStreaming  time.Time                 `json:"last_streaming"`
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
			LastStreaming:  room.LastStreamingAt,
		}
	})

	c.JSON(http.StatusOK, common.Response{
		"code":    0,
		"message": "ok",
		"total":   total,
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
			logrus.WithError(cerr).Error("error when room info retrival")
			c.Abort()
			c.JSON(http.StatusInternalServerError, cerr.ToResponse())
			return
		}
	}

	type permissionItemAdminInfo struct {
		Type     models.PermissionSubjectType `json:"type"`
		Label    *string                      `json:"label"`
		UserID   *uint                        `json:"user_id"`
		UserName *string                      `json:"username"`
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
		PermissionItems []permissionItemAdminInfo `json:"permission_items"`
		LastStreaming   time.Time                 `json:"last_streaming"`
		Stream          *service.SRSStreamInfo    `json:"srs_stream"`
	}

	var stream *service.SRSStreamInfo
	if streamID := service.GetRoomStreamID(room); streamID != nil {
		stream, err = service.GetRoomStreamSRSInfo(room)
		if err != nil {
			logrus.WithError(err).Error("error when retriving srs stream detail when handing admin room info lookup")
		}
	}
	c.JSON(http.StatusOK, common.Response{
		"code":    0,
		"message": "ok",
		"rooms": roomAdminListInfo{
			ID:             room.ID,
			UID:            room.UID,
			Viewers:        room.Viewers,
			Title:          room.Title,
			Status:         room.Status.ToString(),
			OwnerID:        room.OwnerID,
			OwnerName:      room.Owner.Username,
			PermissionType: room.PermissionType,
			PermissionItems: lo.Map(room.PermissionItems, func(item models.PermissionItem, _ int) permissionItemAdminInfo {
				var username *string = nil
				if item.SubjectType == models.PermissionSubjectTypeUser {
					if item.SubjectUser != nil {
						username = &item.SubjectUser.Username
					} else {
						user := service.GetUserByID(*item.SubjectUserID)
						if user == nil {
							logrus.
								WithField("user_id", item.SubjectUserID).
								WithField("stack_trace", cerrors.GetStackTrace()).
								Error("logic: the user is null")
						} else {
							username = &user.Username
						}
					}
				}
				return permissionItemAdminInfo{
					UserName: username,
					UserID:   item.SubjectUserID,
					Label:    item.SubjectLabelName,
					Type:     item.SubjectType,
				}
			}),
			LastStreaming: room.LastStreamingAt,
			Stream:        stream,
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
			logrus.WithError(cerr).Error("error when handling room actions")
			c.Abort()
			c.JSON(http.StatusInternalServerError, cerr.ToResponse())
			return
		}
	}

	u := service.GetUserFromContext(c)
	if u == nil {
		c.Abort()
		c.JSON(http.StatusInternalServerError, common.SampleResponse(cerrors.RequestInternalServerError, "internal server error"))
		return
	}

	switch RoomAction(action) {
	case RoomActionCut:
		cerr = service.CutOffStream(room, u.ID)
		if cerr != nil {
			if rerr, ok := cerr.(cerrors.RequestError); ok {
				c.Abort()
				c.JSON(http.StatusBadRequest, rerr.ToResponse())
				return
			} else {
				logrus.WithError(cerr).Error("error when handling room actions")
				c.Abort()
				c.JSON(http.StatusInternalServerError, cerr.ToResponse())
				return
			}
		}
		c.JSON(http.StatusOK, common.SampleResponse(0, "ok"))
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

	user := service.GetUserFromContext(c)

	cerr := service.DeleteRoom(uint(id), user.ID)
	if cerr != nil {
		if rerr, ok := cerr.(cerrors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ToResponse())
			return
		} else {
			logrus.WithError(cerr).Error("error when handling room deletion")
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
			logrus.WithError(cerr).Error("error when handling room timeline retrival")
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
