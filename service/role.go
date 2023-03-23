package service

import (
	cerrors "github.com/sheey11/chocolate/errors"
	"github.com/sheey11/chocolate/models"
)

func GetRoleByName(name string) (*models.Role, cerrors.ChocolateError) {
	return models.GetRoleByName(name)
}
