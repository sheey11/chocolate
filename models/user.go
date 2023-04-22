package models

import (
	"errors"
	"fmt"
	"math/rand"
	"time"

	"github.com/samber/lo"
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
	Password     string  `gorm:"type:varchar(256);not null" json:"-"`
	Salt         string  `gorm:"type:varchar(8);not null" json:"-"`
	MaxRoomCount uint    `gorm:"not null;default:0;" json:"max_room_count"`
	Rooms        []Room  `gorm:"foreignKey:owner_id;constraint:OnDelete:CASCADE"`
}

func CountAdmins(tx *gorm.DB) (uint, cerrors.ChocolateError) {
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

func AddAdminAccount(user *User) cerrors.ChocolateError {
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

	if tx.Commit().Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseCreateAdminAccountError,
			Message:    "error on commiting changes while creating admin account",
			Sql:        tx.Statement.SQL.String(),
			InnerError: tx.Error,
			StackTrace: cerrors.GetStackTrace(),
		}
	}
	return nil
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

func GetUserByName(username string, tx *gorm.DB) (*User, cerrors.ChocolateError) {
	if tx == nil {
		tx = db
	}

	user := User{}
	c := tx.Joins("Role").Preload("Labels").Preload("Rooms").First(&user, "Username = ?", username)
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
	tx := db.Joins("Role").Preload("Labels").Preload("Rooms").First(&user, id)
	if tx.Error != nil {
		return nil
	}
	return &user
}

func (u *User) SummaryRooms(includePermType bool) []map[string]interface{} {
	if u.Rooms == nil {
		logrus.Fatalf("no room preloaded")
	}
	result := make([]map[string]interface{}, len(u.Rooms))
	for i, room := range u.Rooms {
		result[i] = map[string]interface{}{
			"id":      room.ID,
			"uid":     room.UID,
			"title":   room.Title,
			"status":  room.Status.ToString(),
			"viewers": room.Viewers,
		}
		if includePermType {
			if room.PermissionItems == nil || len(room.PermissionItems) == 0 {
				room.LoadPermissionItems()
			}
			result[i]["permission_type"] = room.PermissionType
		}
	}
	return result
}

func AddUsers(users []User, tx *gorm.DB) cerrors.ChocolateError {
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
func CheckUsernameTaken(usernames []string, tx *gorm.DB) ([]string, cerrors.ChocolateError) {
	if tx == nil {
		tx = db
	}

	var result []string
	c := db.Model(&User{}).Select("Username").Where("Username in ?", usernames).Find(&result)
	if c.Error != nil {
		err := cerrors.DatabaseError{
			ID:         cerrors.DatabaseLookupUsernamesError,
			InnerError: c.Error,
			Message:    "an cerrors.ChocolateError occured when lookup usernames",
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
		}
		return result, err
	}
	return result, nil
}

func DeleteUser(userid uint, tx *gorm.DB) cerrors.ChocolateError {
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
func UpdateUserPassword(username string, salt string, password string) cerrors.ChocolateError {
	c := db.Model(&User{}).Where("username = ?", username).Updates(map[string]interface{}{
		"salt":     salt,
		"password": password,
	})
	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseSetUserPasswordError,
			Message:    "set password error",
			InnerError: c.Error,
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
		}
	}
	return nil
}

func UpdateUserRole(username string, role string) cerrors.ChocolateError {
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
	} else if c.RowsAffected == 0 {
		return cerrors.RequestError{
			ID:      cerrors.RequestUserNotFound,
			Message: "user not found",
		}
	}
	return nil
}

func (u *User) GetAfflicateRoomCount() (uint, cerrors.ChocolateError) {
	var result int64
	c := db.Model(&Room{}).Where("owner_id = ?", u.ID).Count(&result)
	if c.Error != nil {
		return 0, cerrors.DatabaseError{
			ID:         cerrors.DatabaseClearRoomPermissionItemError,
			Message:    "error when counting room",
			InnerError: c.Error,
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"user_id": u.ID,
			},
		}
	}
	return uint(result), nil
}

func AddLabelToUser(username, label string) cerrors.ChocolateError {
	labelObj := Label{}
	db.Where("name = ?", label).First(&labelObj)
	if labelObj.Name != label {
		labelObj = Label{
			Name: label,
		}
		c := db.Create(&labelObj)
		if c.Error != nil {
			return cerrors.DatabaseError{
				ID:         cerrors.DatabaseCreateLabelError,
				Message:    "error creating new label",
				InnerError: c.Error,
				Sql:        c.Statement.SQL.String(),
				StackTrace: cerrors.GetStackTrace(),
			}
		}
	}

	user, err := GetUserByName(username, nil)
	if err != nil {
		return err
	}

	record := map[string]interface{}{
		"label_name": label,
		"user_id":    user.ID,
	}

	var cnt int64
	c := db.Table("user_labels").Where(record).Count(&cnt)
	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseClearRoomPermissionItemError,
			Message:    "error querying exsiting user-label record",
			InnerError: c.Error,
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
		}
	} else if cnt != 0 {
		return cerrors.RequestError{
			ID:      cerrors.RequestLabelExists,
			Message: "label exists on user",
		}
	}

	c = db.Table("user_labels").Create(record)
	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseCreateUserLabelError,
			Message:    "error creating user-label record",
			InnerError: c.Error,
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
		}
	}

	return nil
}

func DeleteUserLabel(username, label string) cerrors.ChocolateError {
	user, err := GetUserByName(username, nil)
	if err != nil {
		return err
	}

	record := map[string]interface{}{
		"label_name": label,
		"user_id":    user.ID,
	}

	c := db.Table("user_labels").Where(record).Delete(nil)
	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseCreateUserLabelError,
			Message:    "error creating user-label record",
			InnerError: c.Error,
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
		}
	} else if c.RowsAffected == 0 {
		return cerrors.RequestError{
			ID:      cerrors.RequestUserNotHaveLabel,
			Message: "user do not have that label",
		}
	}
	return nil
}

func ModifyUserMaxRoom(username string, maxRooms uint) cerrors.ChocolateError {
	c := db.Model(&User{}).Where("username = ?", username).Update("max_room_count", maxRooms)
	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseClearRoomPermissionItemError,
			Message:    "error updating user's max_room_count",
			InnerError: c.Error,
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
		}
	} else if c.RowsAffected == 0 {
		return cerrors.RequestError{
			ID:      cerrors.RequestUserNotFound,
			Message: "user not found",
		}
	}
	return nil
}

// including labesl
func ListUsers(filterRole *Role, filterId *uint, filterName *string, limit uint, page uint) (uint, []*User, cerrors.ChocolateError) {
	statement := db.Model(&User{}).Limit(int(limit)).Offset(int((page - 1) * limit))
	if filterRole != nil {
		statement = statement.Where("role_name = ?", filterRole.Name)
	}
	if filterName != nil {
		statement = statement.Where("username like ?", fmt.Sprintf("%%%s%%", *filterName))
	}
	if filterId != nil {
		statement = db.Raw(
			"? UNION ?",
			db.Model(&User{}).Where("id = ?", *filterId),
			statement,
		)
	}

	var count int64
	c := db.Table("(?) as foo", statement).Select("COUNT(*)").Scan(&count)
	if c.Error != nil {
		return 0, nil, cerrors.DatabaseError{
			ID:         cerrors.DatabaseListAccountsError,
			Message:    "error on counting qualified users",
			InnerError: c.Error,
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"role_filter": lo.If(filterRole == nil, "nil").ElseF(func() string { return filterRole.Name }),
				"id_filter":   filterId,
				"name_filter": filterName,
			},
		}
	}

	var result []*User
	c = statement.Preload("Labels").Find(&result)
	if c.Error != nil {
		return 0, nil, cerrors.DatabaseError{
			ID:         cerrors.DatabaseListAccountsError,
			Message:    "error on listing users",
			InnerError: c.Error,
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"role_filter": lo.If(filterRole == nil, "nil").ElseF(func() string { return filterRole.Name }),
				"id_filter":   filterId,
				"name_filter": filterName,
			},
		}
	}
	return uint(count), result, nil
}

func GetUsersNum() uint {
	var count int64
	db.Model(&User{}).Count(&count)
	return uint(count)
}

func ChangeUserPassword(user *User, _new string, salt string, logout bool, session *Session) cerrors.ChocolateError {
	tx := db.Begin()
	defer tx.Rollback()

	c := tx.
		Model(&User{}).
		Where("id = ?", user.ID).
		Updates(map[string]interface{}{
			"password": _new,
			"salt":     salt,
		})

	if c.Error != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseUpdateUserPasswordError,
			Message:    "error while updating user password",
			Sql:        c.Statement.SQL.String(),
			StackTrace: cerrors.GetStackTrace(),
			InnerError: c.Error,
		}
	}

	if logout {
		c := tx.Model(&Session{}).
			Where("id <> ?", session.ID).
			Where("user_id = ?", user.ID).
			Update("valid_until", time.Now().Add(-1*time.Hour))
		if c.Error != nil {
			return cerrors.DatabaseError{
				ID:         cerrors.DatabaseInvalidateSessionError,
				Message:    "error while updating sessions",
				Sql:        c.Statement.SQL.String(),
				StackTrace: cerrors.GetStackTrace(),
				InnerError: c.Error,
			}
		}
	}

	if err := tx.Commit().Error; err != nil {
		return cerrors.DatabaseError{
			ID:         cerrors.DatabaseCommitTransactionError,
			Message:    "error while updating sessions",
			StackTrace: cerrors.GetStackTrace(),
			InnerError: err,
		}
	}
	return nil
}
