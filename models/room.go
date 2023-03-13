package models

import (
	"errors"
	"fmt"
	"math/rand"

	cerrors "github.com/sheey11/chocolate/errors"

	"gorm.io/gorm"
)

type RoomPermissionType uint8

const (
	RoomPermissionBlacklist RoomPermissionType = iota
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
	RoomPermissionWhitelist
)

type RoomStatus uint8

const (
	RoomStatusIdle RoomStatus = iota
	RoomStatusStreaming
)

type Room struct {
	gorm.Model
	Title           string `gorm:"type:varchar(32)"`
	Status          RoomStatus
	UID             string `gorm:"type:varchar(32);not null;uniqueIndex"`
	PushKey         string `gorm:"type:varchar(64)"`
	Owner           User
	OwnerID         uint `gorm:"not null"`
	PermissionType  RoomPermissionType
	PermissionItems []PermissionItem `gorm:"foreignKey:ID"`
}

func GenerateRoomPushKey() string {
	dict := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890123456789012345678901234567890123456789"
	key := ""
	for i := 0; i < 64; i++ {
		randIndex := rand.Intn(len(dict))
		key += string(dict[randIndex])
	}
	return key
}

func (r *Room) GetStreamKey() string {
	return fmt.Sprintf("%s?roomid=%")
}

func GetRoomPushKeyAndStatus(roomUid string) (string, RoomStatus) {
	room := Room{}
	tx := db.First(&room, "UID = ?", roomUid)
	if tx != nil {
		// return this instead of an empty string
		// helps application robust.
		return "invalid-room-id-and-this-will-never-match-an-push-key", RoomStatusIdle
	}
	if room.PushKey == "" {
		return "room-push-key-has-not-been-generated", RoomStatusIdle
	}
	return room.PushKey, room.Status
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
				ID:         cerrors.DatabaseLookupRoomByUIDError,
				Message:    "error while lookup room by uid",
				InnerError: c.Error,
				Sql:        c.Statement.SQL.String(),
				StackTrace: cerrors.GetStackTrace(),
			}
		}
	}

	return &room, nil
}
