package errors

import (
	"fmt"
	"runtime"
)

type ChocolateError interface {
	Error() string
	// to use this method in correct way:
	//
	//  err := ...
	//  if rerr, ok := err.(cerrors.RequestError) {
	//    c.JSON(http.Status..., rerr.ToResponse())
	//  } else {
	//    logrus.WithError(err).Error("error detail...")
	//    c.Abort()
	//    c.JSON(http.StatusInternalServerError, err.ToResponse())
	//    return
	//  }
	ToResponse() map[string]interface{}
}

type ChocolateErrorConstraints interface {
	RequestError | LogicError | DatabaseError
}

type RequestErrorCode uint64
type LogicErrorCode uint64
type DatabaseErrorCode uint64

type ChocolateErrorCodeConstraints interface {
	RequestErrorCode | LogicErrorCode | DatabaseErrorCode
}

func GetStackTrace() string {
	st := ""
	i := 1

	for {
		pc, file, line, ok := runtime.Caller(i)
		if !ok {
			break
		}
		st += fmt.Sprintf("%s at %s line %d\n", runtime.FuncForPC(pc).Name(), file, line)
		i++
	}
	return st
}

// `RequestError` represents an error occurred
// caused by unparsable input, or invalid parameter
// given.
//
// `InnerError` may contain sensitive information,
// such as a `DatabaseError`, it should be dealed
// with careful.
//
// The `ID` field always start with 0x00
type RequestError struct {
	ID          RequestErrorCode
	Message     string
	Context     map[string]interface{}
	Explanation map[string]interface{}
	InnerError  error
}

func (e RequestError) ToResponse() map[string]interface{} {
	res := map[string]interface{}{
		"code":    e.ID,
		"message": e.GetLocalizedMessage("zh"),
	}
	if e.Explanation != nil {
		res["detail"] = e.Explanation
	}
	return res
}

func (e RequestError) Error() string {
	return fmt.Sprintf("Request error: id: %v, message: %v, inner: %v", e.ID, e.Message, e.InnerError)
}

func (e *RequestError) SetID(raw_id uint64) {
	if raw_id>>56 != 0 {
		panic("the id given already has a type")
	}
	e.ID = RequestErrorCode(raw_id)
}

func (e *RequestError) ResponseFriendly(lang string) map[string]interface{} {
	return map[string]interface{}{
		"code":    e.ID,
		"message": e.GetLocalizedMessage(lang),
	}
}

// `LogicError` represnets the unexpected error
// occurred during the process of the user
// (or database, srs, etc.) inputs.
//
// **NOTE** Those errors preditable should be
// catagorized as `RequestError`.
//
// The `ID` field always start with 0x01
type LogicError struct {
	ID         LogicErrorCode
	Message    string
	Context    map[string]interface{}
	InnerError error
	StackTrace string
}

func (e LogicError) Error() string {
	return fmt.Sprintf("Logic error: \nid: %v\nmessage: %v\ninner: %v\nstack trace:\n%vcontext: %v", e.ID, e.Message, e.InnerError, e.StackTrace, e.Context)
}

func (e *LogicError) SetID(raw_id uint64) {
	if raw_id>>56 != 0 {
		panic("the id given already has a type")
	}
	e.ID = LogicErrorCode(raw_id | (0x01 << 56))
}

func (e LogicError) ToResponse() map[string]interface{} {
	return map[string]interface{}{
		"code":    RequestInternalServerError,
		"message": "internal server error",
	}
}

// `DatabaseError` represents unexpected error
// occurred during a sql excution.
//
// **NOTE** Those errors preditable should be
// catagorized as `RequestError`.
//
// The `ID` field always start with 0x02
type DatabaseError struct {
	ID         DatabaseErrorCode
	Message    string
	Context    map[string]interface{}
	InnerError error
	Sql        string
	StackTrace string
}

func (e DatabaseError) Error() string {
	return fmt.Sprintf("Database error: id: %v, message: %v, inner: %v, sql: %v, stack trace:\n%v\ncontext: %v", e.ID, e.Message, e.InnerError, e.Sql, e.StackTrace, e.Context)
}

func (e *DatabaseError) SetID(raw_id uint64) {
	if raw_id>>56 != 0 {
		panic("the id given already has a type")
	}
	e.ID = DatabaseErrorCode(raw_id | (0x02 << 56))
}

func (e DatabaseError) ToResponse() map[string]interface{} {
	return map[string]interface{}{
		"code":    RequestInternalServerError,
		"message": "internal server error",
	}
}
