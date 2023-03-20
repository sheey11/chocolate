package service

import (
	"strings"

	"github.com/google/uuid"
	"github.com/sheey11/chocolate/errors"
	"github.com/sheey11/chocolate/models"
)

func CheckRoomStreamPermission(roomId uint, params string) bool {
	room, _ := models.GetRoomByID(roomId)
	if room == nil {
		return false
	}
	key := room.GetStreamKey()
	return params == key
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

func GetRoomByID(id uint) (*models.Room, error) {
	return models.GetRoomByID(id)
}

// this method also generates push key before setting
// status
func SetRoomStartStreaming(id uint) error {
	err := models.GenerateRoomPushKeyForRoom(id)
	if err != nil {
		return err
	}
	return models.SetRoomStatus(id, models.RoomStatusStreaming)
}

func SetRoomStopStreaming(id uint) error {
	return models.SetRoomStatus(id, models.RoomStatusIdle)
}

func ChangeRoomPermission(id uint, permission models.RoomPermissionType, clearPermission bool) error {
	if permission != models.RoomPermissionBlacklist && permission != models.RoomPermissionWhitelist {
		return errors.RequestError{
			ID:      errors.RequestUnknownRoomPermissionType,
			Message: "unknown permission type",
		}
	}

	room, err := GetRoomByID(uint(id))
	if err != nil {
		return err
	}
	return models.ChangeRoomPermissionType(room, permission, clearPermission)
}

func AddRoomPermissionItem_Label(id uint, label string) error {
	return models.AddRoomPermissionItem_Label(id, label)
}

func AddRoomPermissionItem_User(id uint, uid uint) error {
	u := models.GetUserByID(uid)
	if u == nil {
		return errors.RequestError{
			ID:      errors.RequestUserNotFound,
			Message: "user not found",
		}
	}
	return models.AddRoomPermissionItem_User(id, uid)
}

func DeleteRoomPermissionItem_Label(id uint, label string) error {
	return models.DeleteRoomPermissionItem_Label(id, label)
}

func DeleteRoomPermissionItem_User(id uint, uid uint) error {
	return models.DeleteRoomPermissionItem_User(id, uid)
}
