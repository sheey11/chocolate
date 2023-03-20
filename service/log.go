package service

import (
	"time"

	"github.com/sheey11/chocolate/errors"
	"github.com/sheey11/chocolate/models"
	"github.com/sirupsen/logrus"
)

func RecordPublishEvent(roomId uint, ip string) {
	err := models.RecordEventWithDetail(models.LogTypePublish, roomId, "client ip: "+ip)
	if err != nil {
		logrus.WithError(err).Errorf("error when create publish event record, roomUid %v", roomId)
	}
}

func RecordUnpublishEvent(roomid uint) {
	err := models.RecordEvent(models.LogTypeUnpublish, roomid)
	if err != nil {
		logrus.WithError(err).Errorf("error when create unpublish event record, roomid %v", roomid)
	}
}

func RecordPlayEvent(userid uint) {
	err := models.RecordEvent(models.LogTypePlay, userid)
	if err != nil {
		logrus.WithError(err).Errorf("error when create play event record, userid %v", userid)
	}
}

func RecordStopEvent(userid uint) {
	err := models.RecordEvent(models.LogTypeStop, userid)
	if err != nil {
		logrus.WithError(err).Errorf("error when create stop event record, userid %v", userid)
	}
}

func CountLogs(allowedTypes []models.LogType, before *time.Time, after *time.Time) (int64, error) {
	if before != nil && after != nil && before.Before(*after) {
		return 0, errors.RequestError{
			ID:      errors.RequestLogRetrivalInvalidTimeRange,
			Message: "invalid time range",
		}
	}

	if len(allowedTypes) == 0 {
		allowedTypes = []models.LogType{
			models.LogTypePublish,
			models.LogTypeUnpublish,
			models.LogTypePlay,
			models.LogTypeStop,
		}
	}
	return models.CountLogs(allowedTypes, before, after)
}

func RetriveLogs(allowedTypes []models.LogType, limit int, before *time.Time, after *time.Time) ([]*models.Log, error) {
	if before != nil && after != nil && before.Before(*after) {
		return nil, errors.RequestError{
			ID:      errors.RequestLogRetrivalInvalidTimeRange,
			Message: "invalid time range",
		}
	}

	if len(allowedTypes) == 0 {
		allowedTypes = []models.LogType{
			models.LogTypePublish,
			models.LogTypeUnpublish,
			models.LogTypePlay,
			models.LogTypeStop,
		}
	}
	if limit == 0 {
		limit = 20
	} else if limit > 100 {
		return nil, errors.RequestError{
			ID: errors.RequestLogRetrivalLimitTooBig,
		}
	}

	return models.RetriveLogs(allowedTypes, limit, before, after)
}
