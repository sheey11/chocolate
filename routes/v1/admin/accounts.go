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

func mountAccountsRoutes(r *gin.RouterGroup) {
	r.POST("/init", handleServerInitFirstAdminCreation)

	g := r.Group("account")

	g.Use(middleware.AbilityRequired(models.Role{AbilityManageAccount: true}))
	g.GET("/", handleAccountList)
	g.POST("/", handleAccountCreation)
	g.GET("/:username", handleAccountInfoLookup)
	g.GET("/:username/history", handleAccountHistoryRetrial)
	g.DELETE("/:username", handleAccountDeletion)
	g.PUT("/:username/password", handleAccountPasswordModification)
	g.PUT("/:username/role", handleAccountRoleModification)
	g.PUT("/:username/label/:label", handleAccountLabelAppend)
	g.DELETE("/:username/label/:label", handleAccountLabelDeletion)
	g.PUT("/:username/max-room/:count", handleAccountMaxRoomModification)
}

// this method is only used when the serve is backed
// by an empty database(with no admin account),
// and this method create a new admin account without
// any authorization.
func handleServerInitFirstAdminCreation(c *gin.Context) {
	if has, err := service.HasAdminAccount(); err != nil {
		logrus.WithError(err).Error("error when counting admin account count")
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
	if err != nil || data.Username == "" || data.Password == "" {
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidRequestData, "bad request payload"))
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

func handleAccountList(c *gin.Context) {
	role := c.Query("role")
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

	total, users, err := service.ListUsers(search, role, uint(limit), uint(page))
	if err != nil {
		if rerr, ok := err.(cerrors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ToResponse())
			return
		} else {
			logrus.WithError(err).Error("error when handling list users")
			c.Abort()
			c.JSON(http.StatusInternalServerError, err.ToResponse())
			return
		}
	}

	type userAdminListInfo struct {
		ID         uint     `json:"id"`
		Role       string   `json:"role"`
		Labels     []string `json:"labels"`
		Username   string   `json:"username"`
		MaxRoom    uint     `json:"max_rooms"`
		OwnedRooms uint     `json:"owned_rooms"`
	}

	result := lo.Map(users, func(user *models.User, _ int) userAdminListInfo {
		roomCount, _ := user.GetAfflicateRoomCount()
		return userAdminListInfo{
			Labels: lo.Map(user.Labels, func(l models.Label, _ int) string {
				return l.Name
			}),
			ID:         user.ID,
			Role:       user.RoleName,
			Username:   user.Username,
			MaxRoom:    user.MaxRoomCount,
			OwnedRooms: roomCount,
		}
	})

	c.JSON(http.StatusOK, common.Response{
		"code":    0,
		"message": "ok",
		"total":   total,
		"users":   result,
	})
}

func handleAccountCreation(c *gin.Context) {
	users := make([]service.UserCreationInfo, 0)

	if err := c.Bind(&users); err != nil {
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidRequestData, "bad request payload"))
		return
	}

	if len(users) == 0 {
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidRequestData, "empty request"))
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

	c.JSON(http.StatusCreated, common.SampleResponse(0, "created"))
}

func handleAccountInfoLookup(c *gin.Context) {
	username := c.Param("username")
	if username == "" {
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidParameter, "invalid username"))
		return
	}

	user, err := service.GetUserByUsername(username)
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

	type userAdminInfo struct {
		ID       uint                     `json:"id"`
		Role     string                   `json:"role"`
		Username string                   `json:"username"`
		Labels   []string                 `json:"labels"`
		MaxRoom  uint                     `json:"max_rooms"`
		Rooms    []map[string]interface{} `json:"rooms"`
	}

	info := userAdminInfo{
		ID:       user.ID,
		Username: user.Username,
		Role:     user.RoleName,
		Labels: lo.Map(user.Labels, func(l models.Label, _ int) string {
			return l.Name
		}),
		MaxRoom: user.MaxRoomCount,
		Rooms:   user.SummaryRooms(true),
	}

	c.JSON(http.StatusOK, common.Response{
		"code":      0,
		"message":   "ok",
		"user_info": info,
	})
}

func handleAccountHistoryRetrial(c *gin.Context) {
	username := c.Param("username")
	if username == "" {
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidParameter, "invalid username"))
		return
	}
	user, cerr := service.GetUserByUsername(username)
	if cerr != nil {
		if rerr, ok := cerr.(cerrors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ToResponse())
			return
		} else {
			logrus.WithError(cerr).Error("error when handling account history")
			c.Abort()
			c.JSON(http.StatusInternalServerError, cerr.ToResponse())
			return
		}
	}

	start := c.Query("start")
	end := c.Query("end")
	startTs, err := strconv.Atoi(start)
	if err != nil {
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(cerrors.RequestInvalidRoomID, "invalid start time"))
		return
	}
	endTs, err := strconv.Atoi(end)
	if err != nil {
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(cerrors.RequestInvalidRoomID, "invalid end time"))
		return
	}

	startTime := time.Unix(int64(startTs), 0)
	endTime := time.Unix(int64(endTs), 0)

	stats, cerr := service.GetUserWatchingHistory(user.ID, startTime, endTime)
	if cerr != nil {
		if rerr, ok := cerr.(cerrors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ToResponse())
			return
		} else {
			logrus.WithError(cerr).Error("error when handling account history")
			c.Abort()
			c.JSON(http.StatusInternalServerError, cerr.ToResponse())
			return
		}
	}

	c.JSON(http.StatusOK, common.Response{
		"code":    0,
		"message": "ok",
		"history": stats,
	})
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
		c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidRequestData, "bad request payload"))
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
		c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidRequestData, "bad request payload"))
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
	username := c.Param("username")
	label := c.Param("label")

	cerr := service.AddLabelToUser(username, label)
	if cerr != nil {
		if rerr, ok := cerr.(errors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ToResponse())
			return
		} else {
			logrus.WithError(cerr).Error("error when handling user label append")
			c.Abort()
			c.JSON(http.StatusInternalServerError, cerr.ToResponse())
			return
		}
	}

	c.JSON(http.StatusCreated, common.SampleResponse(0, "added"))
}

func handleAccountLabelDeletion(c *gin.Context) {
	username := c.Param("username")
	label := c.Param("label")

	cerr := service.DeleteUserLabel(username, label)
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
	c.JSON(http.StatusOK, common.SampleResponse(0, "deleted"))
}

func handleAccountMaxRoomModification(c *gin.Context) {
	username := c.Param("username")
	countStr := c.Param("count")

	count, err := strconv.Atoi(countStr)
	if err != nil || count < 0 {
		c.Abort()
		c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidRoomID, "bad count parameter"))
		return
	}

	cerr := service.ModifyUserMaxRoom(username, uint(count))
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
	c.JSON(http.StatusOK, common.SampleResponse(0, "modified"))
}
