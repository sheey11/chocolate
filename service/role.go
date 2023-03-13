package service

import "github.com/sheey11/chocolate/models"

func GetRoleByName(name string) (*models.Role, error) {
	return models.GetRoleByName(name)
}
