package common

import (
	"crypto/ed25519"
	"io/ioutil"
	"os"

	"github.com/sirupsen/logrus"
	"gopkg.in/yaml.v2"
)

type ChocolateConfig struct {
	Jwt struct {
		Key struct {
			Public  string
			Private string
		}
		ExpirationDays int `yaml:"expiration-days"`
	}
	Srs struct {
		ApiAddr  string `yaml:"api-addr"`
		RtmpAddr string `yaml:"rtmp-addr"`
		HlsAddr  string `yaml:"hls-addr"`
		Stats    struct {
			CacheNumber     uint `yaml:"cache-num"`
			CollectInterval uint `yaml:"collect-interval"`
		}
	}
}

var DEBUG bool
var Config ChocolateConfig

var (
	pubKey  *ed25519.PublicKey
	privKey *ed25519.PrivateKey
)

func LoadConfig(filepath string) {
	invokePreConfigHooks()
	loadConfig(filepath)
	invokePostConfigHooks()
}

func loadConfig(filepath string) {
	buf, err := ioutil.ReadFile(filepath)
	if err != nil {
		logrus.WithField("error", err).Fatal("open config file failed.")
		os.Exit(1)
	}

	err = yaml.Unmarshal(buf, &Config)
	if err != nil {
		logrus.WithField("error", err).Fatal("reading config file failed.")
		os.Exit(1)
	}

	logrus.Info("config loaded.")
	pubKey, privKey = readJwtKey()
}
