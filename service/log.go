package service

import (
	"encoding/json"
	"time"

	cerrors "github.com/sheey11/chocolate/errors"
	"github.com/sheey11/chocolate/models"
	"github.com/sirupsen/logrus"
)

func RecordPublishEvent(roomId uint, detail string) {
	err := models.RecordEventWithDetail(models.LogTypePublish, roomId, detail)
	if err != nil {
		logrus.WithError(err).Errorf("error when create publish event record, roomUid %v", roomId)
	}
}

func RecordUnpublishEvent(roomid uint, detail string) {
	err := models.RecordLog(models.LogTypeUnpublish, roomid)
	if err != nil {
		logrus.WithError(err).Errorf("error when create unpublish event record, roomid %v", roomid)
	}
}

func RecordCutOffEvent(roomid uint, operator uint) {
	detail, _ := json.Marshal(struct {
		Operator uint `json:"operator"`
	}{operator})
	err := models.RecordEventWithDetail(models.LogTypeCutOff, roomid, string(detail))
	if err != nil {
		logrus.WithError(err).Errorf("error when create cutoff record, room %v, operator %v", roomid, operator)
	}
}

func CountLogs(allowedTypes []models.LogType, before *time.Time, after *time.Time) (int64, cerrors.ChocolateError) {
	if before != nil && after != nil && before.Before(*after) {
		return 0, cerrors.RequestError{
			ID:      cerrors.RequestLogRetrivalInvalidTimeRange,
			Message: "invalid time range",
		}
	}

	if len(allowedTypes) == 0 {
		allowedTypes = []models.LogType{
			models.LogTypePublish,
			models.LogTypeUnpublish,
		}
	}
	return models.CountLogs(allowedTypes, before, after)
}

func RetriveLogs(allowedTypes []models.LogType, limit int, before *time.Time, after *time.Time) ([]*models.Log, cerrors.ChocolateError) {
	if before != nil && after != nil && before.Before(*after) {
		return nil, cerrors.RequestError{
			ID:      cerrors.RequestLogRetrivalInvalidTimeRange,
			Message: "invalid time range",
		}
	}

	if len(allowedTypes) == 0 {
		allowedTypes = []models.LogType{
			models.LogTypePublish,
			models.LogTypeUnpublish,
		}
	}
	if limit == 0 {
		limit = 20
	} else if limit > 100 {
		return nil, cerrors.RequestError{
			ID: cerrors.RequestLogRetrivalLimitTooBig,
		}
	}

	return models.RetriveLogs(allowedTypes, limit, before, after)
}
