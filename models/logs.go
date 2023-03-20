package models

import (
	"fmt"
	"time"

	"github.com/sheey11/chocolate/errors"
	"gorm.io/gorm"
)

type LogType uint8

const (
	LogTypePublish LogType = iota
	LogTypeUnpublish
	LogTypePlay
	LogTypeStop
)

type Log struct {
	gorm.Model `json:"-"`
	Type       LogType   `gorm:"not null;" json:"type"`
	Subject    string    `gorm:"not null;" json:"subject"`
	Time       time.Time `gorm:"not null;" json:"time"`
	Detail     string    `json:"detail"`
}

func RecordEvent[T uint | string](t LogType, subjectId T) error {
	log := Log{
		Type:    t,
		Subject: fmt.Sprintf("%v", subjectId),
		Time:    time.Now(),
	}
	return db.Create(log).Error
}

func RecordEventWithDetail[T uint | string](t LogType, subjectId T, detail string) error {
	log := Log{
		Type:    t,
		Subject: fmt.Sprintf("%v", subjectId),
		Time:    time.Now(),
		Detail:  detail,
	}
	return db.Create(log).Error
}

func CountLogs(allowedTypes []LogType, before *time.Time, after *time.Time) (int64, error) {
	clause := db.
		Model(&Log{}).
		Where("type in ?", allowedTypes)

	if before != nil {
		clause.Where("time < ?", before)
	}

	if after != nil {
		clause.Where("time > ?", after)
	}

	var result int64
	c := clause.Count(&result)
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

func RetriveLogs(allowedTypes []LogType, limit int, before *time.Time, after *time.Time) ([]*Log, error) {
	clause := db.
		Model(&Log{}).
		Where("type in ?", allowedTypes).
		Limit(limit)

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
