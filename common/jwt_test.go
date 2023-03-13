package common

import (
	"testing"
	"time"
)

func assert[T comparable](exp T, v T, fieldName string, t *testing.T) {
	if exp != v {
		t.Fatalf("%s not match, expect %v, got %v", fieldName, exp, v)
	}
}

func TestJwt(t *testing.T) {
	payload := JwtPayload{
		Session:       213,
		SessionExpire: uint32(time.Now().Add(time.Hour * 24).Unix()),
		User:          123,
		Username:      "one last kiss",
	}
	jwt := CreateJwt(payload)
	payloadDecrypted, err := DecryptJwt(jwt)
	if err != nil {
		t.Log(err)
		t.Fatalf("failed to decrypt jwt")
	}
	assert(payload.Session, payloadDecrypted.Session, "Session", t)
	assert(payload.SessionExpire, payloadDecrypted.SessionExpire, "SessionExpire", t)
	assert(payload.User, payloadDecrypted.User, "User", t)
	assert(payload.Username, payloadDecrypted.Username, "Username", t)
}
