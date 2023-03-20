package models

import (
	"errors"
	"fmt"
	"math/rand"

	cerrors "github.com/sheey11/chocolate/errors"

	"gorm.io/gorm"
)

type RoomPermissionType string

const (
	RoomPermissionBlacklist RoomPermissionType = "blacklist"
	// No, whitelist may not be possible.
	// Only users in the list can watch the stream,
	// meaning it requires all connection to the server
	// fetching that media stream to be authenticated
	// and authorized, which would be a heavy burden of
	// the database. Use redis may solve this problem.
	// But I haven't tested it yet.
	//
	// Currently, it only checks the user who sends
	// chat message.
	RoomPermissionWhitelist RoomPermissionType = "whitelist"
)

type RoomStatus uint8

const (
	RoomStatusIdle RoomStatus = iota
	RoomStatusStreaming
)

type Room struct {
	gorm.Model
	Title  string `gorm:"type:varchar(32)"`
	Status RoomStatus
	// UID is a unique id for each room, it is used
	// to authenticate when push stream to server,
	// it is private to admins & room owner.
	UID             string `gorm:"type:varchar(32);not null;uniqueIndex"`
	PushKey         string `gorm:"type:varchar(64)"`
	Owner           User
	OwnerID         uint               `gorm:"not null"`
	PermissionType  RoomPermissionType `gorm:"default:blacklist"`
	PermissionItems []PermissionItem   `gorm:"constraint:OnDelete:CASCADE"`
}

func generateRoomPushKey() string {
	dict := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890123456789012345678901234567890123456789"
	key := ""
	for i := 0; i < 64; i++ {
		randIndex := rand.Intn(len(dict))
		key += string(dict[randIndex])
	}
	return key
}

func GenerateRoomPushKeyForRoom(id uint) error {
	key := generateRoomPushKey()
	c := db.Model(&Room{}).Update("push_key", key)
	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseUpdareRoomPushKeyError,
			Message:    "error while updating database push key",
			InnerError: c.Error,
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"room_id":  id,
				"push_key": key,
			},
		}
	}
	return nil
}

// this method do no generate new key
func (r *Room) GetStreamKey() string {
	return fmt.Sprintf("%d?uid=%s&key=%s", r.ID, r.UID, r.PushKey)
}

func GetRoomByUID(uid string) (*Room, error) {
	room := Room{}
	c := db.First(&room, "UID = ?", uid)
	if c.Error != nil {
		if errors.Is(c.Error, gorm.ErrRecordNotFound) {
			return nil, cerrors.RequestError{
				ID:      cerrors.RequestRoomNotFound,
				Message: "room not found",
			}
		} else {
			return nil, cerrors.DatabaseError{
				ID:         cerrors.DatabaseLookupRoomError,
				Message:    "error while lookup room by uid",
				InnerError: c.Error,
				Sql:        c.Statement.SQL.String(),
				StackTrace: cerrors.GetStackTrace(),
			}
		}
	}

	return &room, nil
}

func GetRoomByID(id uint) (*Room, error) {
	room := Room{}
	c := db.First(&room, "id = ?", id)
	if c.Error != nil {
		if errors.Is(c.Error, gorm.ErrRecordNotFound) {
			return nil, cerrors.RequestError{
				ID:      cerrors.RequestRoomNotFound,
				Message: "room not found",
			}
		} else {
			return nil, cerrors.DatabaseError{
				ID:         cerrors.DatabaseLookupRoomError,
				Message:    "error while lookup room by id",
				InnerError: c.Error,
				Sql:        c.Statement.SQL.String(),
				StackTrace: cerrors.GetStackTrace(),
			}
		}
	}

	return &room, nil
}

func ChangeRoomPermissionType(room *Room, permission RoomPermissionType, clearPermission bool) error {
	tx := db.Begin()
	defer tx.Rollback()

	room.PermissionType = permission
	c := tx.Save(room)
	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseUpdateRoomPermissionTypeError,
			Message:    "error while saving room permission type",
			InnerError: c.Error,
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
		}
	}

	if clearPermission {
		c := tx.Model(&PermissionItem{}).Delete("room_id", room.ID)
		if c.Error != nil {
			return cerrors.DatabaseError{
				ID:         cerrors.DatabaseClearRoomPermissionItemError,
				Message:    "error while clearing permission item",
				InnerError: c.Error,
				Sql:        c.Statement.SQL.String(),
				StackTrace: cerrors.GetStackTrace(),
			}
		}
	}

	tx.Commit()
	return nil
}

func AddRoomPermissionItem_Label(id uint, label string) error {
	var count int64
	tx := db.
		Model(&PermissionItem{}).
		Where("room_id = ? AND subject_label_name = ?", id, label).
		Count(&count)
	if tx.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseCountPermissionItemError,
			Message:    "error on counting existing room permissions",
			Sql:        tx.Statement.SQL.String(),
			InnerError: tx.Error,
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"room_id": id,
				"label":   label,
			},
		}
	} else if count != 0 {
		return cerrors.RequestError{
			ID:      cerrors.RequestPermissionItemAlreadyExistError,
			Message: "permission item already exists",
		}
	}
	item := PermissionItem{
		RoomID:           id,
		SubjectType:      PermissionSubjectTypeLabel,
		SubjectLabelName: label,
	}
	if tx := db.Save(item); tx.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseCreatePermissionItemError,
			Message:    "error on creating room permissions",
			Sql:        tx.Statement.SQL.String(),
			InnerError: tx.Error,
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"room_id": id,
				"label":   label,
			},
		}
	}
	return nil
}

func AddRoomPermissionItem_User(id uint, uid uint) error {
	var count int64
	tx := db.
		Model(&PermissionItem{}).
		Where("room_id = ? AND subject_user_id = ?", id, uid).
		Count(&count)
	if tx.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseCountPermissionItemError,
			Message:    "error on counting existing room permissions",
			Sql:        tx.Statement.SQL.String(),
			InnerError: tx.Error,
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"room_id": id,
				"user_id": uid,
			},
		}
	} else if count != 0 {
		return cerrors.RequestError{
			ID:      cerrors.RequestPermissionItemAlreadyExistError,
			Message: "permission item already exists",
		}
	}
	item := PermissionItem{
		RoomID:        id,
		SubjectType:   PermissionSubjectTypeUser,
		SubjectUserID: uid,
	}
	if tx := db.Save(item); tx.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseCreatePermissionItemError,
			Message:    "error on creating room permissions",
			Sql:        tx.Statement.SQL.String(),
			InnerError: tx.Error,
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"room_id": id,
				"user_id": uid,
			},
		}
	}
	return nil
}

func DeleteRoomPermissionItem_Label(id uint, label string) error {
	var count int64
	c := db.
		Model(&PermissionItem{}).
		Where("room_id = ? AND subject_label_name = ?", id, label).
		Count(&count)
	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseCountPermissionItemError,
			Message:    "error on counting existing room permissions",
			Sql:        c.Statement.SQL.String(),
			InnerError: c.Error,
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"room_id": id,
				"label":   label,
			},
		}
	} else if count != 1 {
		return cerrors.RequestError{
			ID:      cerrors.RequestPermissionItemNotExistError,
			Message: "permission item not exists",
		}
	}
	c = db.Model(&PermissionItem{}).Delete("room_id = ? and subject_label_name = ?", id, label)
	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseCreatePermissionItemError,
			Message:    "error on deleting room permissions",
			Sql:        c.Statement.SQL.String(),
			InnerError: c.Error,
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"room_id": id,
				"label":   label,
			},
		}
	}
	return nil
}

func DeleteRoomPermissionItem_User(id uint, uid uint) error {
	var count int64
	c := db.
		Model(&PermissionItem{}).
		Where("room_id = ? AND subject_user_id = ?", id, uid).
		Count(&count)
	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseCountPermissionItemError,
			Message:    "error on counting existing room permissions",
			Sql:        c.Statement.SQL.String(),
			InnerError: c.Error,
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"room_id": id,
				"user_id": uid,
			},
		}
	} else if count != 1 {
		return cerrors.RequestError{
			ID:      cerrors.RequestPermissionItemNotExistError,
			Message: "permission item not exists",
		}
	}

	c = db.Model(&PermissionItem{}).Delete("room_id = ? and subject_user_id = ?", id, uid)
	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseCreatePermissionItemError,
			Message:    "error on deleting room permissions",
			Sql:        c.Statement.SQL.String(),
			InnerError: c.Error,
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"room_id": id,
				"user_id": uid,
			},
		}
	}
	return nil
}

func SetRoomStatus(id uint, status RoomStatus) error {
	c := db.Model(&Room{}).Update("status", status)
	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseUpdateRoomStatusError,
			Message:    "error on update room status",
			Sql:        c.Statement.SQL.String(),
			InnerError: c.Error,
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"room_id": id,
				"status":  status,
			},
		}
	}
	return nil
}
