package models

import (
	"errors"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"github.com/google/uuid"
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

func (s RoomStatus) ToString() string {
	switch s {
	case RoomStatusIdle:
		return "idle"
	case RoomStatusStreaming:
		return "streaming"
	default:
		return "unknwon"
	}
}

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
	OwnerID         uint `gorm:"not null"`
	Viewers         uint
	PermissionType  RoomPermissionType `gorm:"default:blacklist"`
	PermissionItems []PermissionItem   `gorm:"constraint:OnDelete:CASCADE"`
	LastStreamingAt time.Time
	SrsClientID     *string `gorm:"default:null"`
	SrsStreamID     *string `gorm:"default:null"`
}

func (r Room) GetPlaybackInfo() map[string]interface{} {
	return map[string]interface{}{
		"hls": fmt.Sprintf("/room/%d/playback.m3u8", r.ID),
		"flv": fmt.Sprintf("/room/%d/playback.flv", r.ID),
	}
}

func GenerateRoomUID() string {
	uuid := uuid.NewString()
	str := strings.ReplaceAll(uuid, "-", "")
	return strings.ToLower(str)
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

func GenerateRoomPushKeyForRoom(id uint) cerrors.ChocolateError {
	key := generateRoomPushKey()
	c := db.Model(&Room{}).Where("id = ?", id).Update("push_key", key)
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

func GetRoomByUID(uid string) (*Room, cerrors.ChocolateError) {
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

func GetRoomByID(id uint, preloads []string) (*Room, cerrors.ChocolateError) {
	room := Room{}

	statement := db
	if len(preloads) > 0 {
		for _, preload := range preloads {
			statement = statement.Preload(preload)
		}
	}

	c := statement.First(&room, "id = ?", id)
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

func ChangeRoomPermissionType(room *Room, permission RoomPermissionType, clearPermission bool) cerrors.ChocolateError {
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

func AddRoomPermissionItem_Label(id uint, label string) cerrors.ChocolateError {
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
	} else if count != 0 {
		return cerrors.RequestError{
			ID:      cerrors.RequestPermissionItemAlreadyExistError,
			Message: "permission item already exists",
		}
	}

	count = 0
	c = db.
		Model(&Label{}).
		Where("name = ?", label).
		Count(&count)
	if count == 0 {
		c := db.Create(&Label{Name: label})
		if c.Error != nil {
			return cerrors.DatabaseError{
				ID:         cerrors.DatabaseCreateLabelError,
				Message:    "error creating label when creates room permission",
				Sql:        c.Statement.SQL.String(),
				InnerError: c.Error,
				StackTrace: cerrors.GetStackTrace(),
				Context: map[string]interface{}{
					"room_id": id,
					"label":   label,
				},
			}
		}
	}

	item := PermissionItem{
		RoomID:           id,
		SubjectType:      PermissionSubjectTypeLabel,
		SubjectLabelName: &label,
	}
	if c := db.Save(&item); c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseCreatePermissionItemError,
			Message:    "error on creating room permissions",
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

func AddRoomPermissionItem_User(id uint, uid uint) cerrors.ChocolateError {
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
		SubjectUserID: &uid,
	}
	if tx := db.Save(&item); tx.Error != nil {
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

func DeleteRoomPermissionItem_Label(id uint, label string) cerrors.ChocolateError {
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
	c = db.Delete(&PermissionItem{}, "room_id = ? and subject_label_name = ?", id, label)
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

func DeleteRoomPermissionItem_User(id uint, uid uint) cerrors.ChocolateError {
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

	c = db.Delete(&PermissionItem{}, "room_id = ? and subject_user_id = ?", id, uid)
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

func SetRoomStatus(id uint, status RoomStatus) cerrors.ChocolateError {
	var c *gorm.DB
	if status == RoomStatusStreaming {
		c = db.Model(&Room{}).Where("id = ?", id).Updates(map[string]interface{}{
			"status":            status,
			"last_streaming_at": time.Now(),
		})
	} else {
		c = db.Model(&Room{}).Where("id = ?", id).Update("status", status)
	}
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

func CreateRoomForUser(user *User, title string) (*Room, cerrors.ChocolateError) {
	room := Room{
		Title:           title,
		Status:          RoomStatusIdle,
		UID:             GenerateRoomUID(),
		PushKey:         generateRoomPushKey(),
		Owner:           *user,
		OwnerID:         user.ID,
		LastStreamingAt: time.Now(),
	}

	c := db.Create(&room)
	if c.Error != nil {
		return nil, cerrors.DatabaseError{
			ID:         cerrors.DatabaseCreateRoomError,
			Message:    "error on creating room",
			InnerError: c.Error,
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
		}
	}
	return &room, nil
}

func IncreaseRoomViewer(id uint) cerrors.ChocolateError {
	c := db.Model(&Room{}).Where("id = ?", id).Update("viewers", gorm.Expr("viewers + ?", 1))
	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseIncreaseRoomViewersError,
			Message:    "error update room viewer",
			InnerError: c.Error,
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"room_id": id,
			},
		}
	}
	return nil
}

func DecreaseRoomViewer(id uint) cerrors.ChocolateError {
	c := db.Model(&Room{}).Where("id = ?", id).Update("viewers", gorm.Expr("GREATEST(viewers - ?, ?)", 1, 0))
	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseDecreaseRoomViewersError,
			Message:    "error decrease room viewer",
			InnerError: c.Error,
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"room_id": id,
			},
		}
	}
	return nil
}

// includes owner
func ListRooms(owner *User, status *RoomStatus, filterId *uint, filterTitle *string, limit uint, page uint) (uint, []*Room, cerrors.ChocolateError) {
	statement := db.Model(&Room{}).Preload("Owner")
	if owner != nil {
		statement = statement.Where("owner_id = ?", owner.ID)
	}
	if status != nil {
		statement = statement.Where("status = ?", *status)
	}
	if filterTitle != nil {
		statement = statement.Where("title like ?", fmt.Sprintf("%%%s%%", *filterTitle))
	}
	if filterId != nil {
		statement = db.Raw(
			"? UNION ?",
			db.Model(&Room{}).Preload("Owner").Where("id = ? OR owner_id = ?", *filterId, *filterId),
			statement,
		)
	}

	var count int64
	c := db.Table("(?) as foo", statement).Select("COUNT(*)").Scan(&count)
	if c.Error != nil {
		return 0, nil, cerrors.DatabaseError{
			ID:         cerrors.DatabaseListRoomsError,
			Message:    "error on counting qualified rooms",
			InnerError: c.Error,
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"status_filter": status,
				"id_filter":     filterId,
				"title_filter":  filterTitle,
			},
		}
	}

	var result []*Room
	c = statement.Limit(int(limit)).Offset(int((page - 1) * limit)).Find(&result)
	if c.Error != nil {
		return 0, nil, cerrors.DatabaseError{
			ID:         cerrors.DatabaseClearRoomPermissionItemError,
			Message:    "error on listing rooms",
			InnerError: c.Error,
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"status_filter": status,
				"id_filter":     filterId,
				"title_filter":  filterTitle,
			},
		}
	}
	return uint(count), result, nil
}

func DeleteRoom(roomid uint) cerrors.ChocolateError {
	c := db.Delete(&Room{}, roomid)
	if c.Error != nil {
		if errors.Is(c.Error, gorm.ErrRecordNotFound) {
			return cerrors.RequestError{
				ID:      cerrors.RequestRoomNotFound,
				Message: "the room requested is not found",
			}
		} else {
			return cerrors.DatabaseError{
				ID:         cerrors.DatabaseDeleteRoomError,
				Message:    "error deleting room",
				InnerError: c.Error,
				Sql:        c.Statement.SQL.String(),
				StackTrace: cerrors.GetStackTrace(),
				Context: map[string]interface{}{
					"room_id": roomid,
				},
			}
		}
	} else if c.RowsAffected == 0 {
		return cerrors.RequestError{
			ID:      cerrors.RequestRoomNotFound,
			Message: "the room requested is not found",
		}
	}
	return nil
}

func ModifyRoomTitle(roomid uint, title string) cerrors.ChocolateError {
	c := db.Model(&Room{}).Where("id = ?", roomid).Update("title", title)
	if c.Error != nil {
		if errors.Is(c.Error, gorm.ErrRecordNotFound) {
			return cerrors.RequestError{
				ID:      cerrors.RequestRoomNotFound,
				Message: "the room requested is not found",
			}
		} else {
			return cerrors.DatabaseError{
				ID:         cerrors.DatabaseUpdateRoomTitleError,
				Message:    "error updating room title",
				InnerError: c.Error,
				Sql:        c.Statement.SQL.String(),
				StackTrace: cerrors.GetStackTrace(),
				Context: map[string]interface{}{
					"room_id": roomid,
				},
			}
		}
	} else if c.RowsAffected == 0 {
		return cerrors.RequestError{
			ID:      cerrors.RequestRoomNotFound,
			Message: "the room requested is not found",
		}
	}
	return nil
}

func GetRoomCount() uint {
	var count int64
	db.Model(&Room{}).Count(&count)
	return uint(count)
}

func GetStreamingRoomCount() uint {
	var count int64
	db.Model(&Room{}).Where("status = ?", RoomStatusStreaming).Count(&count)
	return uint(count)
}

func RecordRoomClientID(roomId uint, client string) cerrors.ChocolateError {
	c := db.Model(&Room{}).Where("id = ?", roomId).Update("SrsClientID", client)
	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseUpdateRoomSrsClientIDError,
			Message:    "error when updating room.SrsClientID field",
			StackTrace: cerrors.GetStackTrace(),
			Sql:        c.Statement.SQL.String(),
			InnerError: c.Error,
			Context: map[string]interface{}{
				"id":        roomId,
				"client_id": client,
			},
		}
	} else if c.RowsAffected == 0 {
		return cerrors.RequestError{
			ID:      cerrors.RequestRoomNotFound,
			Message: "requested room not found",
			Context: map[string]interface{}{
				"ID": roomId,
			},
		}
	}
	return nil
}

func RecordRoomStreamID(roomId uint, stream string) cerrors.ChocolateError {
	c := db.Model(&Room{}).Where("id = ?", roomId).Update("SrsStreamID", stream)
	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseUpdateRoomSrsStreamIDError,
			Message:    "error when updating room.SrsStreamID field",
			StackTrace: cerrors.GetStackTrace(),
			Sql:        c.Statement.SQL.String(),
			InnerError: c.Error,
			Context: map[string]interface{}{
				"id":        roomId,
				"stream_id": stream,
			},
		}
	} else if c.RowsAffected == 0 {
		return cerrors.RequestError{
			ID:      cerrors.RequestRoomNotFound,
			Message: "requested room not found",
			Context: map[string]interface{}{
				"ID": roomId,
			},
		}
	}
	return nil
}

func ClearRoomStreamAndClientID(roomId uint) cerrors.ChocolateError {
	c := db.Model(&Room{}).Where("id = ?", roomId).Updates(map[string]interface{}{
		"SrsStreamID": nil,
		"SrsClientID": nil,
	})
	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseClearRoomSrsRelatedIDError,
			Message:    "error when setting room.SrsStreamID and ClientID field to null",
			StackTrace: cerrors.GetStackTrace(),
			Sql:        c.Statement.SQL.String(),
			InnerError: c.Error,
			Context: map[string]interface{}{
				"id": roomId,
			},
		}
	} else if c.RowsAffected == 0 {
		return cerrors.RequestError{
			ID:      cerrors.RequestRoomNotFound,
			Message: "requested room not found",
			Context: map[string]interface{}{
				"ID": roomId,
			},
		}
	}
	return nil
}
