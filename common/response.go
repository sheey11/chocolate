package common

import "github.com/sheey11/chocolate/errors"

type Response map[string]interface{}

// SampleResponse create a Response with
// given code and message.
func SampleResponse(code errors.RequestErrorCode, message string) Response {
	return Response{
		"code":    code,
		"message": message,
	}
}

var OkResponse = Response{
	"code":    0,
	"message": "ok",
}
