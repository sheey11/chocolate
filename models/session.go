package models

import (
	"time"

	"github.com/sheey11/chocolate/errors"
	"gorm.io/gorm"
)

type Session struct {
	gorm.Model
	User       User   `gorm:"not null;"`
	UserID     uint   `gorm:"not null;"`
	IP         string `gorm:"type:varchar(40)"`
	UA         string
	ValidUntil time.Time `gorm:"not null;"`
}

func GenerateSessionForUser(u *User, ip string, ua string) (*Session, error) {
	s := Session{
		User:       *u,
		UserID:     u.ID,
		IP:         ip,
		UA:         ua,
		ValidUntil: time.Now().Add(time.Hour * 24 * 14),
	}
	tx := db.Save(&s)
	if tx.Error != nil {
		return &s, errors.DatabaseError{
			ID:         errors.DatabaseCreateNewSessionError,
			Message:    "error on creating sessions",
			Sql:        tx.Statement.SQL.String(),
			InnerError: tx.Error,
			StackTrace: errors.GetStackTrace(),
		}
	}
	return &s, nil
}

func GetSessionByID(id uint) *Session {
	s := Session{}
	tx := db.First(&s, id)
	if tx.Error != nil {
		return nil
	}
	return &s
}
