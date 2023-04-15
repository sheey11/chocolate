package service

import (
	"time"

	cerrors "github.com/sheey11/chocolate/errors"
	"github.com/sheey11/chocolate/models"
	"github.com/sirupsen/logrus"
)

func RecordPlayEvent(userid uint, roomid uint, clientid string, session string) {
	err := models.RecordEvent(userid, roomid, clientid, session)
	if err != nil {
		logrus.WithError(err).Error("error recording play event")
	}
}

func RecordStopPlayEvent(userid uint, roomid uint, session string) {
	err := models.UpdateEventEndTime(userid, roomid, session)
	if err != nil {
		logrus.WithError(err).Error("error recording stop event")
	}
}

func GetUserWatchingHistory(uid uint, startTime time.Time, endTime time.Time) ([]*models.RoomWatchingReport, cerrors.ChocolateError) {
	return models.GetUserWatchingHistory(uid, startTime, endTime)
}

func GetRoomAudience(rid uint, startTime time.Time, endTime time.Time) ([]*models.RoomAudienceReport, cerrors.ChocolateError) {
	return models.GetRoomAudienceHistory(rid, startTime, endTime)
}
