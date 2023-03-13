package middleware

import (
	"net"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func IPRestriction(cidrs []string) gin.HandlerFunc {
	masks := make([]*net.IPNet, len(cidrs))
	for i, cidr := range cidrs {
		_, mask, err := net.ParseCIDR(cidr)
		if err != nil {
			logrus.WithField("err", err).Fatalf("failed to parse given cidr: %v", cidr)
		}
		masks[i] = mask
	}

	return func(c *gin.Context) {
		ip := net.ParseIP(c.ClientIP())
		allowed := false
		for _, mask := range masks {
			if mask.Contains(ip) {
				allowed = true
				break
			}
		}

		if !allowed {
			c.Status(http.StatusForbidden)
			c.Abort()
		}
	}
}
