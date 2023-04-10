package callbacks

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sheey11/chocolate/chat"
	"github.com/sheey11/chocolate/middleware"
	"github.com/sheey11/chocolate/models"
	"github.com/sheey11/chocolate/service"
	"github.com/sirupsen/logrus"
)

func mountCallbackRoutes(r *gin.RouterGroup) {
	r.Use(middleware.IPRestriction(
		[]string{
			"127.0.0.1/32",
			"192.168.1.1/16",
			"172.16.0.0/12",
			"10.1.1.1/8",
		},
	))
	r.POST("/publish", handlePublish)
	r.POST("/unpublish", handleUnpublish)
	r.POST("/play", handlePlay)
	r.POST("/stop", handleStop)
}

func MarshalJSON(v interface{}) string {
	s, _ := json.Marshal(v)
	return string(s)
}

type callbackResponse struct {
	Code uint `json:"code"`
}

func respondeOk(c *gin.Context) {
	c.JSON(http.StatusOK, callbackResponse{0})
}

func respondeErr(c *gin.Context) {
	c.JSON(http.StatusForbidden, callbackResponse{1})
	c.Abort()
}

func handlePublish(c *gin.Context) {
	// ? pushkey = x
	data := struct {
		ServerID string `json:"server_id"`
		Action   string `json:"action"`
		ClientID string `json:"client_id"`
		IP       string `json:"ip"`
		VHost    string `json:"vhost"`
		App      string `json:"app"`
		TCUrl    string `json:"tcUrl"`
		Stream   string `json:"stream"`
		Params   string `json:"param"`
	}{}
	// reference:
	//   ServerID:  vid-d1x7d79
	//   Action:    on_publish
	//   ClientID:  88914ni6
	//   IP:        172.24.0.1
	//   VHost:     __defaultVhost__
	//   App:       live
	//   TCUrl:     rtmp://172.24.0.163/live
	//   Stream:    114514
	//   Params:    ?uid=113123&key=dadawdawdaw

	err := c.Bind(&data)
	if err != nil {
		logrus.WithError(err).Errorf("error when parse body at on_publish callback")
		respondeErr(c)
		return
	}

	roomId, err := strconv.Atoi(data.Stream)
	if err != nil || roomId < 0 {
		respondeErr(c)
		logrus.WithField("room_id", data.Stream).Debug("room publish not permitted, room_id atoi failed")
		return
	}

	if data.App != "live" {
		respondeErr(c)
		logrus.WithField("room_id", roomId).Debug("room publish not permitted, reason: app != live")
		return
	}

	room, _ := service.GetRoomByID(uint(roomId))
	if room == nil {
		respondeErr(c)
		return
	}
	ok := service.CheckRoomStreamPermission(room, data.Params)
	if !ok {
		respondeErr(c)
		return
	}

	err = service.RecordRoomClientID(uint(roomId), data.ClientID)
	if err == nil {
		chat.SendMessage(&models.ChatMessage{
			Room:   *room,
			RoomID: uint(roomId),
			Type:   models.ChatMessageTypeStartStreaming,
		})
		respondeOk(c)
		service.RecordPublishEvent(uint(roomId), MarshalJSON(data))
		return
	} else {
		respondeErr(c)
		logrus.WithError(err).Error("error when handling srs publish callback")
		return
	}
}

func handleUnpublish(c *gin.Context) {
	data := struct {
		ServerID string `json:"server_id"`
		Action   string `json:"action"`
		ClientID string `json:"client_id"`
		IP       string `json:"ip"`
		VHost    string `json:"vhost"`
		App      string `json:"app"`
		Stream   string `json:"stream"`
	}{}

	err := c.Bind(&data)
	if err != nil {
		logrus.WithError(err).Errorf("error when parse body at on_unpublish callback")
		respondeErr(c)
		return
	}

	roomId, err := strconv.Atoi(data.Stream)
	if err != nil || roomId < 0 {
		respondeErr(c)
		return
	}

	err = service.ClearRoomStreamAndClientID(uint(roomId))
	if err != nil {
		respondeErr(c)
		logrus.WithError(err).Error("error clearing room stream id")
	}

	respondeOk(c)
	service.RecordUnpublishEvent(uint(roomId), MarshalJSON(data))
}
func handlePlay(c *gin.Context) {
	data := struct {
		ServerID string `json:"server_id"`
		Action   string `json:"action"`
		ClientID string `json:"client_id"`
		IP       string `json:"ip"`
		VHost    string `json:"vhost"`
		App      string `json:"app"`
		Stream   string `json:"stream"`
		PageURL  string `json:"pageUrl"`
		Params   string `json:"param,optional"`
	}{}
	err := c.Bind(&data)
	if err != nil {
		logrus.WithError(err).Errorf("error when parse body at on_unpublish callback")
		respondeErr(c)
		return
	}

	roomId, err := strconv.Atoi(data.Stream)
	if err != nil || roomId < 0 {
		respondeErr(c)
		return
	}

	// FIXME: use chat ping-pong heartbeat message to
	// count active viewers instead.
	cerr := service.DecreaseRoomViewer(uint(roomId))
	if cerr != nil {
		logrus.WithError(cerr).Error("failed to decrease room viewer")
	}
	service.RecordPlayEvent(uint(roomId), MarshalJSON(data))

	respondeOk(c)
}
func handleStop(c *gin.Context) {
	data := struct {
		ServerID string `json:"server_id"`
		Action   string `json:"action"`
		ClientID string `json:"client_id"`
		IP       string `json:"ip"`
		VHost    string `json:"vhost"`
		App      string `json:"app"`
		Stream   string `json:"stream"`
	}{}
	err := c.Bind(&data)
	if err != nil {
		logrus.WithError(err).Errorf("error when parse body at on_unpublish callback")
		respondeErr(c)
		return
	}

	roomId, err := strconv.Atoi(data.Stream)
	if err != nil || roomId < 0 {
		respondeErr(c)
		return
	}

	// FIXME: use chat ping-pong heartbeat message to
	// count active viewers instead.
	cerr := service.IncreaseRoomViewer(uint(roomId))
	if cerr != nil {
		logrus.WithError(cerr).Error("failed to increase room viewer")
	}
	service.RecordStopEvent(uint(roomId), MarshalJSON(data))

	respondeOk(c)
}
