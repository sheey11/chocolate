package common

import (
	"crypto/ed25519"
	"crypto/rand"
	"crypto/x509"
	"io/ioutil"
	"os"
	"path/filepath"
	"reflect"
	"time"

	"github.com/lestrrat-go/jwx/jwa"
	"github.com/lestrrat-go/jwx/jwt"
	"github.com/sheey11/chocolate/errors"
	"github.com/sirupsen/logrus"
)

var jwtKeysFallbackDirectory = filepath.Join(os.Getenv("HOME"), "/.config/chocolate/jwt")

const pubKeyFallbackFilename = "ed25519.pub"
const privKeyFallbackFilename = "ed25519"

var pubKeyPath = filepath.Join(jwtKeysFallbackDirectory, pubKeyFallbackFilename)
var privKeyPath = filepath.Join(jwtKeysFallbackDirectory, privKeyFallbackFilename)

func keyExists() bool {
	if Config.Jwt.Key.Public == "" {
		Config.Jwt.Key.Public = pubKeyPath
	}
	if Config.Jwt.Key.Private == "" {
		Config.Jwt.Key.Private = privKeyPath
	}

	if _, err := os.Stat(Config.Jwt.Key.Private); err != nil {
		logrus.Warn("public key file not exist")
		return false
	}
	if _, err := os.Stat(Config.Jwt.Key.Private); err != nil {
		logrus.Warn("private key file not exist")
		return false
	}

	return true
}

func readJwtKey() (*ed25519.PublicKey, *ed25519.PrivateKey) {
	if !keyExists() {
		if err := os.MkdirAll(jwtKeysFallbackDirectory, 0755); err != nil {
			logrus.WithField("err", err).Fatalf("failed to create config folder at %v", jwtKeysFallbackDirectory)
		}
		publicKey, privateKey, err := ed25519.GenerateKey(rand.Reader)
		if err != nil {
			logrus.WithField("err", err).Fatalf("failed to generate ed25519 key")
		}

		// save pub key
		if f, err := os.OpenFile(pubKeyPath, os.O_RDWR|os.O_CREATE, 0644); err == nil {
			bytes, err := x509.MarshalPKIXPublicKey(publicKey)
			if err != nil {
				logrus.WithField("err", err).Fatal("failed to marshal generated public key to bytes")
			}
			f.Write(bytes)
			f.Close()
		} else {
			logrus.WithField("err", err).Fatalf("cannot open path %v to write", pubKeyPath)
		}
		if f, err := os.OpenFile(privKeyPath, os.O_RDWR|os.O_CREATE, 0644); err == nil {
			bytes, err := x509.MarshalPKCS8PrivateKey(privateKey)
			if err != nil {
				logrus.WithField("err", err).Fatal("failed to marshal generated private key to bytes")
			}
			f.Write(bytes)
			f.Close()
		} else {
			logrus.WithField("err", err).Fatalf("cannot open path %v to write", privKeyPath)
		}

		logrus.Infof("generated ed25519 key at %v", jwtKeysFallbackDirectory)
		return &publicKey, &privateKey
	} else {
		var (
			publicKey  ed25519.PublicKey
			privateKey ed25519.PrivateKey
		)

		if f, err := os.Open(Config.Jwt.Key.Public); err == nil {
			bytes, err := ioutil.ReadAll(f)
			if err != nil {
				logrus.WithField("err", err).Fatalf("cannot open publicKey at %v to read", Config.Jwt.Key.Public)
			}
			_publicKey, err := x509.ParsePKIXPublicKey(bytes)
			if err != nil {
				logrus.WithField("err", err).Fatalf("cannot parse publicKey file")
			}
			if _parsedKey, ok := _publicKey.(ed25519.PublicKey); ok {
				publicKey = _parsedKey
			} else {
				logrus.Fatalf("publicKey is not a ed25519 key")
			}
		} else {
			logrus.WithField("err", err).Fatalf("cannot open publicKey at %v to read", Config.Jwt.Key.Public)
		}

		if f, err := os.Open(Config.Jwt.Key.Private); err == nil {
			bytes, err := ioutil.ReadAll(f)
			if err != nil {
				logrus.WithField("err", err).Fatalf("cannot open privateKey at %v to read", Config.Jwt.Key.Private)
			}
			_privateKey, err := x509.ParsePKCS8PrivateKey(bytes)
			if err != nil {
				logrus.WithField("err", err).Fatalf("cannot parse privateKey file")
			}
			if _parsedKey, ok := _privateKey.(ed25519.PrivateKey); ok {
				privateKey = _parsedKey
			} else {
				logrus.Fatalf("privateKey is not a ed25519 key")
			}
		} else {
			logrus.WithField("err", err).Fatalf("cannot open privateKey %v to read", Config.Jwt.Key.Public)
		}

		return &publicKey, &privateKey
	}
}

type JwtPayload struct {
	Session       uint
	SessionExpire uint32
	User          uint
	UserRole      string
	Username      string
}

func CreateJwt(payload JwtPayload) string {
	if privKey == nil {
		pubKey, privKey = readJwtKey()
	}
	token := jwt.New()

	token.Set(jwt.IssuerKey, `sheey`)
	token.Set(jwt.AudienceKey, `Chocolate user`)
	token.Set(jwt.IssuedAtKey, time.Now().Unix())
	token.Set(jwt.ExpirationKey, payload.SessionExpire)

	v := reflect.ValueOf(payload)
	t := v.Type()
	for i := 0; i < v.NumField(); i++ {
		field := t.Field(i).Name
		value := v.Field(i).Interface()
		token.Set(field, value)
	}

	jwtStr, err := jwt.Sign(token, jwa.EdDSA, *privKey)

	if err != nil {
		logrus.WithField("err", err).Panic("Error when creating jwt.")
	}

	return string(jwtStr)
}

func DecryptJwt(jwtStr string) (JwtPayload, error) {
	if pubKey == nil {
		pubKey, privKey = readJwtKey()
	}
	token, err := jwt.Parse(
		[]byte(jwtStr),
		jwt.WithVerify(jwa.EdDSA, *pubKey),
		jwt.WithValidate(true),
	)
	if err != nil {
		return JwtPayload{}, errors.RequestError{
			ID:         errors.RequestJwtVerificationFailed,
			Message:    "invalid token",
			InnerError: err,
		}
	}

	payload := JwtPayload{}
	v := reflect.ValueOf(&payload).Elem()
	t := v.Type()
	for i := 0; i < v.NumField(); i++ {
		field := t.Field(i)
		tokenValue, _ := token.Get(field.Name)
		value := reflect.ValueOf(tokenValue)
		if value.Type().Kind() == reflect.Float64 {
			value = value.Convert(field.Type)
		}
		v.Field(i).Set(value)
	}

	return payload, nil
}
