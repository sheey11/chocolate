package service

import (
	"crypto/sha1"
	"encoding/hex"
	"fmt"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/samber/lo"
	"github.com/sheey11/chocolate/common"
	cerrors "github.com/sheey11/chocolate/errors"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"

	"github.com/sheey11/chocolate/models"
)

func HasAdminAccount() (bool, cerrors.ChocolateError) {
	count, err := models.CountAdmins(nil)
	if err != nil {
		return true, err
	}
	return count != 0, nil
}

func CreateAdminAccount(username, password string) cerrors.ChocolateError {
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
func CreateUserAccounts(users []UserCreationInfo) cerrors.ChocolateError {
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
		return cerrors.RequestError{
			ID:      cerrors.RequestUsernameTaken,
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

		return cerrors.RequestError{
			ID:      cerrors.ReuqestRoleNotFound,
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
			Salt:     salt,
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

func authenticate(username string, password string) (*models.User, cerrors.ChocolateError) {
	user, err := models.GetUserByName(username, nil)
	if err != nil {
		return nil, err
	}
	password = encryptPassword(password, user.Salt)
	if password == user.Password {
		return user, nil
	} else {
		return nil, cerrors.RequestError{
			ID:      cerrors.RequestPasswordIncorrect,
			Message: "incorrect password",
		}
	}
}

func TryLogin(username, password, ip, ua string) (*models.User, *models.Session, cerrors.ChocolateError) {
	user, err := authenticate(username, password)
	if err != nil {
		return nil, nil, err
	}

	session, err := models.GenerateSessionForUser(user, ip, ua)
	return user, session, err
}

func TryGetUserFromContext(c *gin.Context) *models.User {
	auth := c.GetHeader("Authorization")
	if len(auth) <= 8 {
		return nil
	}
	jwt := auth[7:]
	payload, err := common.DecryptJwt(jwt)
	if err != nil {
		return nil
	}

	return models.GetUserByID(payload.User)
}

func GetUserFromToken(token string) *models.User {
	payload, err := common.DecryptJwt(token)
	if err != nil {
		return nil
	}

	return models.GetUserByID(payload.User)
}

// only call this method **after** verified the jwt,
// otherwise, use TryGetUserFromContext.
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

func UsernameFitConstraint(username string) cerrors.ChocolateError {
	usernameDict := "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-"
	if len(username) < 6 || len(username) > 16 {
		err := cerrors.RequestError{
			ID:      cerrors.RequestUsernameNotMeetConstraint,
			Message: "username should be at least 6 charactors and less than 16",
			Context: map[string]interface{}{
				"username": username,
			},
		}
		return err
	} else if !stringFitDict(username, usernameDict) {
		err := cerrors.RequestError{
			ID:      cerrors.RequestUsernameNotMeetConstraint,
			Message: "username should only contain numbers, alphabet letters, '_' and '-'",
			Context: map[string]interface{}{
				"username": username,
			},
		}
		return err
	}
	return nil
}

func PasswordFitConstraint(password string) cerrors.ChocolateError {
	passwordDict := "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-~!@#$%^&*()_+=`[]{}\\|;:'\",.<>/?"
	if len(password) < 8 || len(password) > 64 {
		err := cerrors.RequestError{
			ID:      cerrors.RequestPasswordNotMeetConstraint,
			Message: "password should be at least 8 charactors and less than 64.",
			Context: map[string]interface{}{
				"password": password,
			},
		}
		return err
	} else if !stringFitDict(password, passwordDict) {
		err := cerrors.RequestError{
			ID:      cerrors.RequestPasswordNotMeetConstraint,
			Message: "password should only contain numbers, alphabet letters and symbols",
			Context: map[string]interface{}{
				"password": password,
			},
		}
		return err
	}
	return nil
}

func CheckUsernameTaken(usernames []string, tx *gorm.DB) ([]string, cerrors.ChocolateError) {
	return models.CheckUsernameTaken(usernames, tx)
}

func DeleteUser(username string) cerrors.ChocolateError {
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

func UpdatePassword(username string, password string) cerrors.ChocolateError {
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

func UpdateRole(username string, roleName string) cerrors.ChocolateError {
	role, _ := models.GetRoleByName(roleName)
	if role == nil {
		return cerrors.RequestError{
			ID:      cerrors.ReuqestRoleNotFound,
			Message: "no such role",
		}
	}
	return models.UpdateUserRole(username, roleName)
}

func AddLabelToUser(username string, label string) cerrors.ChocolateError {
	return models.AddLabelToUser(username, label)
}

func DeleteUserLabel(username string, label string) cerrors.ChocolateError {
	return models.DeleteUserLabel(username, label)
}

func ModifyUserMaxRoom(username string, count uint) cerrors.ChocolateError {
	return models.ModifyUserMaxRoom(username, count)
}

func ListUsers(search string, roleSearch string, limit uint, page uint) ([]*models.User, cerrors.ChocolateError) {
	var role *models.Role
	if roleSearch != "" {
		role, _ = GetRoleByName(roleSearch)
	}

	var filterId *uint = nil
	var filterName *string = nil
	if search != "" {
		filterName = &search
		id, err := strconv.Atoi(search)
		if err == nil && id > 0 {
			uId := uint(id)
			filterId = &uId
		}
	}

	return models.ListUsers(role, filterId, filterName, limit, page)
}

func GetUserByUsername(username string) (*models.User, cerrors.ChocolateError) {
	return GetUserByUsername(username)
}
