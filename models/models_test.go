package models

import (
	"errors"
	"fmt"
	"testing"

	"github.com/sheey11/chocolate/common"
)

func TestUsers(t *testing.T) {
	if err := Connect(common.GetConnStrFromEnv()); err != nil {
		panic(err)
	}

	roles := []string{"sheey", "tlynfer"}
	list, err := CheckUsernameTaken(roles, nil)
	if err != nil {
		panic(err.Error())
	}
	if len(list) != 1 {
		panic(errors.New(fmt.Sprintf("there should be only one role 'sheey' left in the list, actual list: %v", list)))
	}
	if list[0] != "sheey" {
		panic(errors.New(fmt.Sprintf("the left role name is not 'sheey', actual left: %v", list[0])))
	}
}

func TestRole(t *testing.T) {
	if err := Connect(common.GetConnStrFromEnv()); err != nil {
		panic(err)
	}

	roles := []string{"administrator", "abcdefg"}
	list, err := CheckRoleExists(roles, nil)
	if err != nil {
		panic(err.Error())
	}
	if len(list) != 1 {
		panic(errors.New(fmt.Sprintf("there should be only one role 'administrator' left in the list, actual list: %v", list)))
	}
	if list[0] != "administrator" {
		panic(errors.New(fmt.Sprintf("the left role name is not 'administrator', actual left: %v", list[0])))
	}
}
