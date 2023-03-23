package chat

import (
	cerrors "github.com/sheey11/chocolate/errors"
	"github.com/sheey11/chocolate/models"
	"github.com/sirupsen/logrus"
)

var hubs = map[uint]*Hub{}

func getHubOrCreate(room *models.Room) *Hub {
	if room == nil {
		err := cerrors.LogicError{
			ID:         cerrors.LogicNilReference,
			Message:    "nil reference at hub.getHubOrCreate",
			StackTrace: cerrors.GetStackTrace(),
		}
		logrus.WithError(err).Error("you have passed a nil room argument to hub.getHubOrCreate, check your code")
		return nil
	}

	hub, ok := hubs[room.ID]
	if !ok {
		hub = newHub(room)
		hubs[room.ID] = hub
	}
	return hub
}

func Subscribe(room *models.Room, uid int64, ch chan<- *models.ChatMessage) {
	hub := getHubOrCreate(room)
	if hub != nil {
		hub.subscribe(uid, ch)
	}
}

func Unsubscribe(room *models.Room, uid int64) {
	hub := getHubOrCreate(room)
	if hub != nil {
		hub.unsubscribe(uid)
	}
}

func SendMessage(msg *models.ChatMessage) {
	hub := getHubOrCreate(&msg.Room)
	if hub != nil {
		hub.sendMessage(msg)
	}
}
