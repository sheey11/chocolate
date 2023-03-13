package models

import (
	"github.com/sheey11/chocolate/errors"
	"gorm.io/gorm"
)

type Label struct {
	Name  string `gorm:"varchar(64);primaryKey"`
	Users []User `gorm:"many2many:user_labels;foreiginKey:Name;joinForeignKey:label_name;References:ID;joinReferences:user_id"`
}

func CheckExistLabels(labels []string, tx *gorm.DB) ([]string, error) {
	if tx == nil {
		tx = db
	}

	var result []string
	c := tx.Model(&Label{}).Where("Name in ?", labels).Select("Name").Find(&result)
	if c.Error != nil {
		return nil, errors.DatabaseError{
			ID:         errors.DatabaseLookupLabelsError,
			Message:    "error retrive labels use given name",
			Sql:        c.Statement.SQL.String(),
			StackTrace: errors.GetStackTrace(),
			InnerError: c.Error,
		}
	}
	return result, nil
}
