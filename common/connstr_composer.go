package common

import (
	"fmt"
	"os"

	"github.com/sirupsen/logrus"
)

func GetEnvOrDefault(key, def string, log bool) string {
	v := os.Getenv(key)
	if v == "" {
		if log {
			fallbackValue := def
			if fallbackValue == "" {
				fallbackValue = "[empty]"
			}
			logrus.Warnf("Env %s is not set, fallback using %s.", key, fallbackValue)
		}
		return def
	} else {
		return v
	}
}

func ComposeConnStr(username, password, host, port string) string {
	return fmt.Sprintf("host=%s user=%s password=%s dbname=chocolate port=%s sslmode=disable TimeZone=Asia/Shanghai", host, username, password, port)
}

func GetConnStrFromEnv() string {
	username := GetEnvOrDefault("CHOCOLATE_DB_USERNAME", "root", true)
	password := GetEnvOrDefault("CHOCOLATE_DB_PASSWORD", "", true)
	host := GetEnvOrDefault("CHOCOLATE_DB_HOST", "127.0.0.1", true)
	port := GetEnvOrDefault("CHOCOLATE_DB_PORT", "5432", true)
	return ComposeConnStr(username, password, host, port)
}
