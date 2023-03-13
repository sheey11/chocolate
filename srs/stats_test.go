package srs

import (
	"encoding/json"
	"fmt"
	"testing"
)

func TestVersion(t *testing.T) {
	err := setAddressAndCheck("172.29.16.1:1985")
	if err != nil {
		t.Fatal(err)
	}

	v, err := GetVersion()
	if err != nil {
		t.Fatal(err)
	}

	if v.ResponseCode != 0 {
		t.Fatal("server responsed an error")
	}

	bytes, _ := json.Marshal(v)
	str := string(bytes)
	fmt.Printf("%v\n", str)
}
