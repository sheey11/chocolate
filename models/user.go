package models

import (
	"errors"
	"math/rand"

	cerrors "github.com/sheey11/chocolate/errors"
	"github.com/sirupsen/logrus"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Role         Role    `json:"-"`
	RoleName     string  `gorm:"not null;default:'user';"`
	Labels       []Label `gorm:"many2many:user_labels;foreiginKey:ID;joinForeignKey:user_id;References:Name;joinReferences:label_name;constraint:OnDelete:CASCADE"`
	Username     string  `gorm:"type:varchar(32);not null;uniqueIndex" json:"userneam"`
	Password     string  `gorm:"type:varchar(128);not null" json:"-"`
	Salt         string  `gorm:"type:varchar(8);not null" json:"-"`
	MaxRoomCount uint    `gorm:"not null;default:0;" json:"max_room_count"`
	Rooms        []Room  `gorm:"foreignKey:owner_id;constraint:OnDelete:CASCADE"`
}

func CountAdmins(tx *gorm.DB) (uint, error) {
	if tx == nil {
		tx = db
	}
	var count int64 = 0
	c := db.Find(&User{}, "role_name = ?", AdministratorRoleName).Count(&count)
	if c.Error != nil {
		return 0, cerrors.DatabaseError{
			ID:         cerrors.DatabaseCountAdminAccountError,
			Message:    "error count admin account",
			Sql:        c.Statement.SQL.String(),
			InnerError: c.Error,
			StackTrace: cerrors.GetStackTrace(),
		}
	}
	return uint(count), nil
}

func AddAdminAccount(user *User) error {
	user.RoleName = AdministratorRoleName
	tx := db.Begin()
	var count int64 = 0
	if tx.Find(&User{}, "role_name = ?", AdministratorRoleName).Count(&count); tx.Error != nil {
		err := cerrors.DatabaseError{
			ID:         cerrors.DatabaseCountAdminAccountError,
			Message:    "error on counting admin account",
			Sql:        tx.Statement.SQL.String(),
			InnerError: tx.Error,
			StackTrace: cerrors.GetStackTrace(),
		}
		tx.Rollback()
		return err
	} else if count != 0 {
		err := cerrors.RequestError{
			ID:      cerrors.RequestPermissionDenied,
			Message: "there exists admin accounts",
		}
		tx.Rollback()
		return err
	}

	if tx.Create(user); tx.Error != nil {
		err := cerrors.DatabaseError{
			ID:         cerrors.DatabaseCreateAdminAccountError,
			Message:    "error on creating admin account",
			Sql:        tx.Statement.SQL.String(),
			InnerError: tx.Error,
			StackTrace: cerrors.GetStackTrace(),
		}
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

func GenSalt() string {
	const dict = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890123456789012345678901234567890"
	salt := ""
	for i := 0; i < 8; i++ {
		randIndex := rand.Intn(len(dict))
		salt += string(dict[randIndex])
	}
	return salt
}

func GetUserByName(username string, tx *gorm.DB) (*User, error) {
	if tx == nil {
		tx = db
	}

	user := User{}
	c := tx.Joins("Role").Preload("Rooms").First(&user, "Username = ?", username)
	if c.Error != nil {
		if errors.Is(c.Error, gorm.ErrRecordNotFound) {
			return nil, cerrors.RequestError{
				ID:         cerrors.RequestUserNotFound,
				InnerError: c.Error,
				Message:    "user not exist",
			}
		} else {
			return nil, cerrors.DatabaseError{
				ID:         cerrors.DatabaseLookupUserError,
				Message:    "look up user error",
				InnerError: c.Error,
				Sql:        c.Statement.SQL.String(),
				StackTrace: cerrors.GetStackTrace(),
			}
		}
	}
	return &user, nil
}

func GetUserByID(id uint) *User {
	user := User{}
	tx := db.Joins("Role").Preload("Rooms").First(&user, id)
	if tx.Error != nil {
		return nil
	}
	return &user
}

func (u *User) SummaryRooms() []map[string]interface{} {
	if u.Rooms == nil {
		logrus.Fatalf("no room preloaded")
	}
	result := make([]map[string]interface{}, len(u.Rooms))
	for i, room := range u.Rooms {
		result[i] = map[string]interface{}{
			"id":    room.ID,
			"title": room.Title,
		}
	}
	return result
}

func AddUsers(users []User, tx *gorm.DB) error {
	if tx == nil {
		tx = db
	}

	c := tx.CreateInBatches(users, 1000)
	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseCreateUserAccountError,
			Message:    "error creating user in batch",
			InnerError: c.Error,
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
		}
	}
	return nil
}

// returns those username exists
func CheckUsernameTaken(usernames []string, tx *gorm.DB) ([]string, error) {
	if tx == nil {
		tx = db
	}

	var result []string
	c := db.Model(&User{}).Select("Username").Where("Username in ?", usernames).Find(&result)
	if c.Error != nil {
		err := cerrors.DatabaseError{
			ID:         cerrors.DatabaseLookupUsernamesError,
			InnerError: c.Error,
			Message:    "an error occured when lookup usernames",
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
		}
		return result, err
	}
	return result, nil
}

func DeleteUser(userid uint, tx *gorm.DB) error {
	if tx == nil {
		tx = db
	}

	c := tx.Delete(&User{}, userid)
	if c.Error != nil {
		if errors.Is(c.Error, gorm.ErrRecordNotFound) {
			return cerrors.RequestError{
				ID:      cerrors.RequestUserNotFound,
				Message: "user with such name not found",
			}
		} else {
			return cerrors.DatabaseError{
				ID:         cerrors.DatabaseDeleteUserError,
				Message:    "error when deleting user",
				InnerError: c.Error,
				Sql:        c.Statement.SQL.String(),
				StackTrace: cerrors.GetStackTrace(),
			}
		}
	}
	return nil
}
func UpdateUserPassword(username string, salt string, password string) error {
	c := db.Model(&User{}).Where("username = ?", username).Updates(map[string]interface{}{
		"salt":     salt,
		"password": password,
	})
	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseSetUserPasswordError,
			Message:    "set password error",
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
			InnerError: c.Error,
		}
	}
	return nil
}

func UpdateUserRole(username string, role string) error {
	c := db.Model(&User{}).Where("username = ?", username).Updates(map[string]interface{}{
		"role_name": role,
	})
	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseSetUserRoleError,
			Message:    "set role error",
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
			InnerError: c.Error,
		}
	}
	return nil
}

func (u *User) GetAfflicateRoomCount() (uint, error) {
	var result int64
	c := db.Model(&Room{}).Where("owner_id = ?", u.ID).Count(&result)
	if c.Error != nil {
		return 0, cerrors.DatabaseError{
			ID:         cerrors.DatabaseClearRoomPermissionItemError,
			Message:    "error when counting room",
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"user_id": u.ID,
			},
		}
	}
	return uint(result), nil
}
