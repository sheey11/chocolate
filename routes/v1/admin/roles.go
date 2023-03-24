package admin

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/samber/lo"
	"github.com/sheey11/chocolate/common"
	cerrors "github.com/sheey11/chocolate/errors"
	"github.com/sheey11/chocolate/middleware"
	"github.com/sheey11/chocolate/models"
	"github.com/sheey11/chocolate/service"
)

func mountRolesRoutes(r *gin.RouterGroup) {
	r.Use(middleware.AbilityRequired(models.Role{AbilityManageAccount: true}))
	r.GET("/roles", handleRolesRetrieval)
}

func handleRolesRetrieval(c *gin.Context) {
	roles, err := service.ListRoles()
	if err != nil {
		if rerr, ok := err.(cerrors.RequestError); ok {
			c.Abort()
			c.JSON(http.StatusBadRequest, rerr.ToResponse())
			return
		} else {
			c.Abort()
			c.JSON(http.StatusInternalServerError, err.ToResponse())
			return
		}
	}

	type roleAbility struct {
		ManageAccount   bool `json:"manage_account"`
		Stream          bool `json:"stream"`
		ManageRoom      bool `json:"manage_room"`
		CreateRoom      bool `json:"create_room"`
		RetrieveMetrics bool `json:"retrieve_metrics"`
	}

	type rolesPubInfo struct {
		Name      string      `json:"name"`
		Abilities roleAbility `json:"abilities"`
	}

	var result = lo.Map(roles, func(role *models.Role, _ int) rolesPubInfo {
		return rolesPubInfo{
			Name: role.Name,
			Abilities: roleAbility{
				ManageAccount:   role.AbilityManageAccount,
				Stream:          role.AbilityStream,
				ManageRoom:      role.AbilityManageRoom,
				CreateRoom:      role.AbilityCreateRoom,
				RetrieveMetrics: role.AbilityRetrieveMetrics,
			},
		}
	})

	c.JSON(http.StatusOK, common.Response{
		"code":    0,
		"message": "ok",
		"roles":   result,
	})
}
