package srs

import (
	"io/ioutil"
	"net/http"
	"time"
)

var httpClient http.Client

func init() {
	httpClient = http.Client{
		Timeout: 5 * time.Second,
	}
}

func get(url string) ([]byte, error) {
	response, err := httpClient.Get(url)
	if err != nil {
		return []byte{}, err
	}
	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return []byte{}, err
	}
	return body, nil
}
