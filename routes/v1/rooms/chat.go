package rooms

import (
	"fmt"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/sheey11/chocolate/chat"
	"github.com/sheey11/chocolate/common"
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
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var chatSubscriberUniqueId int64 = -1
var chatSubscriberMutex sync.Mutex

type WebsocketChatMessageRecv struct {
	MessageType models.ChatMessageType `json:"type"`
	Content     string                 `json:"content"`
	// Gift        *struct{}              `json:"gift,omitempty"`
}

type WebsocketChatMessageSend struct {
	MessageType             models.ChatMessageType `json:"type"`
	Content                 string                 `json:"content"`
	SenderName              string                 `json:"sender"`
	SenderID                uint                   `json:"sender_id"`
	SenderRole              string                 `json:"sender_role"`
	AdministrationMessageID uint                   `json:"admin_msg_id"`
	Timestamp               time.Time              `json:"time"`
}

func handleChatConnect(c *gin.Context) {
	roomIdStr := c.Param("id")
	roomId, err := strconv.Atoi(roomIdStr)
	if err != nil || roomId < 0 {
		c.Status(http.StatusBadRequest)
		c.Abort()
		return
	}

	room, cerr := service.GetRoomByID(uint(roomId))
	if cerr != nil {
		if _, ok := cerr.(cerrors.RequestError); ok {
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

	type auth struct {
		Authenticated *bool  `json:"authenticated"`
		Token         string `json:"token,omitempty"`
	}
	authInfo := auth{}
	conn.SetReadDeadline(time.Now().Add(time.Second * 5))
	err = conn.ReadJSON(&authInfo)
	if err != nil {
		c.Abort()
		conn.Close()
		return
	}

	var user *models.User = nil
	var uid int64 = 0
	if authInfo.Authenticated != nil && *authInfo.Authenticated {
		user = service.GetUserFromToken(authInfo.Token)
	} else if authInfo.Authenticated == nil {
		c.Abort()
		conn.Close()
		return
	}

	allowed := service.IsUserAllowedForRoom(room, user)
	if !allowed {
		c.Abort()
		conn.WriteJSON(WebsocketChatMessageSend{
			MessageType:             models.ChatMessageTypeAdministration,
			Content:                 "you have been banned from this room",
			AdministrationMessageID: uint(cerrors.RequestRoomBanned),
		})
		conn.Close()
		return
	}

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
		conn.WriteJSON(WebsocketChatMessageSend{
			MessageType: models.ChatMessageAuthenticationInfo,
			Content:     fmt.Sprintf("{\"username\": \"%s\"}", user.Username),
		})
	}

	var stop = make(chan struct{}, 0)
	conn.SetCloseHandler(func(code int, text string) error {
		if code != 1001 {
			logrus.WithField("code", code).WithField("text", text).Error("connection closed")
		}
		common.TryClose(stop)
		return nil
	})

	if user != nil {
		// read from websocket and pump it to hub
		go func() {
			for {
				select {
				case <-stop:
					return
				default:
					websocketChat := WebsocketChatMessageRecv{}
					conn.SetReadDeadline(time.Time{})
					err := conn.ReadJSON(&websocketChat)
					if err != nil {
						// logrus.WithField("subscribe_id", uid).WithError(err).Error("error reading chat message from websocket")
						common.TryClose(stop)
						return
					}

					if len(websocketChat.Content) > 32 || len(websocketChat.Content) == 0 {
						continue
					}

					switch websocketChat.MessageType {
					case models.ChatMessageTypeMessage:
						message := models.ChatMessage{
							Type:     websocketChat.MessageType,
							Room:     *room,
							RoomID:   room.ID,
							Sender:   user,
							SenderID: &user.ID,
							Message:  websocketChat.Content,
						}
						chat.SendMessage(&message)
					case models.ChatMessageTypePong:
						// TODO
						// after timeout 5s of sending ping message,
						// if no pong message send, consider the
						// connection as closed.
					}
				}
			}
		}()
	} else {
		// to clear buffer
		go func() {
			for {
				select {
				case <-stop:
					return
				default:
					websocketChat := WebsocketChatMessageRecv{}
					conn.SetReadDeadline(time.Time{})
					err := conn.ReadJSON(&websocketChat)
					if err != nil {
						common.TryClose(stop)
						return
					}
				}
			}
		}()
	}

	// read from hub and pump it to websocket
	go func() {
		ticker := time.NewTicker(time.Second * 30)

		ch := make(chan *models.ChatMessage, 10)
		chat.Subscribe(room, uid, ch)
		defer chat.Unsubscribe(room, uid)

		for {
			select {
			case <-stop:
				return
			case message := <-ch:
				websocketChat := WebsocketChatMessageSend{
					MessageType: message.Type,
					Content:     message.Message,
					SenderName:  message.Sender.Username,
					SenderID:    message.Sender.ID,
					SenderRole:  message.Sender.RoleName,
					Timestamp:   time.Now(),
				}
				err := conn.SetWriteDeadline(time.Now().Add(time.Second * 5))
				if err != nil {
					logrus.WithField("subscribe_id", uid).WithError(err).Error("error setting websocket write deadline")
				}
				err = conn.WriteJSON(websocketChat)
				if err != nil {
					logrus.WithField("subscribe_id", uid).WithError(err).Error("error writing chat message to websocket")
					common.TryClose(stop)
					return
				}
			case <-ticker.C:
				websocketChat := WebsocketChatMessageSend{
					MessageType: models.ChatMessageTypePing,
					Timestamp:   time.Now(),
				}
				conn.SetWriteDeadline(time.Now().Add(time.Second * 5))
				err := conn.WriteJSON(websocketChat)
				if err != nil {
					logrus.WithField("subscribe_id", uid).WithError(err).Error("error writing ping message to websocket")
					common.TryClose(stop)
					return
				}
			}
		}
	}()
}
