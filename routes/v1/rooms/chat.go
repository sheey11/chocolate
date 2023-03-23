package rooms

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/sheey11/chocolate/chat"
	cerrors "github.com/sheey11/chocolate/errors"
	"github.com/sheey11/chocolate/models"
	"github.com/sheey11/chocolate/service"
	"github.com/sirupsen/logrus"
)

func mountChatRoutes(r *gin.RouterGroup) {
	r.GET("/:id/chat", handleChatConnect)
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

var chatSubscriberUniqueId int64 = -1
var chatSubscriberMutex sync.Mutex

type WebsocketChatMessageRecv struct {
	MessageType models.ChatMessageType `json:"type"`
	Content     string                 `json:"content"`
	// Gift        *struct{}              `json:"gift,omitempty"`
}

type WebsocketChatMessageSend struct {
	MessageType models.ChatMessageType `json:"type"`
	Content     string                 `json:"content"`
	SenderName  string                 `json:"sender"`
	SenderID    uint                   `json:"sender_id"`
	SenderRole  string                 `json:"sender_role"`
	Timestamp   time.Time              `json:"time"`
}

func handleChatConnect(c *gin.Context) {
	roomIdStr := c.Param("id")
	roomId, err := strconv.Atoi(roomIdStr)
	if err != nil || roomId < 0 {
		c.Status(http.StatusBadRequest)
		c.Abort()
		return
	}

	room, err := service.GetRoomByID(uint(roomId))
	if err != nil {
		if _, ok := err.(cerrors.RequestError); ok {
			c.Status(http.StatusBadRequest)
			c.Abort()
			return
		} else {
			logrus.WithError(err).Error("error handling chat websocket connect, when lookup up room in database")
			c.Status(http.StatusInternalServerError)
			c.Abort()
			return
		}
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, c.Writer.Header())
	if err != nil {
		logrus.WithError(err).Infof("error establishing websocket connection")
		return
	}

	user := service.TryGetUserFromContext(c)
	var uid int64 = 0
	if user == nil {
		chatSubscriberMutex.Lock()
		chatSubscriberUniqueId -= 1
		if chatSubscriberUniqueId < -0xFFFFFFF0 {
			chatSubscriberUniqueId = -1
		}
		chatSubscriberMutex.Unlock()
		uid = chatSubscriberUniqueId
	} else {
		uid = int64(user.ID)
	}

	var stop = false

	if user != nil {
		// read from websocket and pump it to hub
		go func() {
			for !stop {
				websocketChat := WebsocketChatMessageRecv{}
				err := conn.ReadJSON(&websocketChat)
				if err != nil {
					stop = true
				}

				if len(websocketChat.Content) > 32 ||
					websocketChat.MessageType == models.ChatMessageTypePong ||
					websocketChat.MessageType == models.ChatMessageTypePing {
					continue
				}

				message := models.ChatMessage{
					Type:     websocketChat.MessageType,
					Room:     *room,
					RoomID:   room.ID,
					Sender:   *user,
					SenderID: user.ID,
					Message:  websocketChat.Content,
				}
				chat.SendMessage(&message)
			}
		}()
	}

	// read from hub and pump it to websocket
	go func() {
		ticker := time.NewTicker(time.Second * 30)

		ch := make(chan *models.ChatMessage, 10)
		chat.Subscribe(room, uid, ch)
		defer chat.Unsubscribe(room, uid)
		for !stop {
			select {
			case message := <-ch:
				websocketChat := WebsocketChatMessageSend{
					MessageType: message.Type,
					Content:     message.Message,
					SenderName:  message.Sender.Username,
					SenderID:    message.Sender.ID,
					SenderRole:  message.Sender.RoleName,
					Timestamp:   message.CreatedAt,
				}
				conn.SetWriteDeadline(time.Now().Add(time.Second * 5))
				err := conn.WriteJSON(websocketChat)
				if err != nil {
					stop = true
				}
			case <-ticker.C:
				websocketChat := WebsocketChatMessageSend{
					MessageType: models.ChatMessageTypePing,
				}
				conn.SetWriteDeadline(time.Now().Add(time.Second * 5))
				err := conn.WriteJSON(websocketChat)
				if err != nil {
					stop = true
				}
			}
		}
	}()
}
