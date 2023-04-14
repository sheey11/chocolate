package models

import (
	"encoding/base64"
	"fmt"
	"time"

	"github.com/sheey11/chocolate/common"
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

func (s *Session) Sign() string {
	rawString := fmt.Sprintf("s=%d,uid=%d,valid=%d", s.ID, s.UserID, s.ValidUntil.UnixMicro())
	return base64.StdEncoding.EncodeToString(common.SignBytes([]byte(rawString)))
}

func (s *Session) GetSessionCookieValue() string {
	return fmt.Sprintf("%d,%s", s.ID, s.Sign())
}

func GenerateSessionForUser(u *User, ip string, ua string) (*Session, errors.ChocolateError) {
	validUntil := time.Now().Add(time.Hour * 24 * 14)
	s := Session{
		User:       *u,
		UserID:     u.ID,
		IP:         ip,
		UA:         ua,
		ValidUntil: validUntil,
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
