package models

type PermissionSubjectType string

const (
	PermissionSubjectTypeLabel PermissionSubjectType = "label"
	PermissionSubjectTypeUser  PermissionSubjectType = "user"
)

type PermissionItem struct {
	ID               uint                  `gorm:"primaryKey;uniqueIndex:idx_label;uniqueIndex:idx_user"`
	RoomID           uint                  `gorm:"index;not null"`
	SubjectType      PermissionSubjectType `gorm:"not null"`
	SubjectLabel     Label
	SubjectLabelName string `gorm:"uniqueIndex:idx_label"`
	SubjectUser      User
	SubjectUserID    uint `gorm:"uniqueIndex:idx_user"`
}
