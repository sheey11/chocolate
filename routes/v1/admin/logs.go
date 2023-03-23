package admin

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sheey11/chocolate/common"
	"github.com/sheey11/chocolate/errors"
	"github.com/sheey11/chocolate/middleware"
	"github.com/sheey11/chocolate/models"
	"github.com/sheey11/chocolate/service"
	"github.com/sirupsen/logrus"
)

func mountLogsRoutes(r *gin.RouterGroup) {
	r.Use(middleware.AbilityRequired(models.Role{AbilityRetrieveMetrics: true}))
	r.GET("/logs", handleLogsRetrieval)
}

func handleLogsRetrieval(c *gin.Context) {
	filters := c.Query("filter")
	limit := c.Query("limit")
	before := c.Query("before")
	after := c.Query("after")

	types := strings.Split(filters, ",")
	allowedTypes := make([]models.LogType, len(types))
	for i, t := range types {
		logType, err := strconv.Atoi(t)
		allowedTypes[i] = models.LogType(logType)
		if err != nil {
			c.Abort()
			c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidLogFilter, "bad filter format"))
			return
		}
	}

	limitInt, err := strconv.Atoi(limit)
	if err != nil || limitInt <= 0 {
		if err != nil {
			c.Abort()
			c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidLogFilter, "bad filter format"))
			return
		}
	}

	var (
		beforeTime *time.Time = nil
		afterTime  *time.Time = nil
	)

	if before != "" {
		_t, err := time.Parse(time.RFC3339, before)
		if err != nil {
			c.Abort()
			c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidLogFilterBeforeTimestamp, "bad before timestamp format, please use RFC3339"))
			return
		} else {
			beforeTime = &_t
		}
	}

	if after != "" {
		_t, err := time.Parse(time.RFC3339, before)
		if err != nil {
			c.Abort()
			c.JSON(http.StatusBadRequest, common.SampleResponse(errors.RequestInvalidLogFilterAfterTimestamp, "bad after timestamp format, please use RFC3339"))
			return
		} else {
			afterTime = &_t
		}
	}

	count, err := service.CountLogs(allowedTypes, beforeTime, afterTime)
	if err != nil {
		logrus.WithError(err).Error("error when counting logs")
		c.Abort()
		c.JSON(http.StatusInternalServerError, common.SampleResponse(errors.RequestInternalServerError, "internal server error"))
		return
	}

	result, err := service.RetriveLogs(allowedTypes, limitInt, beforeTime, afterTime)
	if err != nil {
		logrus.WithError(err).Error("error retriving logs")
		c.Abort()
		c.JSON(http.StatusInternalServerError, common.SampleResponse(errors.RequestInternalServerError, "internal server error"))
		return
	}

	c.JSON(http.StatusOK, common.Response{
		"code":    0,
		"message": "ok",
		"count":   count,
		"logs":    result,
	})
}
