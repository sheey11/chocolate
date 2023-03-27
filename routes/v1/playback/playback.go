package playback

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sheey11/chocolate/common"
	"github.com/sheey11/chocolate/errors"
	"github.com/sheey11/chocolate/models"
	"github.com/sheey11/chocolate/service"
	"github.com/sirupsen/logrus"
)

func mountPlaybackRoutes(r *gin.RouterGroup) {
	r.GET("/:room/hls", handleHlsPlayback)
	r.GET("/:room/flv", handleFlvPlayback)
}

func handleHlsPlayback(c *gin.Context) {
	idStr := c.Param("room")
	id, err := strconv.Atoi(idStr)
	if err != nil || id < 0 {
		c.Abort()
		c.Status(http.StatusBadRequest)
		return
	}

	room, cerr := service.GetRoomByID(uint(id))
	if cerr != nil {
		if rerr, ok := cerr.(errors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ToResponse())
			return
		} else {
			c.Abort()
			c.Status(http.StatusInternalServerError)
			return
		}
	}

	if room.Status != models.RoomStatusStreaming {
		c.Abort()
		c.Status(http.StatusNotFound)
		return
	}

	user := service.TryGetUserFromContext(c)
	allowed := service.IsUserAllowedForRoom(room, user)
	if !allowed {
		c.Abort()
		c.JSON(http.StatusForbidden, common.SampleResponse(errors.RequestRoomBanned, "you have been banned from watching this stream or login required"))
		return
	}

	remote, err := url.Parse("http://srs:8080")
	if err != nil {
		logrus.WithError(err).Error("error handling reverse proxy of hls playback")
		c.JSON(http.StatusInternalServerError, common.SampleResponse(errors.RequestInternalServerError, "internal server error"))
	}

	func() {
		defer func() {
			// the most common error is that client closes the connection,
			// and server is still tring to write the socket, that is the
			// `net/http: abort Handler` error.
			recover()
		}()

		proxy := httputil.NewSingleHostReverseProxy(remote)
		proxy.ModifyResponse = func(r *http.Response) error {
			r.Header.Del("Server")
			return nil
		}
		proxy.Director = func(r *http.Request) {
			r.Header = c.Request.Header
			r.Host = remote.Host
			r.URL.Scheme = remote.Scheme
			r.URL.Host = remote.Host
			r.URL.Path = fmt.Sprintf("/live/%d.m3u8", id)
		}
		proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
			logrus.WithError(err).Error("error reverse proxying flv")
		}

		proxy.ServeHTTP(c.Writer, c.Request)
	}()
}

func handleFlvPlayback(c *gin.Context) {
	idStr := c.Param("room")
	id, err := strconv.Atoi(idStr)
	if err != nil || id < 0 {
		c.Abort()
		c.Status(http.StatusBadRequest)
		return
	}

	room, cerr := service.GetRoomByID(uint(id))
	if cerr != nil {
		if rerr, ok := cerr.(errors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ToResponse())
			return
		} else {
			c.Abort()
			c.Status(http.StatusInternalServerError)
			return
		}
	}

	if room.Status != models.RoomStatusStreaming {
		c.Abort()
		c.Status(http.StatusNotFound)
		return
	}

	remote, err := url.Parse("http://srs:8080")
	if err != nil {
		logrus.WithError(err).Error("error handling reverse proxy of flv playback")
		c.JSON(http.StatusInternalServerError, common.SampleResponse(errors.RequestInternalServerError, "internal server error"))
		return
	}

	func() {
		defer func() {
			// the most common error is that client closes the connection,
			// and server is still tring to write the socket, that is the
			// `net/http: abort Handler` error.
			recover()
		}()

		proxy := httputil.NewSingleHostReverseProxy(remote)
		proxy.ModifyResponse = func(r *http.Response) error {
			r.Header.Del("Server")
			return nil
		}
		proxy.Director = func(r *http.Request) {
			r.Header = c.Request.Header
			r.Host = remote.Host
			r.URL.Scheme = remote.Scheme
			r.URL.Host = remote.Host
			r.URL.Path = fmt.Sprintf("/live/%d.flv", id)
		}
		proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
			logrus.WithError(err).Error("error reverse proxying flv")
		}

		proxy.ServeHTTP(c.Writer, c.Request)
	}()
}
