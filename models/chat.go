package models

import (
	cerrors "github.com/sheey11/chocolate/errors"
	"gorm.io/gorm"
)

type ChatMessageType string

const (
	ChatMessageTypeUnknown              ChatMessageType = ""
	ChetMessageTypeAdministrationCutOff ChatMessageType = "cut_off"
	ChatMessageTypePing                 ChatMessageType = "ping"
	ChatMessageTypePong                 ChatMessageType = "pong"
	ChatMessageTypeEnteringRoom         ChatMessageType = "entering_room"
	ChatMessageTypeMessage              ChatMessageType = "chat"
	ChatMessageTypeLike                 ChatMessageType = "like"
	ChatMessageTypeGift                 ChatMessageType = "gift"
	ChatMessageTypeSuperChat            ChatMessageType = "superchat"
)

type ChatMessage struct {
	gorm.Model
	Type     ChatMessageType
	Room     Room
	RoomID   uint   `gorm:"not null;"`
	Message  string `gorm:"varchar(32)"`
	Sender   User
	SenderID uint `gorm:"not null;"`
}

func CreateChat(msg *ChatMessage) cerrors.ChocolateError {
	c := db.Create(msg)
	if c != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseCreateChatMessageError,
			Message:    "error when creating chat message",
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"chat": *msg,
			},
		}
	}
	return nil
}
