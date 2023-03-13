package service

import (
	"github.com/sheey11/chocolate/models"
	"github.com/sirupsen/logrus"
)

func RecordPublishEvent(roomUid string) {
	err := models.RecordEvent(models.LogTypePublish, roomUid)
	if err != nil {
		logrus.WithError(err).Errorf("error when create publish event record, roomUid %v", roomUid)
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
