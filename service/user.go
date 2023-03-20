package service

import (
	"crypto/sha1"
	"encoding/hex"
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/samber/lo"
	"github.com/sheey11/chocolate/common"
	"github.com/sheey11/chocolate/errors"
	cerrors "github.com/sheey11/chocolate/errors"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"

	"github.com/sheey11/chocolate/models"
)

func HasAdminAccount() (bool, error) {
	count, err := models.CountAdmins(nil)
	if err != nil {
		return true, err
	}
	return count != 0, nil
}

func CreateAdminAccount(username, password string) error {
	salt := models.GenSalt()
	password = encryptPassword(password, salt)
	account := &models.User{
		RoleName: models.AdministratorRoleName,
		Username: username,
		Password: password,
		Salt:     salt,
	}
	return models.AddAdminAccount(account)
}

func encryptPassword(raw, salt string) string {
	hash1 := sha1.New().Sum([]byte(raw))

	hash2 := make([]byte, len(hash1))
	var j = 0
	for i := 0; i < len(hash1); i++ {
		hash2[i] = hash1[i] ^ salt[j]
		j++
		j = j % len(salt)
	}

	hash3 := sha1.New().Sum(hash2)
	return hex.EncodeToString(hash3)
}

type UserCreationInfo struct {
	Username string   `json:"username"`
	Password string   `json:"password"`
	Role     string   `json:"role"`
	Labels   []string `json:"labels"`
}

// Add new users using given list. The user
// object should contains these fields:
//   - `Username`
//   - `Password`
//
// Optional fields are:
//   - `Role`:   will be default to `user`.
//     **Note** The `Role` with name `user` must exists.
//   - `Labels`: will be an empty set
//
// **Note**: Check constaints before call this func.
//
// Salts will be generated automatically, and
// encrypted password will replace the original
// pasword field.
func CreateUserAccounts(users []UserCreationInfo) error {
	usernames := make([]string, len(users))
	roles := make(map[string]uint8, len(users))

	for i, user := range users {
		if err := UsernameFitConstraint(user.Username); err != nil {
			return err
		}
		if err := PasswordFitConstraint(user.Password); err != nil {
			return err
		}
		if lo.Contains(usernames, user.Username) {
			return cerrors.RequestError{
				ID:      cerrors.RequestUsernameDuplicate,
				Message: fmt.Sprintf("username %v already used", user.Username),
				Context: map[string]interface{}{
					"username": user.Username,
				},
			}
		}
		usernames[i] = user.Username
		roles[user.Role] = 0
	}

	tx := models.Begin()
	defer tx.Rollback()

	takenUsernames, err := CheckUsernameTaken(usernames, tx)
	if err != nil {
		return err
	} else if len(takenUsernames) != 0 {
		return errors.RequestError{
			ID:      errors.RequestUsernameTaken,
			Message: "usernames have been taken",
			Context: map[string]interface{}{
				"usernames": takenUsernames,
			},
		}
	}

	// checking roles exists
	roleNames := lo.Keys(roles)
	existRoles, err := models.CheckRoleExists(roleNames, tx)
	if err != nil {
		return err
	} else if len(existRoles) != len(roles) {
		for _, k := range existRoles {
			roles[k] = 1
		}
		notExistRoles := make([]string, len(roles)-len(existRoles))
		i := 0
		for k, v := range roles {
			if v == 1 {
				continue
			}
			notExistRoles[i] = k
			i++
		}

		return errors.RequestError{
			ID:      errors.ReuqestRoleNotFound,
			Message: "roles not found",
			Context: map[string]interface{}{
				"roles": notExistRoles,
			},
		}
	}

	userModels := make([]models.User, len(users))
	for i, userinfo := range users {
		salt := models.GenSalt()
		password := encryptPassword(userinfo.Password, salt)
		user := models.User{
			Username: userinfo.Username,
			Password: password,
			RoleName: userinfo.Role,
			Labels:   lo.Map(userinfo.Labels, func(l string, _ int) models.Label { return models.Label{Name: l} }),
		}
		userModels[i] = user
	}

	if err := models.AddUsers(userModels, tx); err != nil {
		return err
	}

	tx.Commit()
	return nil
}

func authenticate(username string, password string) (*models.User, error) {
	user, err := models.GetUserByName(username, nil)
	if err != nil {
		return nil, err
	}
	password = encryptPassword(password, user.Salt)
	if password == user.Password {
		return user, nil
	} else {
		return nil, errors.RequestError{
			ID:      errors.RequestPasswordIncorrect,
			Message: "incorrect password",
		}
	}
}

func TryLogin(username, password, ip, ua string) (*models.User, *models.Session, error) {
	user, err := authenticate(username, password)
	if err != nil {
		return nil, nil, err
	}

	session, err := models.GenerateSessionForUser(user, ip, ua)
	return user, session, err
}

// only call this method **after** verified the jwt.
func GetUserFromContext(c *gin.Context) *models.User {
	auth := c.GetHeader("Authorization")
	if len(auth) <= 8 {
		logrus.
			WithField("url", c.Request.URL).
			Errorf("a handler precessing non-authorized request have called GetUserFromContext method, check your code.")
		return nil
	}
	jwt := auth[7:]
	payload, err := common.DecryptJwt(jwt)
	if err != nil {
		logrus.
			WithError(err).
			WithField("url", c.Request.URL).
			Errorf("a handler precessing non-authorized request have called GetUserFromContext method, check your code.")
		return nil
	}

	return models.GetUserByID(payload.User)
}

func stringFitDict(str, dict string) bool {
	for _, c := range str {
		if !strings.Contains(dict, string(c)) {
			return false
		}
	}
	return true
}

func UsernameFitConstraint(username string) *errors.RequestError {
	usernameDict := "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-"
	if len(username) < 6 || len(username) > 16 {
		err := errors.RequestError{
			ID:      errors.RequestUsernameNotMeetConstraint,
			Message: "username should be at least 6 charactors and less than 16",
			Context: map[string]interface{}{
				"username": username,
			},
		}
		return &err
	} else if !stringFitDict(username, usernameDict) {
		err := errors.RequestError{
			ID:      errors.RequestUsernameNotMeetConstraint,
			Message: "username should only contain numbers, alphabet letters, '_' and '-'",
			Context: map[string]interface{}{
				"username": username,
			},
		}
		return &err
	}
	return nil
}

func PasswordFitConstraint(password string) *errors.RequestError {
	passwordDict := "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-~!@#$%^&*()_+=`[]{}\\|;:'\",.<>/?"
	if len(password) < 8 || len(password) > 64 {
		err := errors.RequestError{
			ID:      errors.RequestPasswordNotMeetConstraint,
			Message: "password should be at least 6 charactors and less than 64.",
			Context: map[string]interface{}{
				"password": password,
			},
		}
		return &err
	} else if !stringFitDict(password, passwordDict) {
		err := errors.RequestError{
			ID:      errors.RequestPasswordNotMeetConstraint,
			Message: "password should only contain numbers, alphabet letters and symbols",
			Context: map[string]interface{}{
				"password": password,
			},
		}
		return &err
	}
	return nil
}

func CheckUsernameTaken(usernames []string, tx *gorm.DB) ([]string, error) {
	return models.CheckUsernameTaken(usernames, tx)
}

func DeleteUser(username string) error {
	tx := models.Begin()
	defer tx.Rollback()

	user, err := models.GetUserByName(username, tx)
	if err != nil {
		return err
	}

	if user.RoleName == models.AdministratorRoleName {
		adminNum, err := models.CountAdmins(tx)
		if err != nil {
			return err
		}
		if adminNum <= 1 {
			return cerrors.RequestError{
				ID:      cerrors.RequestOneLastAdminDeletionNotAllowed,
				Message: "only one admins left, deletion not allowed",
			}
		}
	}

	err = models.DeleteUser(user.ID, tx)
	if err != nil {
		return err
	}
	tx.Commit()
	return nil
}

func UpdatePassword(username string, password string) error {
	if err := PasswordFitConstraint(password); err != nil {
		return err
	}

	user, _ := models.GetUserByName(username, nil)
	if user == nil {
		return cerrors.RequestError{
			ID:      cerrors.RequestUserNotFound,
			Message: "no such user has that username",
		}
	}
	salt := models.GenSalt()
	password = encryptPassword(password, salt)
	return models.UpdateUserPassword(username, salt, password)
}

func UpdateRole(username string, roleName string) error {
	role, _ := models.GetRoleByName(roleName)
	if role == nil {
		return cerrors.RequestError{
			ID:      cerrors.RequestUserNotFound,
			Message: "no such role",
		}
	}
	return models.UpdateUserRole(username, roleName)
}
