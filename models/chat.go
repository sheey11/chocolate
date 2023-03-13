package models

import (
	"encoding/json"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type ChatMessageType uint8

const (
	ChatMessageTypeEnteringRoom ChatMessageType = iota
	ChatMessageTypeMessage
	ChatMessageTypeLike
	ChatMessageTypeGift
	ChatMessageTypeSuperChat
)

func (t *ChatMessageType) MarshalJSON() ([]byte, error) {
	str, ok := map[ChatMessageType]string{
		ChatMessageTypeEnteringRoom: "entering_room",
		ChatMessageTypeMessage:      "message",
		ChatMessageTypeLike:         "like",
		ChatMessageTypeGift:         "gift",
		ChatMessageTypeSuperChat:    "super_chat",
	}[*t]
	if ok {
		return []byte(str), nil
	} else {
		logrus.Errorf("unknow value %v when marshaling ChatMessageType", *t)
		return json.Marshal(uint8(*t))
	}
}

type ChatMessage struct {
	gorm.Model
	Type     ChatMessageType
	Room     Room
	RoomID   uint   `gorm:"not null;"`
	Message  string `gorm:"varchar(32)"`
	Sender   User
	SenderID uint `gorm:"not null;"`
}
