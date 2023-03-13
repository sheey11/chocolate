package service

import (
	"strings"

	"github.com/google/uuid"
	"github.com/sheey11/chocolate/errors"
	"github.com/sheey11/chocolate/models"
)

func CheckRoomStreamPermission(roomUid string, pushkey string) bool {
	key, status := models.GetRoomPushKeyAndStatus(roomUid)
	return status == models.RoomStatusStreaming && key == pushkey
}

func GenerateRoomUID() string {
	uuid := uuid.NewString()
	str := strings.ReplaceAll(uuid, "-", "")
	return strings.ToLower(str)
}

func GetRoomByUID(uid string) (*models.Room, error) {
	if len(uid) != 32 {
		return nil, errors.RequestError{
			ID:      errors.RequestInvalidRoomUID,
			Message: "invalid room uid",
		}
	}
	return models.GetRoomByUID(uid)
}
