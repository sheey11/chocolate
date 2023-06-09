package models

import (
	"fmt"
	"strconv"
	"time"

	"github.com/sheey11/chocolate/errors"
	cerrors "github.com/sheey11/chocolate/errors"
	"gorm.io/gorm"
)

type LogType uint8

// MEMO: if added new types, don't forgot to
// check types in func RetriveLogsForRoom() below.
const (
	LogTypePublish LogType = iota
	LogTypeUnpublish
	LogTypeCutOff
)

type Log struct {
	gorm.Model `json:"-"`
	Type       LogType   `gorm:"not null;" json:"type"`
	Subject    string    `gorm:"not null;" json:"subject"` // non-signed in user have string subject
	Time       time.Time `gorm:"not null;" json:"time"`
	Detail     string    `json:"detail"`
}

func RecordLog[T uint | string](t LogType, subjectId T) cerrors.ChocolateError {
	log := Log{
		Type:    t,
		Subject: fmt.Sprintf("%v", subjectId),
		Time:    time.Now(),
	}
	c := db.Create(&log)
	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseCreateAdminAccountError,
			Message:    "error on recording event",
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
		}
	}
	return nil
}

func RecordEventWithDetail[T uint | string](t LogType, subjectId T, detail string) cerrors.ChocolateError {
	log := Log{
		Type:    t,
		Subject: fmt.Sprintf("%v", subjectId),
		Time:    time.Now(),
		Detail:  detail,
	}
	c := db.Create(&log)
	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseCreateAdminAccountError,
			Message:    "error on recording event",
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
		}
	}
	return nil
}

func CountLogs(allowedTypes []LogType, before *time.Time, after *time.Time) (int64, cerrors.ChocolateError) {
	statement := db.
		Model(&Log{}).
		Where("type in ?", allowedTypes)

	if before != nil {
		statement.Where("time < ?", before)
	}

	if after != nil {
		statement.Where("time > ?", after)
	}

	var result int64
	c := statement.Count(&result)
	if c.Error != nil {
		return 0, errors.DatabaseError{
			ID:         errors.DatabaseCountLogsError,
			Message:    "error when count logs on given filter",
			Sql:        c.Statement.SQL.String(),
			StackTrace: errors.GetStackTrace(),
			Context: map[string]interface{}{
				"allowed_log_types": allowedTypes,
				"before":            before,
				"after":             after,
			},
		}
	}
	return result, nil
}

func RetriveLogs(allowedTypes []LogType, limit int, before *time.Time, after *time.Time) ([]*Log, cerrors.ChocolateError) {
	clause := db.
		Model(&Log{}).
		Where("type in ?", allowedTypes).
		Limit(limit).
		Order("created_at DESC")

	if before != nil {
		clause.Where("time < ?", before)
	}

	if after != nil {
		clause.Where("time > ?", after)
	}

	var result []*Log
	c := clause.Find(&result)
	if c.Error != nil {
		return nil, errors.DatabaseError{
			ID:         errors.DatabaseLookupLogsError,
			Message:    "error when lookup logs on given filter",
			Sql:        c.Statement.SQL.String(),
			StackTrace: errors.GetStackTrace(),
			Context: map[string]interface{}{
				"allowed_log_types": allowedTypes,
				"limit":             limit,
				"before":            before,
				"after":             after,
			},
		}
	}
	return result, nil
}

func RetriveLogsForRoom(roomid uint) ([]*Log, cerrors.ChocolateError) {
	var result []*Log
	c := db.
		Where("subject = ?", strconv.FormatUint(uint64(roomid), 10)).
		Where("type in ?", []LogType{LogTypePublish, LogTypeUnpublish, LogTypeCutOff}). // check here
		Order("created_at DESC").
		Limit(12).
		Find(&result)
	if c.Error != nil {
		return nil, errors.DatabaseError{
			ID:         errors.DatabaseLookupLogsError,
			Message:    "error when lookup logs for specified room",
			InnerError: c.Error,
			Sql:        c.Statement.SQL.String(),
			StackTrace: errors.GetStackTrace(),
			Context: map[string]interface{}{
				"room_id": roomid,
			},
		}
	}
	return result, nil
}
