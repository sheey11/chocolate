package callbacks

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sheey11/chocolate/middleware"
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
	if err != nil {
		respondeErr(c)
		return
	}

	if data.App != "live" {
		respondeErr(c)
		return
	}

	ok := service.CheckRoomStreamPermission(uint(roomId), data.Params)
	if !ok {
		respondeErr(c)
	} else {
		respondeOk(c)
		service.RecordPublishEvent(uint(roomId), data.IP)
	}
}

func handleUnpublish(c *gin.Context) {
	// TODO
}
func handlePlay(c *gin.Context) {
	// TODO
}
func handleStop(c *gin.Context) {
	// TODO
}
