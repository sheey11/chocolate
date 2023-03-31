package models

import (
	"errors"

	cerrors "github.com/sheey11/chocolate/errors"
	"gorm.io/gorm"
)

type Role struct {
	Name                   string `gorm:"type:varchar(32);primaryKey"`
	AbilityManageAccount   bool   `json:"-"`
	AbilityStream          bool   `json:"-"`
	AbilityManageRoom      bool   `json:"-"`
	AbilityCreateRoom      bool   `json:"-"`
	AbilityRetrieveMetrics bool   `json:"-"`
}

func ListRoles() ([]*Role, cerrors.ChocolateError) {
	var roles []*Role
	if err := db.Find(&roles).Error; err == nil {
		return roles, nil
	} else {
		return roles, cerrors.DatabaseError{
			ID:         cerrors.DatabaseLookupRolesError,
			Message:    "error finding all roles",
			InnerError: err,
			StackTrace: cerrors.GetStackTrace(),
		}
	}
}

// return exist role names
func CheckRoleExists(roles []string, tx *gorm.DB) ([]string, cerrors.ChocolateError) {
	if tx == nil {
		tx = db
	}

	var result []string
	c := tx.Model(&Role{}).Select("Name").Where("Name in ?", roles).Find(&result)
	if c.Error != nil {
		return result, cerrors.DatabaseError{
			ID:         cerrors.DatabaseLookupRolesError,
			InnerError: c.Error,
			Message:    "error when lookup role exists",
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
		}
	}
	return result, nil
}

func GetRoleByName(name string) (*Role, cerrors.ChocolateError) {
	var result Role

	c := db.First(&result, "name = ?", name)
	if c.Error != nil {
		if errors.Is(c.Error, gorm.ErrRecordNotFound) {
			return nil, cerrors.RequestError{
				ID:      cerrors.ReuqestRoleNotFound,
				Message: "role not found",
			}
		} else {
			return nil, cerrors.DatabaseError{
				ID:         cerrors.DatabaseLookupRolesError,
				Message:    "role lookup error",
				InnerError: c.Error,
				Sql:        c.Statement.SQL.String(),
				StackTrace: cerrors.GetStackTrace(),
			}
		}
	}
	return &result, nil
}
