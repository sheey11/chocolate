package stats

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sheey11/chocolate/common"
	"github.com/sheey11/chocolate/errors"
	"github.com/sheey11/chocolate/middleware"
	"github.com/sheey11/chocolate/models"
	"github.com/sheey11/chocolate/srs"
	"github.com/sirupsen/logrus"
)

func mountStatsRoutes(r *gin.RouterGroup) {
	r.Use(middleware.AbilityRequired(models.Role{AbilityRetrieveMetrics: true}))
	r.GET("/version", handleVersion)
	r.GET("/summries", handleSummries)
	r.GET("/meminfo", handleMeminfo)
	r.GET("/vhosts", handleVHosts)
	r.GET("/streams", handleStreams)
	r.GET("/clients", handleClients)
}

func handleVersion(c *gin.Context) {
	version, err := srs.GetVersion()

	if err != nil {
		logrus.WithError(err).Error("error while requesting srs for stats")
		c.JSON(http.StatusInternalServerError, common.Response{
			"code":    errors.RequestInternalServerError,
			"message": "error while requesting srs for stats",
			"error":   err.Error(),
		})
		c.Abort()
		logrus.WithError(err).Errorf("failed to retrive srs version stats")
		return
	}

	c.JSON(http.StatusOK, common.Response{
		"code":    0,
		"message": "ok",
		"version": map[string]interface{}{
			"server":   version.ServerID,
			"service":  version.Service,
			"major":    version.Major,
			"minor":    version.Minor,
			"revision": version.Revision,
		},
	})
}
func handleSummries(c *gin.Context) {

}
func handleMeminfo(c *gin.Context) {}
func handleVHosts(c *gin.Context)  {}
func handleStreams(c *gin.Context) {}
func handleClients(c *gin.Context) {}
