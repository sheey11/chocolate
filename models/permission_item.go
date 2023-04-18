package models

import (
	"fmt"

	"github.com/samber/lo"
	cerrors "github.com/sheey11/chocolate/errors"
	"github.com/sirupsen/logrus"
)

type PermissionSubjectType string

const (
	PermissionSubjectTypeLabel PermissionSubjectType = "label"
	PermissionSubjectTypeUser  PermissionSubjectType = "user"
)

type PermissionItem struct {
	ID               uint                  `gorm:"primaryKey;uniqueIndex:idx_label;uniqueIndex:idx_user" json:"-"`
	RoomID           uint                  `gorm:"index;not null" json:"room_id"`
	SubjectType      PermissionSubjectType `gorm:"not null" json:"type"`
	SubjectLabel     *Label                `json:"-"`
	SubjectLabelName *string               `gorm:"uniqueIndex:idx_label" json:"label"`
	SubjectUser      *User                 `json:"-"`
	SubjectUserID    *uint                 `gorm:"uniqueIndex:idx_user" json:"user_id"`
}

func IsUserAllowedForRoom(room *Room, user *User) bool {
	switch room.PermissionType {
	case RoomPermissionWhitelist:
		if user == nil {
			return false
		}
		var count int64

		// checking users
		c := db.
			Model(&PermissionItem{}).
			Where("room_id = ? AND subject_type = ? AND subject_user_id = ?", room.ID, PermissionSubjectTypeUser, user.ID).
			Count(&count)
		if c.Error != nil {
			err := cerrors.DatabaseError{
				ID:         cerrors.DatabaseCreateNewSessionError,
				Message:    "error when looking up for permission_item",
				Sql:        c.Statement.SQL.String(),
				InnerError: c.Error,
				StackTrace: cerrors.GetStackTrace(),
				Context: map[string]interface{}{
					"room_permission_type": room.PermissionType,
					"room_id":              room,
					"user_id":              lo.If(user == nil, 0).ElseF(func() int { return int(user.ID) }),
				},
			}
			logrus.WithError(err).Error("error when check user watching room permission")
		}
		if count != 0 {
			return true
		}

		// checking labels
		if user.Labels == nil {
			c := db.Preload("Labels").First(user, "id = ?", user.ID)
			if c.Error != nil {
				logrus.WithError(c.Error).WithField("stack_trace", cerrors.GetStackTrace()).Error("error when quering user labels")
			}
		}

		c = db.
			Model(&PermissionItem{}).
			Where(
				"room_id = ? AND subject_type = ? AND subject_label_name IN ?",
				room.ID,
				PermissionSubjectTypeLabel,
				lo.Map(user.Labels, func(l Label, _ int) string { return l.Name }),
			).
			Count(&count)
		if c.Error != nil {
			err := cerrors.DatabaseError{
				ID:         cerrors.DatabaseCreateNewSessionError,
				Message:    "error when looking up for permission_item",
				Sql:        c.Statement.SQL.String(),
				InnerError: c.Error,
				StackTrace: cerrors.GetStackTrace(),
				Context: map[string]interface{}{
					"room_permission_type": room.PermissionType,
					"room_id":              room,
					"user_id":              lo.If(user == nil, 0).ElseF(func() int { return int(user.ID) }),
				},
			}
			logrus.WithError(err).Error("error when check user watching room permission")
		}
		return count >= 1
	case RoomPermissionBlacklist:
		if user == nil {
			return true
		}
		var count int64

		// checking users
		c := db.
			Model(&PermissionItem{}).
			Where("room_id = ? AND subject_type = ? AND subject_user_id = ?", room.ID, PermissionSubjectTypeUser, user.ID).
			Count(&count)
		if c.Error != nil {
			err := cerrors.DatabaseError{
				ID:         cerrors.DatabaseCreateNewSessionError,
				Message:    "error when looking up for permission_item",
				Sql:        c.Statement.SQL.String(),
				InnerError: c.Error,
				StackTrace: cerrors.GetStackTrace(),
				Context: map[string]interface{}{
					"room_permission_type": room.PermissionType,
					"room_id":              room,
					"user_id":              lo.If(user == nil, 0).ElseF(func() int { return int(user.ID) }),
				},
			}
			logrus.WithError(err).Error("error when check user watching room permission")
		}
		if count != 0 {
			return false
		}

		// checking labels
		if user.Labels == nil {
			c := db.Preload("Labels").First(user, "id = ?", user.ID)
			if c.Error != nil {
				logrus.WithError(c.Error).WithField("stack_trace", cerrors.GetStackTrace()).Error("error when quering user labels")
			}
		}

		c = db.
			Model(&PermissionItem{}).
			Where(
				"room_id = ? AND subject_type = ? AND subject_label_name IN ?",
				room.ID,
				PermissionSubjectTypeLabel,
				lo.Map(user.Labels, func(l Label, _ int) string { return l.Name }),
			).
			Count(&count)
		if c.Error != nil {
			err := cerrors.DatabaseError{
				ID:         cerrors.DatabaseCreateNewSessionError,
				Message:    "error when looking up for permission_item",
				Sql:        c.Statement.SQL.String(),
				InnerError: c.Error,
				StackTrace: cerrors.GetStackTrace(),
				Context: map[string]interface{}{
					"room_permission_type": room.PermissionType,
					"room_id":              room,
					"user_id":              lo.If(user == nil, 0).ElseF(func() int { return int(user.ID) }),
				},
			}
			logrus.WithError(err).Error("error when check user watching room permission")
		}
		return count == 0
	}
	return false
}

type PermItemAutoCompeleteItem struct {
	Type PermissionSubjectType `json:"type"`
	Name string                `json:"name"`
}

func RermItemAutoComplete(roomId uint, permType PermissionSubjectType, prefix string) ([]*PermItemAutoCompeleteItem, cerrors.ChocolateError) {
	switch permType {
	case PermissionSubjectTypeLabel:
		labelLookup := db.
			Model(&Label{}).
			Where("name LIKE ?", fmt.Sprintf("%%%s%%", prefix)).
			Select("name, 'label' as type").
			Limit(10)
		userLookup := db.
			Model(&User{}).
			Where("username = ?", prefix).
			Select("username as name, 'user' as type").
			Limit(10)

		var result []*PermItemAutoCompeleteItem
		c := db.Raw("(?) UNION (?)", userLookup, labelLookup).Find(&result)
		if c.Error != nil {
			return nil, cerrors.DatabaseError{
				ID:         cerrors.DatabasePermItemAutoComepelteLookupError,
				Sql:        c.Statement.SQL.String(),
				InnerError: c.Error,
				StackTrace: cerrors.GetStackTrace(),
				Context: map[string]interface{}{
					"room_id": roomId,
					"type":    permType,
					"prefix":  prefix,
				},
			}
		}
		return result, nil
	case PermissionSubjectTypeUser:
		labelLookup := db.
			Model(&Label{}).
			Where("name = ?", prefix).
			Select("name, 'label' as type").
			Limit(10)
		userLookup := db.
			Model(&User{}).
			Where("username LIKE ?", fmt.Sprintf("%%%s%%", prefix)).
			Select("username as name, 'user' as type").
			Limit(10)

		var result []*PermItemAutoCompeleteItem
		c := db.Raw("(?) UNION (?)", labelLookup, userLookup).Find(&result)
		if c.Error != nil {
			return nil, cerrors.DatabaseError{
				ID:         cerrors.DatabasePermItemAutoComepelteLookupError,
				Sql:        c.Statement.SQL.String(),
				InnerError: c.Error,
				StackTrace: cerrors.GetStackTrace(),
				Context: map[string]interface{}{
					"room_id": roomId,
					"type":    permType,
					"prefix":  prefix,
				},
			}
		}
		return result, nil
	}
	return nil, cerrors.LogicError{
		ID:      cerrors.LogicUnknownPermItemSubjectType,
		Message: "unknown perm item subject type",
		Context: map[string]interface{}{
			"type": permType,
		},
	}
}
