package playback

import (
	"net/http"
	"net/http/httputil"
	"net/url"

	"github.com/gin-gonic/gin"
	"github.com/sheey11/chocolate/common"
	"github.com/sheey11/chocolate/errors"
)

func mountPlaybackRoutes(r *gin.RouterGroup) {
	r.GET("/hls/:room", handleHlsPlayback)
	r.GET("/flv/:room", handleFlvPlayback)
}

func handleHlsPlayback(c *gin.Context) {
	// TODO
	remote, err := url.Parse("srs:8080")
	if err != nil {
		c.JSON(http.StatusInternalServerError, common.SampleResponse(errors.RequestInternalServerError, "internal server error"))
	}

	proxy := httputil.NewSingleHostReverseProxy(remote)
	proxy.Director = func(r *http.Request) {
		r.Header = c.Request.Header
		r.Host = remote.Host
		r.URL.Scheme = remote.Scheme
		r.URL.Host = remote.Host
		r.URL.Path = "" // TODO path
	}

	proxy.ServeHTTP(c.Writer, c.Request)
}

func handleFlvPlayback(c *gin.Context) {
	// TODO
}
