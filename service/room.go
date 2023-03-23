package service

import (
	"strconv"

	"github.com/sheey11/chocolate/chat"
	cerrors "github.com/sheey11/chocolate/errors"
	"github.com/sheey11/chocolate/models"
)

func CheckRoomStreamPermission(roomId uint, params string) bool {
	room, _ := GetRoomByID(roomId)
	if room == nil {
		return false
	}
	key := room.GetStreamKey()
	return params == key
}

func GetRoomByUID(uid string) (*models.Room, cerrors.ChocolateError) {
	if len(uid) != 32 {
		return nil, cerrors.RequestError{
			ID:      cerrors.RequestInvalidRoomUID,
			Message: "invalid room uid",
		}
	}
	return models.GetRoomByUID(uid)
}

func GetRoomByID(id uint) (*models.Room, cerrors.ChocolateError) {
	return models.GetRoomByID(id, []string{"permission_items"})
}

func GetRoomByIDWithDetail(id uint) (*models.Room, cerrors.ChocolateError) {
	return models.GetRoomByID(id, []string{"owner", "permission_items"})
}

// this method also generates push key before setting
// status
func SetRoomStartStreaming(id uint) cerrors.ChocolateError {
	err := models.GenerateRoomPushKeyForRoom(id)
	if err != nil {
		return err
	}
	return models.SetRoomStatus(id, models.RoomStatusStreaming)
}

func SetRoomStopStreaming(id uint) cerrors.ChocolateError {
	return models.SetRoomStatus(id, models.RoomStatusIdle)
}

func ChangeRoomPermission(id uint, permission models.RoomPermissionType, clearPermission bool) cerrors.ChocolateError {
	if permission != models.RoomPermissionBlacklist && permission != models.RoomPermissionWhitelist {
		return cerrors.RequestError{
			ID:      cerrors.RequestUnknownRoomPermissionType,
			Message: "unknown permission type",
		}
	}

	room, err := GetRoomByID(uint(id))
	if err != nil {
		return err
	}
	return models.ChangeRoomPermissionType(room, permission, clearPermission)
}

func AddRoomPermissionItem_Label(id uint, label string) cerrors.ChocolateError {
	return models.AddRoomPermissionItem_Label(id, label)
}

func AddRoomPermissionItem_User(id uint, uid uint) cerrors.ChocolateError {
	u := models.GetUserByID(uid)
	if u == nil {
		return cerrors.RequestError{
			ID:      cerrors.RequestUserNotFound,
			Message: "user not found",
		}
	}
	return models.AddRoomPermissionItem_User(id, uid)
}

func DeleteRoomPermissionItem_Label(id uint, label string) cerrors.ChocolateError {
	return models.DeleteRoomPermissionItem_Label(id, label)
}

func DeleteRoomPermissionItem_User(id uint, uid uint) cerrors.ChocolateError {
	return models.DeleteRoomPermissionItem_User(id, uid)
}

func CreateRoomForUser(user *models.User, title string) (*models.Room, cerrors.ChocolateError) {
	if user == nil {
		return nil, cerrors.LogicError{
			ID:         cerrors.LogicNilReference,
			Message:    "you have passed a nil user argument to service.CreateRoomForUser, check log and your code",
			StackTrace: cerrors.GetStackTrace(),
		}
	}

	if len(title) > 32 {
		return nil, cerrors.RequestError{
			ID:      cerrors.RequestRoomTitleTooLong,
			Message: "title is too long",
		}
	}

	count, err := user.GetAfflicateRoomCount()
	if err != nil {
		return nil, err
	} else if count >= user.MaxRoomCount {
		return nil, cerrors.RequestError{
			ID:      cerrors.RequestRoomCountReachedMax,
			Message: "you have created max room allowed",
		}
	}

	return models.CreateRoomForUser(user, title)
}

// includes owner
func ListRooms(status *models.RoomStatus, search string) ([]*models.Room, cerrors.ChocolateError) {
	var filterId *uint = nil
	var filterTitle *string = nil
	if search != "" {
		filterTitle = &search
		id, err := strconv.Atoi(search)
		if err == nil && id > 0 {
			uId := uint(id)
			filterId = &uId
		}
	}

	return models.ListRooms(status, filterId, filterTitle)
}

func CutOffStream(room *models.Room, operator uint) cerrors.ChocolateError {
	chat.SendMessage(&models.ChatMessage{
		Room:   *room,
		RoomID: room.ID,
		Type:   models.ChetMessageTypeAdministrationCutOff,
	})

	RecordCutOffEvent(room.ID, operator)
	return models.SetRoomStatus(room.ID, models.RoomStatusIdle)
}

func DeleteRoom(roomid uint) cerrors.ChocolateError {
	return models.DeleteRoom(roomid)
}

func RetriveRoomTimeline(roomid uint) ([]*models.Log, cerrors.ChocolateError) {
	return models.RetriveLogsForRoom(roomid)
}
