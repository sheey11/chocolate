package srs

import (
	"encoding/json"
	"errors"
	"strings"

	"github.com/sheey11/chocolate/common"
	"github.com/sirupsen/logrus"
)

func init() {
	common.HookPostConfigLoad(func(cfg *common.ChocolateConfig) {
		if cfg.Srs.ApiAddr == "" || cfg.Srs.RtmpAddr == "" || cfg.Srs.HlsAddr == "" {
			logrus.Fatalf("invalid config file, missing srs addrs")
		}
		if err := setAddressAndCheck(cfg.Srs.ApiAddr); err != nil {
			logrus.Fatalf("cannot connect to srs api, check your config file")
		} else {
			if cfg.Srs.Stats.CacheNumber == 0 {
				logrus.Fatalf("invalid srs cache numver")
			} else if cfg.Srs.Stats.CollectInterval < 10 {
				logrus.Fatalf("srs collect interval is too short")
			}
			initMetricsCollector(cfg.Srs.Stats.CacheNumber, cfg.Srs.Stats.CollectInterval)
		}
	})
}

var srsApiAddr string = ""

func composeUrl(base string, path string) string {
	if strings.HasSuffix(base, "/") {
		base = base[:len(base)-1]
	}
	if !strings.HasPrefix(base, "http://") {
		base = "http://" + base
	}

	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}
	return base + path
}

// using struct is good than using list of vars,
// struct will be aligned when assigning values.
type api struct {
	versionUrl   string
	summaryUrl   string
	rusageUrl    string
	procStatsUrl string
	sysStatsUrl  string
	memInfoUrl   string
	featuresUrl  string
	requestsUrl  string
	vhostsUrl    string
	streamsUrl   string
	clientsUrl   string
	clustersUrl  string
	perfStatUrl  string
}

var apiCollection api

func isResponseOk(body []byte) bool {
	var tester struct {
		Code uint `json:"code"`
	}
	tester.Code = 42
	err := json.Unmarshal(body, &tester)
	if err != nil {
		return false
	}
	return tester.Code == 0
}

func setAddressAndCheck(addr string) error {
	versionUrl := composeUrl(addr, "/api/v1/versions")
	jobj, err := get(versionUrl)
	if err != nil {
		logrus.WithError(err).Errorf("srs test failed")
		return errors.New("errors on connecting srs api server")
	}
	if !isResponseOk(jobj) {
		return errors.New("the server did not reponds ok when testing connectivity to the srs server")
	}

	apiCollection = api{
		versionUrl:   composeUrl(addr, "/api/v1/versions"),
		summaryUrl:   composeUrl(addr, "/api/v1/summaries"),
		rusageUrl:    composeUrl(addr, "/api/v1/rusages"),
		procStatsUrl: composeUrl(addr, "/api/v1/self_proc_stats"),
		sysStatsUrl:  composeUrl(addr, "/api/v1/system_proc_stats"),
		memInfoUrl:   composeUrl(addr, "/api/v1/meminfos"),
		featuresUrl:  composeUrl(addr, "/api/v1/features"),
		requestsUrl:  composeUrl(addr, "/api/v1/requests"),
		vhostsUrl:    composeUrl(addr, "/api/v1/vhosts"),
		streamsUrl:   composeUrl(addr, "/api/v1/streams"),
		clientsUrl:   composeUrl(addr, "/api/v1/clients"),
		clustersUrl:  composeUrl(addr, "/api/v1/clusters"),
		perfStatUrl:  composeUrl(addr, "/api/v1/perf"),
	}

	return nil
}
