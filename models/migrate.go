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
			Name:                   AdministratorRoleName,
			AbilityManageAccount:   true,
			AbilityStream:          true,
			AbilityManageRoom:      true,
			AbilityCreateRoom:      true,
			AbilityRetrieveMetrics: true,
		},
		{
			Name:                   UserRoleName,
			AbilityManageAccount:   false,
			AbilityStream:          true,
			AbilityManageRoom:      false,
			AbilityCreateRoom:      true,
			AbilityRetrieveMetrics: false,
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
		&Event{},
	)
	if err != nil {
		return err
	}

	return db.Save(defaultRoles).Error
}
