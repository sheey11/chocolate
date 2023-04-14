package models

import (
	"time"

	"github.com/samber/lo"
	cerrors "github.com/sheey11/chocolate/errors"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type EventType string

const (
	EventTypePlay     EventType = "play"
	EventTypeStopPlay EventType = "stop_play"
)

type Event struct {
	gorm.Model
	EventType EventType `gorm:"not null"`
	User      User
	UserID    uint `gorm:"not null"`
	Room      Room
	RoomID    uint `gorm:"not null"`
	ClientID  string
}

func RecordEvent(_type EventType, uid uint, roomid uint, clientid string) cerrors.ChocolateError {
	c := db.Create(&Event{
		EventType: _type,
		UserID:    uid,
		RoomID:    roomid,
		ClientID:  clientid,
	})

	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseCreateEventError,
			Message:    "error on recording event",
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
			InnerError: c.Error,
			Context: map[string]interface{}{
				"type":      _type,
				"user_id":   uid,
				"room_id":   roomid,
				"client_id": clientid,
			},
		}
	}
	return nil
}

type RoomWatchingHistory struct {
	RoomID            uint   `json:"room_id"`
	RoomTitle         string `json:"room_title"`
	RoomOwnerID       uint   `json:"room_owner_id"`
	RoomOwnerUsername string `json:"room_owner_username"`
	Onlines           []*AudienceOnlineTimeRange
	Chats             []*PubChatInfo
}

type AudienceOnlineTimeRange struct {
	Start *time.Time `json:"start"`
	End   *time.Time `json:"end"`
}

type PubChatInfo struct {
	Time    time.Time       `json:"time"`
	Type    ChatMessageType `json:"type"`
	Content string          `json:"content"`
}

func GetUserWatchingHistory(uid uint, startTime time.Time, endTime time.Time) ([]*RoomWatchingHistory, cerrors.ChocolateError) {
	if startTime.Add(12 * time.Hour).Before(endTime) {
		return nil, cerrors.RequestError{
			ID:      cerrors.RequestTimeRangeTooLong,
			Message: "time range should be within 12 hrs",
		}
	}

	var events []Event
	c := db.Model(&Event{}).
		Where("user_id = ?", uid).
		Where("created_at BETWEEN ? AND ?", startTime, endTime).
		Order("created_at DESC").
		Limit(20).
		Find(&events)
	if c.Error != nil {
		return nil, cerrors.DatabaseError{
			ID:         cerrors.DatabaseListEventsError,
			Message:    "error on lookup event",
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
			InnerError: c.Error,
		}
	}

	type roomInfo struct {
		RoomID            uint
		RoomTitle         string
		RoomOwnerID       uint
		RoomOwnerUsername string
	}
	var rooms []roomInfo
	c = db.Model(&Event{}).
		Select("DISTINCT events.room_id as room_id, rooms.title as room_title, users.id as room_owner_id, users.username as room_owner_username").
		Joins("JOIN rooms on events.room_id = rooms.id").
		Joins("JOIN users ON rooms.owner_id = users.id").
		Where("user_id = ?", uid).
		Order("created_at DESC").
		Limit(20).
		Find(&rooms)

	return lo.Map(rooms, func(room roomInfo, _ int) *RoomWatchingHistory {
		var chats []*ChatMessage
		c = db.Model(&ChatMessage{}).
			Where("room_id = ? AND sender_id = ?", room.RoomID, uid).
			Where("created_at BETWEEN ? AND ?", startTime, endTime).
			Find(&chats)

		if c.Error != nil {
			logrus.
				WithField("stacktrace", cerrors.GetStackTrace()).
				WithError(c.Error).
				Error("error when listing chat messages")
		}

		chats = lo.Filter(chats, func(item *ChatMessage, index int) bool {
			return lo.Contains(
				[]ChatMessageType{
					ChatMessageTypeMessage,
					ChatMessageTypeEnteringRoom,
				},
				item.Type,
			)
		})

		chatInfos := lo.Map(chats, func(chat *ChatMessage, _ int) *PubChatInfo {
			return &PubChatInfo{
				Time:    chat.CreatedAt,
				Content: chat.Message,
				Type:    chat.Type,
			}
		})

		return &RoomWatchingHistory{
			RoomID:            room.RoomID,
			RoomTitle:         room.RoomTitle,
			RoomOwnerID:       room.RoomOwnerID,
			RoomOwnerUsername: room.RoomOwnerUsername,
			Chats:             chatInfos,
			Onlines: lo.ReduceRight(
				events,
				func(agg []*AudienceOnlineTimeRange, item Event, _ int) []*AudienceOnlineTimeRange {
					timeRange := agg[0]
					if item.EventType == EventTypePlay {
						timeRange = &AudienceOnlineTimeRange{}
						agg = append([]*AudienceOnlineTimeRange{timeRange}, agg...)
						timeRange.Start = &item.CreatedAt
					} else {
						timeRange.End = &item.CreatedAt
					}
					return agg
				},
				make([]*AudienceOnlineTimeRange, 1),
			),
		}
	}), nil
}

type AudienceReport struct {
	UserID   uint                       `json:"uid"`
	Username string                     `json:"username"`
	Onlines  []*AudienceOnlineTimeRange `json:"onlines"`
	Chats    []*PubChatInfo             `json:"chats"`
}

func GetRoomAudience(rid uint, startTime time.Time, endTime time.Time) ([]AudienceReport, cerrors.ChocolateError) {
	if startTime.Add(12 * time.Hour).Before(endTime) {
		return nil, cerrors.RequestError{
			ID:      cerrors.RequestTimeRangeTooLong,
			Message: "time range should be within 12 hrs",
		}
	}

	var events []Event
	c := db.
		Model(&Event{}).
		Where("room_id = ?").
		Where("created_at BETWEEN ? AND ?", startTime, endTime).
		Order("created_at DESC").
		Find(&events)
	if c.Error != nil {
		return nil, cerrors.DatabaseError{
			ID:         cerrors.DatabaseListEventsError,
			Message:    "error on listing event",
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
			InnerError: c.Error,
		}
	}

	type audience struct {
		UserID   uint
		Username string
	}
	var audiences []audience

	c = db.
		Model(&Event{}).
		Joins("JOIN users ON events.user_id = users.id").
		Where("room_id = ?").
		Where("created_at BETWEEN ? AND ?", endTime, startTime).
		Select("DISTINCT user_id, username").
		Find(&audiences)
	if c.Error != nil {
		return nil, cerrors.DatabaseError{
			ID:         cerrors.DatabaseListEventsError,
			Message:    "error on listing event",
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
			InnerError: c.Error,
		}
	}

	return lo.Map(audiences, func(a audience, _ int) AudienceReport {
		audiEvents := lo.Filter(events, func(event Event, _ int) bool {
			return event.UserID == a.UserID
		})

		var chats []*ChatMessage
		c = db.
			Model(&ChatMessage{}).
			Where("room_id = ? AND sender_id = ?", rid, a.UserID).
			Where("created_at BETWEEN ? AND ?", endTime, startTime).
			Find(&chats)

		if c.Error != nil {
			logrus.
				WithField("stacktrace", cerrors.GetStackTrace()).
				WithError(c.Error).
				Error("error when listing chat messages")
		}

		chats = lo.Filter(chats, func(item *ChatMessage, index int) bool {
			return lo.Contains(
				[]ChatMessageType{
					ChatMessageTypeMessage,
					ChatMessageTypeEnteringRoom,
				},
				item.Type,
			)
		})

		chatInfos := lo.Map(chats, func(chat *ChatMessage, _ int) *PubChatInfo {
			return &PubChatInfo{
				Time:    chat.CreatedAt,
				Content: chat.Message,
				Type:    chat.Type,
			}
		})

		return AudienceReport{
			Username: a.Username,
			UserID:   a.UserID,
			Chats:    chatInfos,
			Onlines: lo.ReduceRight(
				audiEvents,
				func(agg []*AudienceOnlineTimeRange, item Event, _ int) []*AudienceOnlineTimeRange {
					timeRange := agg[0]
					if item.EventType == EventTypePlay {
						timeRange = &AudienceOnlineTimeRange{}
						agg = append([]*AudienceOnlineTimeRange{timeRange}, agg...)
						timeRange.Start = &item.CreatedAt
					} else {
						timeRange.End = &item.CreatedAt
					}
					return agg
				},
				make([]*AudienceOnlineTimeRange, 1),
			),
		}
	}), nil
}
