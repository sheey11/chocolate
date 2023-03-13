package models

import (
	"github.com/sheey11/chocolate/common"
	"github.com/sirupsen/logrus"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

const (
	UserRoleName          = "user"
	AdministratorRoleName = "administrator"
)

func Migrate(connStr string) error {
	logrus.Info("Start migration.")
	db, err := gorm.Open(postgres.Open(connStr), &gorm.Config{})
	if common.DEBUG {
		db = db.Debug()
	}
	if err != nil {
		return err
	}

	defaultRoles := []Role{
		{
			Name:                       AdministratorRoleName,
			AbilityManageAdministrator: true,
			AbilityManageStreamer:      true,
			AbilityManageUser:          true,
			AbilityStream:              true,
			AbilityManageStream:        true,
			AbilityCreateRoom:          true,
		},
		{
			Name:                       UserRoleName,
			AbilityManageAdministrator: false,
			AbilityManageStreamer:      false,
			AbilityManageUser:          false,
			AbilityStream:              true,
			AbilityManageStream:        false,
			AbilityCreateRoom:          true,
		},
	}

	err = db.AutoMigrate(
		&User{},
		&Role{},
		&Label{},
		&Session{},
		&Room{},
		&PermissionItem{},
		&Log{},
		&ChatMessage{},
	)
	if err != nil {
		return err
	}

	return db.Save(defaultRoles).Error
}
