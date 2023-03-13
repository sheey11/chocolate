package middleware

import (
	"net/http"
	"reflect"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sheey11/chocolate/common"
	"github.com/sheey11/chocolate/errors"
	"github.com/sheey11/chocolate/models"
	"github.com/sheey11/chocolate/service"
)

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if len(auth) < 7 || !strings.HasPrefix(auth, "Bearer ") {
			c.Abort()
			c.JSON(http.StatusUnauthorized, common.Response{
				"code":    errors.RequestNotLoggedIn,
				"message": "not logged in",
			})
			return
		}
		jwt := auth[7:]
		payload, err := common.DecryptJwt(jwt)
		if v, ok := err.(errors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusUnauthorized, v.ResponseFriendly("zh"))
			return
		}

		valid := time.Unix(int64(payload.SessionExpire), 0)
		if time.Now().After(valid) {
			c.Abort()
			c.JSON(http.StatusUnauthorized, common.Response{
				"code":    errors.RequestSessionExpire,
				"message": "session expired, please relogin",
			})
			return
		}
	}
}

// Deprecated, use AbilityRequired instead.
func RoleRequired(expectRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if len(auth) < 7 || !strings.HasPrefix(auth, "Bearer ") {
			c.Abort()
			c.JSON(http.StatusUnauthorized, common.Response{
				"code":    errors.RequestNotLoggedIn,
				"message": "not logged in",
			})
			return
		}
		jwt := auth[7:]
		payload, err := common.DecryptJwt(jwt)
		if v, ok := err.(errors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusUnauthorized, v.ResponseFriendly("zh"))
			return
		}

		valid := time.Unix(int64(payload.SessionExpire), 0)
		if time.Now().After(valid) {
			c.Abort()
			c.JSON(http.StatusUnauthorized, common.Response{
				"code":    errors.RequestSessionExpire,
				"message": "session expired, please relogin",
			})
			return
		}

		if payload.UserRole != expectRole {
			c.Abort()
			c.JSON(http.StatusUnauthorized, common.Response{
				"code":    errors.RequestPermissionDenied,
				"message": "permission denied",
			})
			return
		}
	}
}

// Usage:
//
//	```go
//	gin.Use(AbilityRequired(Role { AbilityStream: True }))
//	```
func AbilityRequired(ability models.Role) gin.HandlerFunc {
	fields := make([]int, 0)
	roleType := reflect.TypeOf(ability)
	roleValue := reflect.ValueOf(ability)
	for i := 0; i < roleType.NumField(); i++ {
		field := roleType.Field(i)
		if strings.HasPrefix(field.Name, "Ability") && field.Type.Kind() == reflect.Bool && roleValue.Field(i).Interface() == true {
			fields = append(fields, i)
		}
	}

	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if len(auth) < 7 || !strings.HasPrefix(auth, "Bearer ") {
			c.Abort()
			c.JSON(http.StatusUnauthorized, common.Response{
				"code":    errors.RequestNotLoggedIn,
				"message": "not logged in",
			})
			return
		}
		jwt := auth[7:]
		payload, err := common.DecryptJwt(jwt)
		if v, ok := err.(errors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, v.ResponseFriendly("zh"))
			return
		}

		valid := time.Unix(int64(payload.SessionExpire), 0)
		if time.Now().After(valid) {
			c.Abort()
			c.JSON(http.StatusUnauthorized, common.Response{
				"code":    errors.RequestSessionExpire,
				"message": "session expired, please relogin",
			})
			return
		}

		role, err := service.GetRoleByName(payload.UserRole)
		if err != nil {
			if _, ok := err.(errors.RequestError); ok {
				c.Abort()
				c.JSON(http.StatusBadRequest, common.Response{
					"code":    errors.RequestCorruptJwtPayload,
					"message": "account role not found",
				})
				return
			} else {
				c.Abort()
				c.JSON(http.StatusInternalServerError, common.Response{
					"code":    errors.RequestInternalServerError,
					"message": "role lookup failed",
				})
				return
			}
		}

		pass := true
		value := reflect.ValueOf(*role)
		for _, i := range fields {
			if value.Field(i).Interface() == false {
				pass = false
				break
			}
		}

		if !pass {
			c.Abort()
			c.JSON(http.StatusUnauthorized, common.Response{
				"code":    errors.RequestPermissionDenied,
				"message": "permission denied",
			})
			return
		}
	}
}
