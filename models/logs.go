package models

import (
	"fmt"
	"time"

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
	gorm.Model
	Type    LogType   `gorm:"not null;"`
	Subject string    `gorm:"not null;"`
	Time    time.Time `gorm:"not null;"`
}

func RecordEvent[T uint | string](t LogType, subjectId T) error {
	log := Log{
		Type:    t,
		Subject: fmt.Sprintf("%v", subjectId),
		Time:    time.Now(),
	}
	return db.Create(log).Error
}
