package main

import (
	"fmt"
	"os"
	"runtime"

	"github.com/gin-gonic/gin"
	"github.com/sheey11/chocolate/common"
	"github.com/sheey11/chocolate/log"
	"github.com/sheey11/chocolate/middleware"
	"github.com/sheey11/chocolate/models"
	"github.com/sheey11/chocolate/routes"
	"github.com/sirupsen/logrus"
	flag "github.com/spf13/pflag"
)

var (
	BUILDVERSION = "v0.0.0"
	GOVERSION    = runtime.Version()
)

var flags struct {
	Verbose *bool
	Addr    *string
	Config  *string
	Migrate *bool
	Serve   *bool
	Version *bool
	Help    *bool
}

func checkArgs() {
	flags.Migrate = flag.BoolP("migrate", "m", false, "perform database initilization")
	flags.Serve = flag.BoolP("serve", "s", false, "start the server")
	flags.Version = flag.BoolP("version", "V", false, "print chocolate version")
	flags.Verbose = flag.BoolP("verbose", "v", false, "more verbose")
	flags.Addr = flag.StringP("listen", "l", "0.0.0.0:4090", "specify listening address")
	flags.Config = flag.StringP("config", "c", "config.yaml", "the config file path")
	flags.Help = flag.BoolP("help", "h", false, "show help infomation")

	flag.Parse()
}

var engine *gin.Engine

func startServer(addr string, connStr string) {
	err := models.Connect(connStr)
	if err != nil {
		logrus.WithError(err).Fatal("connect database failed")
	}

	engine = gin.New()
	engine.Use(gin.Recovery())
	engine.Use(middleware.Cors())
	engine.Use(middleware.Log())

	routes.Mount(engine)

	logrus.Infof("server is running at %v", addr)
	err = engine.Run(addr)
	if err != nil {
		logrus.WithError(err).Fatalf("server start failed.")
	}
}

func main() {
	defer func() {
		err := recover()
		if err != nil {
			logrus.Fatal(err)
		}
	}()

	checkArgs()

	if *flags.Help {
		fmt.Fprintf(os.Stderr, "Usage of chocolate:\n")
		fmt.Fprintf(os.Stderr, "  chocolate [-s] [-m] [-l addr]\n")
		fmt.Fprintf(os.Stderr, "Arguments:\n")
		flag.PrintDefaults()
		return
	}

	if *flags.Version {
		fmt.Fprintf(os.Stderr, "chocolate %s runtime %s", BUILDVERSION, GOVERSION)
		return
	}

	log.SetupLogging(*flags.Verbose)

	if *flags.Verbose {
		common.DEBUG = true
		logrus.SetLevel(logrus.DebugLevel)
	} else {
		common.DEBUG = false
		logrus.SetLevel(logrus.InfoLevel)
	}

	logrus.Info(fmt.Sprintf("BUILD: %s, GOVERSION: %s", BUILDVERSION, GOVERSION))

	if !*flags.Migrate && !*flags.Serve {
		logrus.Error("No action specified, exiting")
		return
	}

	common.LoadConfig(*flags.Config)
	connStr := common.GetConnStrFromEnv()
	if *flags.Migrate {
		err := models.Migrate(connStr)
		if err != nil {
			logrus.WithField("err", err).Fatalf("error on migrating database")
		}
		logrus.Infof("Migration complete")
	}

	if *flags.Serve {
		startServer(*flags.Addr, connStr)
	}
}
