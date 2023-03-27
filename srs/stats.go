package srs

import (
	"encoding/json"
	"errors"
	"time"
)

type dataProbe struct {
	Data json.RawMessage `json:"data"`
}

type statTypes interface {
	*Version | *Summaries | *MemInfo | *Features | *VHosts | *Streams | *Clients
	SetSampleTime(time.Time)
}

// funcs in this package is extremly confusion,
// all function start with an underscroe is a
// helper function.
func _getStatsContainedInData[T Version | Summaries | MemInfo | Features](url string, i *T) (*T, error) {
	body, err := get(url)
	if err != nil {
		return i, errors.Join(errors.New("unable to retrive server info"), err)
	}
	err = json.Unmarshal(body, i)
	if err != nil {
		return i, errors.Join(errors.New("unable to unmarshal ServerInfo"), err)
	}

	dataProber := dataProbe{}
	err = json.Unmarshal(body, &dataProber)
	if err != nil {
		return i, errors.Join(errors.New("unable to unmarshal dataProber"), err)
	}

	err = json.Unmarshal(dataProber.Data, i)
	if err != nil {
		return i, errors.Join(errors.New("unable to unmarshal data"), err)
	}
	return i, nil
}

func _getStats[T VHosts | Streams | Clients](url string, i *T) (*T, error) {
	body, err := get(apiCollection.versionUrl)
	if err != nil {
		return i, errors.Join(errors.New("unable to retrive server info"), err)
	}
	err = json.Unmarshal(body, i)
	if err != nil {
		return i, errors.Join(errors.New("unable to unmarshal ServerInfo"), err)
	}
	return i, nil
}

func GetVersion() (*Version, error) {
	v := &Version{}
	v, err := _getStatsContainedInData(apiCollection.versionUrl, v)
	return v, err
}

func getSummaries() (*Summaries, error) {
	v := &Summaries{}
	return _getStatsContainedInData(apiCollection.summaryUrl, v)
}

func getMeminfo() (*MemInfo, error) {
	v := &MemInfo{}
	return _getStatsContainedInData(apiCollection.memInfoUrl, v)
}

func getFeatures() (*Features, error) {
	v := &Features{}
	return _getStatsContainedInData(apiCollection.featuresUrl, v)
}

func getVHosts() (*VHosts, error) {
	v := &VHosts{}
	return _getStats(apiCollection.vhostsUrl, v)
}

func getStreams() (*Streams, error) {
	v := &Streams{}
	return _getStats(apiCollection.streamsUrl, v)
}

func getClients() (*Clients, error) {
	v := &Clients{}
	return _getStats(apiCollection.clientsUrl, v)
}
