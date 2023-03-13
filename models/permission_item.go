package models

import "gorm.io/gorm"

type PermissionItem struct {
	gorm.Model
	SubjectType      uint8 `gorm:"not null";` // 0 for user; 1 for label
	SubjectLabel     Label
	SubjectLabelName string
	SubjectUser      User
	SubjectUserID    uint
}
