package models

import (
	"time"

	"github.com/samber/lo"
	cerrors "github.com/sheey11/chocolate/errors"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type UserWatchingSession struct {
	User      User
	UserID    uint `gorm:"primaryKey"`
	Room      Room
	RoomID    uint `gorm:"primaryKey"`
	ClientID  string
	Session   string `gorm:"primaryKey"`
	StartTime time.Time
	EndTime   *time.Time
}

func RecordEvent(uid uint, roomid uint, clientid string, session string) cerrors.ChocolateError {
	c := db.Create(&UserWatchingSession{
		UserID:    uid,
		RoomID:    roomid,
		ClientID:  clientid,
		Session:   session,
		StartTime: time.Now(),
		EndTime:   nil,
	})

	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseCreateUserWatchingHistoryError,
			Message:    "error on recording user watching history",
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
			InnerError: c.Error,
			Context: map[string]interface{}{
				"user_id":   uid,
				"room_id":   roomid,
				"client_id": clientid,
				"session":   session,
			},
		}
	}
	return nil
}

func UpdateEventEndTime(uid uint, roomid uint, session string) cerrors.ChocolateError {
	c := db.
		Model(&UserWatchingSession{}).
		Where("user_id = ?", uid).
		Where("room_id = ?", roomid).
		Where("session = ?", session).
		Update("end_time", time.Now())
	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseCreateUserWatchingHistoryError,
			Message:    "error on recording user watching history",
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
			InnerError: c.Error,
			Context: map[string]interface{}{
				"user_id": uid,
				"room_id": roomid,
				"session": session,
			},
		}
	}

	tx := db.Begin()
	defer tx.Rollback()

	var current = UserWatchingSession{}
	c = tx.
		Where("user_id = ?", uid).
		Where("room_id = ?", roomid).
		Where("session = ?", session).
		First(&current)

	if c.Error != nil {
		logrus.WithError(c.Error).Error("error on getting current UWA")
		return nil
	}

	type tmp struct {
		Start *time.Time
		End   *time.Time
	}
	overlaps := tmp{}
	c = tx.
		Model(&UserWatchingSession{}).
		Select("MIN(start_time) as start, MAX(end_time) as end").
		Where("user_id = ?", uid).
		Where("room_id = ?", roomid).
		Where("end_time IS NOT null").
		Where("? OR ?",
			gorm.Expr("end_time >= ? AND end_time <= ?", current.StartTime, current.EndTime),
			gorm.Expr("start_time >= ? AND start_time <= ?", current.StartTime, current.EndTime),
		).
		Find(&overlaps)

	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseListOverlappedUserWatchingHistoryError,
			Message:    "error on merge user watching history",
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
			InnerError: c.Error,
			Context: map[string]interface{}{
				"user_id": uid,
				"room_id": roomid,
				"session": session,
			},
		}
	} else if overlaps.Start == nil || overlaps.End == nil {
		return nil
	}

	c = tx.
		Model(&UserWatchingSession{}).
		Where("user_id = ?", uid).
		Where("room_id = ?", roomid).
		Where("session = ?", session).
		Updates(map[string]interface{}{
			"start_time": overlaps.Start,
			"end_time":   overlaps.End,
		})
	if c.Error != nil {
		logrus.WithError(c.Error).Error("error updating UWS start and end time")
		return nil
	}

	c = tx.
		Where("user_id = ?", uid).
		Where("room_id = ?", roomid).
		Where("session <> ?", session).
		Delete(&UserWatchingSession{}, "? OR ?",
			gorm.Expr("end_time >= ? AND end_time <= ?", current.StartTime, current.EndTime),
			gorm.Expr("start_time >= ? AND start_time <= ?", current.StartTime, current.EndTime),
		)

	if c.Error != nil {
		logrus.WithError(c.Error).Error("error deleteing overlapped UWS")
		return nil
	}

	tx.Commit()
	return nil
}

type RoomWatchingReport struct {
	Session           string         `json:"-"` // for diagnostic
	RoomID            uint           `json:"room_id"`
	RoomTitle         string         `json:"room_title"`
	RoomOwnerID       uint           `json:"room_owner_id"`
	RoomOwnerUsername string         `json:"room_owner_username"`
	StartTime         time.Time      `json:"start_time"`
	EndTime           *time.Time     `json:"end_time"`
	Chats             []*PubChatInfo `json:"chats" gorm:"-"`
}

type PubChatInfo struct {
	Time    time.Time       `json:"time"`
	Type    ChatMessageType `json:"type"`
	Content string          `json:"content"`
}

func GetUserWatchingHistory(uid uint, startTime time.Time, endTime time.Time) ([]*RoomWatchingReport, cerrors.ChocolateError) {
	if startTime.Add(12 * time.Hour).Before(endTime) {
		return nil, cerrors.RequestError{
			ID:      cerrors.RequestTimeRangeTooLong,
			Message: "time range should be within 12 hrs",
		}
	}

	var reports []*RoomWatchingReport
	c := db.
		Table("user_watching_sessions").
		Select(`user_watching_sessions.start_time as start_time,
user_watching_sessions.end_time   as end_time,
user_watching_sessions.room_id    as room_id,
rooms.title                       as room_title,
users.id                          as room_owner_id,
users.username                    as room_owner_username,
user_watching_sessions.session    as session`).
		Joins("JOIN rooms ON user_watching_sessions.room_id = rooms.id").
		Joins("JOIN users ON rooms.owner_id = users.id").
		Where("user_id = ?", uid).
		Where("user_watching_sessions.start_time BETWEEN ? AND ?", startTime, endTime).
		Order("user_watching_sessions.start_time DESC").
		Find(&reports)
	if c.Error != nil {
		return nil, cerrors.DatabaseError{
			ID:         cerrors.DatabaseListUserWatchingHistoryError,
			Message:    "error on lookup room watching report",
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
			InnerError: c.Error,
		}
	}

	for _, report := range reports {
		var chats []*ChatMessage
		c = db.Model(&ChatMessage{}).
			Where("room_id = ? AND sender_id = ?", report.RoomID, uid).
			Where("created_at BETWEEN ? AND ?", report.StartTime, report.EndTime).
			Find(&chats)

		if c.Error != nil {
			return nil, cerrors.DatabaseError{
				ID:         cerrors.DatabaseListChatMessageError,
				Message:    "error on finding chat message in time between",
				Sql:        c.Statement.SQL.String(),
				StackTrace: cerrors.GetStackTrace(),
				InnerError: c.Error,
				Context: map[string]interface{}{
					"user_id": uid,
					"room_id": report.RoomID,
					"session": report.Session,
				},
			}
		}

		chats = lo.Filter(chats, func(item *ChatMessage, index int) bool {
			return lo.Contains(
				[]ChatMessageType{
					ChatMessageTypeMessage,
					ChatMessageTypeEnteringRoom,
					ChatMessageTypeGift,
					ChatMessageTypeSuperChat,
					ChatMessageTypeAdministration,
				},
				item.Type,
			)
		})

		report.Chats = lo.Map(chats, func(chat *ChatMessage, _ int) *PubChatInfo {
			return &PubChatInfo{
				Time:    chat.CreatedAt,
				Content: chat.Message,
				Type:    chat.Type,
			}
		})
	}
	return reports, nil
}

type RoomAudienceReport struct {
	Session   string         `json:"-"` // for diagnostic
	UserID    uint           `json:"uid"`
	Username  string         `json:"username"`
	EnterTime time.Time      `json:"enter_time"`
	LeaveTime *time.Time     `json:"leave_time"`
	Chats     []*PubChatInfo `json:"chats" gorm:"-"`
}

func GetRoomAudienceHistory(rid uint, startTime time.Time, endTime time.Time) ([]*RoomAudienceReport, cerrors.ChocolateError) {
	if startTime.Add(12 * time.Hour).Before(endTime) {
		return nil, cerrors.RequestError{
			ID:      cerrors.RequestTimeRangeTooLong,
			Message: "time range should be within 12 hrs",
		}
	}

	var reports []*RoomAudienceReport
	c := db.
		Table("user_watching_sessions").
		Select(`user_watching_sessions.start_time as enter_time,
user_watching_sessions.end_time   as leave_time,
user_watching_sessions.user_id    as user_id,
users.username                    as username,
user_watching_sessions.session    as session`).
		Joins("JOIN users ON user_watching_sessions.user_id = users.id").
		Where("room_id = ?", rid).
		Where("user_watching_sessions.start_time BETWEEN ? AND ?", startTime, endTime).
		Order("user_watching_sessions.start_time DESC").
		Find(&reports)
	if c.Error != nil {
		return nil, cerrors.DatabaseError{
			ID:         cerrors.DatabaseListUserWatchingHistoryError,
			Message:    "error on listing room audience reports",
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
			InnerError: c.Error,
		}
	}

	for _, report := range reports {
		var chats []*ChatMessage
		c = db.
			Model(&ChatMessage{}).
			Where("room_id = ? AND sender_id = ?", rid, report.UserID).
			Where("created_at BETWEEN ? AND ?", report.EnterTime, report.LeaveTime).
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
					ChatMessageTypeGift,
					ChatMessageTypeSuperChat,
					ChatMessageTypeAdministration,
				},
				item.Type,
			)
		})

		report.Chats = lo.Map(chats, func(chat *ChatMessage, _ int) *PubChatInfo {
			return &PubChatInfo{
				Time:    chat.CreatedAt,
				Content: chat.Message,
				Type:    chat.Type,
			}
		})
	}
	return reports, nil
}
