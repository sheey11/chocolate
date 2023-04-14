package service

import (
	"time"

	cerrors "github.com/sheey11/chocolate/errors"
	"github.com/sheey11/chocolate/models"
)

func RecordPlayEvent(userid uint, roomid uint, clientid string) cerrors.ChocolateError {
	return models.RecordEvent(models.EventTypePlay, userid, roomid, clientid)
}

func RecordStopPlayEvent(userid uint, roomid uint, clientid string) cerrors.ChocolateError {
	return models.RecordEvent(models.EventTypeStopPlay, userid, roomid, clientid)
}

func GetUserWatchingHistory(uid uint, startTime time.Time, endTime time.Time) ([]*models.RoomWatchingHistory, cerrors.ChocolateError) {
	return models.GetUserWatchingHistory(uid, startTime, endTime)
}

func GetRoomAudience(rid uint, startTime time.Time, endTime time.Time) ([]models.AudienceReport, cerrors.ChocolateError) {
	return models.GetRoomAudience(rid, startTime, endTime)
}
