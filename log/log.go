package log

import (
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/rifflock/lfshook"
	log "github.com/sirupsen/logrus"
	prefixed "github.com/x-cray/logrus-prefixed-formatter"
	"gopkg.in/natefinch/lumberjack.v2"
)

var stdFormatter *prefixed.TextFormatter
var fileFormatter *log.JSONFormatter

var logDir = "/var/log/chocolate"

const fallbackLogDir = "logs"

func init() {
	stdFormatter = &prefixed.TextFormatter{
		FullTimestamp:   true,
		TimestampFormat: "2006-01-02.15:04:05.000000",
		ForceFormatting: true,
		ForceColors:     true,
	}
	fileFormatter = &log.JSONFormatter{}
	log.SetFormatter(stdFormatter)
}

func preflight_check() error {
	// checking log dir exists
	if _, err := os.Stat(logDir); os.IsNotExist(err) {
		err := os.Mkdir(logDir, 0755)
		return err
	}
	return nil
}

func SetupLogging(debug bool) {
	err := preflight_check()
	if err != nil {
		logDir = fallbackLogDir
		err = preflight_check()
		if err != nil {
			log.WithField("dir", logDir).Fatal("Failed to create log dir, you may want do this with privileges or manually create.")
		}
	}

	logFile := filepath.Join(logDir, "chocolate.log")
	log.Info("Log file at " + logFile)

	writer := &lumberjack.Logger{
		Filename:   logFile,
		MaxSize:    10,
		MaxBackups: 5,
		MaxAge:     28,
		Compress:   true,
	}
	lfHook := lfshook.NewHook(lfshook.WriterMap{
		log.DebugLevel: writer,
		log.InfoLevel:  writer,
		log.WarnLevel:  writer,
		log.ErrorLevel: writer,
		log.PanicLevel: writer,
		log.FatalLevel: writer,
	}, fileFormatter)
	log.AddHook(lfHook)
	log.SetOutput(os.Stdout)
	log.SetReportCaller(true)

	if debug {
		log.SetLevel(log.DebugLevel)
		gin.SetMode("debug")
	} else {
		log.SetLevel(log.InfoLevel)
		gin.SetMode("release")
	}
}
