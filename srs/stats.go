package srs

import (
	"encoding/json"
	"errors"
)

type dataProbe struct {
	Data json.RawMessage `json:"data"`
}

type statTypes interface {
	Version | Summaries | MemInfo | Features | VHosts | Streams | Clients
}

func getStatsContainedInData[T Version | Summaries | MemInfo | Features](url string, i *T) (*T, error) {
	body, err := get(apiCollection.versionUrl)
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

func getStats[T VHosts | Streams | Clients](url string, i *T) (*T, error) {
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
	v, err := getStatsContainedInData(apiCollection.versionUrl, v)
	return v, err
}

func GetSummaries() (*Summaries, error) {
	v := &Summaries{}
	return getStatsContainedInData(apiCollection.summaryUrl, v)
}

func GetMeminfo() (*MemInfo, error) {
	v := &MemInfo{}
	return getStatsContainedInData(apiCollection.memInfoUrl, v)
}

func GetFeatures() (*Features, error) {
	v := &Features{}
	return getStatsContainedInData(apiCollection.featuresUrl, v)
}

func GetVHosts() (*VHosts, error) {
	v := &VHosts{}
	return getStats(apiCollection.vhostsUrl, v)
}

func GetStreams() (*Streams, error) {
	v := &Streams{}
	return getStats(apiCollection.streamsUrl, v)
}

func GetClients() (*Clients, error) {
	v := &Clients{}
	return getStats(apiCollection.clientsUrl, v)
}
