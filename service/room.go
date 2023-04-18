package service

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"strconv"

	"github.com/sheey11/chocolate/chat"
	cerrors "github.com/sheey11/chocolate/errors"
	"github.com/sheey11/chocolate/models"
	"github.com/sirupsen/logrus"
)

func CheckRoomStreamPermission(room *models.Room, params string) bool {
	if room.Status != models.RoomStatusStreaming {
		return false
	}
	key := room.GetStreamKey()
	return fmt.Sprintf("%d%s", room.ID, params) == key
}

func GetRoomByUID(uid string) (*models.Room, cerrors.ChocolateError) {
	if len(uid) != 32 {
		return nil, cerrors.RequestError{
			ID:      cerrors.RequestInvalidRoomUID,
			Message: "invalid room uid",
		}
	}
	return models.GetRoomByUID(uid)
}

func GetRoomByID(id uint) (*models.Room, cerrors.ChocolateError) {
	return models.GetRoomByID(id, []string{"PermissionItems"})
}

func GetRoomByIDWithDetail(id uint) (*models.Room, cerrors.ChocolateError) {
	return models.GetRoomByID(id, []string{"Owner", "PermissionItems"})
}

// this method also generates push key before setting
// status
func SetRoomStartStreaming(id uint) cerrors.ChocolateError {
	err := models.GenerateRoomPushKeyForRoom(id)
	if err != nil {
		return err
	}
	return models.SetRoomStatus(id, models.RoomStatusStreaming)
}

func SetRoomStopStreaming(id uint) cerrors.ChocolateError {
	// err = CutOffStream(room, 0)
	// if err != nil {
	// 	return err
	// }
	return models.SetRoomStatus(id, models.RoomStatusIdle)
}

func ChangeRoomPermission(id uint, permission models.RoomPermissionType, clearPermission bool) cerrors.ChocolateError {
	if permission != models.RoomPermissionBlacklist && permission != models.RoomPermissionWhitelist {
		return cerrors.RequestError{
			ID:      cerrors.RequestUnknownRoomPermissionType,
			Message: "unknown permission type",
		}
	}

	room, err := GetRoomByID(uint(id))
	if err != nil {
		return err
	}
	return models.ChangeRoomPermissionType(room, permission, clearPermission)
}

func AddRoomPermissionItem_Label(id uint, label string) cerrors.ChocolateError {
	return models.AddRoomPermissionItem_Label(id, label)
}

func AddRoomPermissionItem_User(id uint, username string) cerrors.ChocolateError {
	u, _ := models.GetUserByName(username, nil)
	if u == nil {
		return cerrors.RequestError{
			ID:      cerrors.RequestUserNotFound,
			Message: "user not found",
		}
	}
	return models.AddRoomPermissionItem_User(id, u.ID)
}

func DeleteRoomPermissionItem_Label(id uint, label string) cerrors.ChocolateError {
	return models.DeleteRoomPermissionItem_Label(id, label)
}

func DeleteRoomPermissionItem_User(id uint, username string) cerrors.ChocolateError {
	u, _ := models.GetUserByName(username, nil)
	if u == nil {
		return cerrors.RequestError{
			ID:      cerrors.RequestUserNotFound,
			Message: "user not found",
		}
	}
	return models.DeleteRoomPermissionItem_User(id, u.ID)
}

func CreateRoomForUser(user *models.User, title string) (*models.Room, cerrors.ChocolateError) {
	if user == nil {
		return nil, cerrors.LogicError{
			ID:         cerrors.LogicNilReference,
			Message:    "you have passed a nil user argument to service.CreateRoomForUser, check log and your code",
			StackTrace: cerrors.GetStackTrace(),
		}
	}

	if len(title) > 32 {
		return nil, cerrors.RequestError{
			ID:      cerrors.RequestRoomTitleTooLong,
			Message: "title is too long",
		}
	}

	count, err := user.GetAfflicateRoomCount()
	if err != nil {
		return nil, err
	} else if count >= user.MaxRoomCount && user.RoleName != "administrator" { // TODO: use Role.ManageRooms instead of user.RoleName
		return nil, cerrors.RequestError{
			ID:      cerrors.RequestRoomCountReachedMax,
			Message: "you have created max room allowed",
		}
	}

	return models.CreateRoomForUser(user, title)
}

// includes owner
func ListRooms(owner *models.User, status *models.RoomStatus, search string, limit uint, page uint) (uint, []*models.Room, cerrors.ChocolateError) {
	var filterId *uint = nil
	var filterTitle *string = nil
	if search != "" {
		filterTitle = &search
		id, err := strconv.Atoi(search)
		if err == nil && id > 0 {
			uId := uint(id)
			filterId = &uId
		}
	}

	return models.ListRooms(owner, status, filterId, filterTitle, limit, page)
}

func CutOffStream(room *models.Room, operator uint) cerrors.ChocolateError {
	if room.SrsClientID != nil {
		urlStr := fmt.Sprintf("http://srs:1985/api/v1/clients/%s", *room.SrsClientID)
		url, _ := url.Parse(urlStr)
		response, gerr := http.DefaultClient.Do(&http.Request{
			Method: http.MethodDelete,
			URL:    url,
			Proto:  "HTTP/1.1",
		})
		if gerr != nil {
			lerr := cerrors.LogicError{
				ID:         cerrors.LogicDatabaseAffiliatedFieldsMissing,
				Message:    "error requesting client kick, check your code",
				StackTrace: cerrors.GetStackTrace(),
				InnerError: gerr,
				Context: map[string]interface{}{
					"url": urlStr,
				},
			}
			return lerr
		}

		body, gerr := ioutil.ReadAll(response.Body)
		if gerr != nil {
			lerr := cerrors.LogicError{
				ID:         cerrors.LogicUnmarshalingHttpResponseBodyError,
				Message:    "error unmarshaling srs response, check your struct declear (service.SRSStreamInfoResponse)",
				StackTrace: cerrors.GetStackTrace(),
				Context: map[string]interface{}{
					"url":        url,
					"body_bytes": body,
				},
				InnerError: gerr,
			}
			return lerr
		}

		codeProber := &struct {
			code uint
		}{}

		gerr = json.Unmarshal(body, codeProber)
		if gerr != nil {
			lerr := cerrors.LogicError{
				ID:         cerrors.LogicUnmarshalingHttpResponseBodyError,
				Message:    "error unmarshaling srs response, check your struct declear",
				StackTrace: cerrors.GetStackTrace(),
				Context: map[string]interface{}{
					"url":        url,
					"body_bytes": body,
				},
				InnerError: gerr,
			}
			return lerr
		}

		if codeProber.code != 0 {
			lerr := cerrors.LogicError{
				ID:         cerrors.LogicSRSRepondNonZero,
				Message:    "srs respond with non-zero code, check your parameter",
				StackTrace: cerrors.GetStackTrace(),
				Context: map[string]interface{}{
					"url":  url,
					"code": codeProber.code,
				},
			}
			return lerr
		}
	}

	chat.SendMessage(&models.ChatMessage{
		Room:     *room,
		RoomID:   room.ID,
		Type:     models.ChatMessageTypeAdministrationCutOff,
		SenderID: &operator,
	})

	RecordCutOffEvent(room.ID, operator)
	return models.SetRoomStatus(room.ID, models.RoomStatusIdle)
}

func DeleteRoom(roomid uint, operator uint) cerrors.ChocolateError {
	room, err := GetRoomByID(roomid)
	if err != nil {
		return err
	}

	if operator != 0 && room.Status == models.RoomStatusStreaming {
		CutOffStream(room, operator)
	}
	return models.DeleteRoom(roomid)
}

func RetriveRoomTimeline(roomid uint) ([]*models.Log, cerrors.ChocolateError) {
	return models.RetriveLogsForRoom(roomid)
}

func IncreaseRoomViewer(roomid uint) cerrors.ChocolateError {
	return models.IncreaseRoomViewer(roomid)
}
func DecreaseRoomViewer(roomid uint) cerrors.ChocolateError {
	return models.DecreaseRoomViewer(roomid)
}

func IsUserAllowedForRoom(room *models.Room, user *models.User) bool {
	if room == nil {
		err := cerrors.LogicError{
			ID:         cerrors.LogicNilReference,
			Message:    "you have passed a nil room argument to service.IsUserForbiddenForRoom, check your code",
			StackTrace: cerrors.GetStackTrace(),
		}
		logrus.WithError(err).Error("nil reference detected")
		return false
	}

	if user != nil {
		if room.OwnerID == user.ID {
			return true
		} else if user.Role.AbilityManageRoom {
			return true
		}
	} else if room.PermissionType == models.RoomPermissionWhitelist {
		return false
	}

	return models.IsUserAllowedForRoom(room, user)
}

func ModifyRoomTitle(roomid uint, title string) cerrors.ChocolateError {
	if len(title) > 32 {
		return cerrors.RequestError{
			ID:      cerrors.RequestRoomTitleTooLong,
			Message: "title is too long",
		}
	}
	return models.ModifyRoomTitle(roomid, title)
}

func GetRoomCount() uint {
	return models.GetRoomCount()
}

func GetStreamingRoomCount() uint {
	return models.GetStreamingRoomCount()
}

func RecordRoomClientID(roomId uint, stream string) cerrors.ChocolateError {
	return models.RecordRoomClientID(roomId, stream)
}

func ClearRoomStreamAndClientID(roomId uint) cerrors.ChocolateError {
	return models.ClearRoomStreamAndClientID(roomId)
}

type SRSClientInfo struct {
	ID      string          `json:"id"`
	Vhost   string          `json:"vhost"`
	Stream  string          `json:"stream"`
	IP      string          `json:"ip"`
	PageUrl string          `json:"pageUrl"`
	SwfUrl  string          `json:"swfUrl"`
	TcUrl   string          `json:"tcUrl"`
	Url     string          `json:"url"`
	Type    string          `json:"type"`
	Publish bool            `json:"publish"`
	Alive   float64         `json:"alive"`
	Kbps    map[string]uint `json:"kbps"`
}

type SRSClientInfoResponse struct {
	Code   int           `json:"code"`
	Server string        `json:"server"`
	Client SRSClientInfo `json:"client"`
}

func GetRoomStreamID(room *models.Room) *string {
	if room.SrsClientID == nil {
		return nil
	}
	if room.SrsStreamID != nil {
		return room.SrsStreamID
	}

	url := fmt.Sprintf("http://srs:1985/api/v1/clients/%s", *room.SrsClientID)
	response, err := http.Get(url)
	if err != nil {
		lerr := cerrors.LogicError{
			ID:         cerrors.LogicSRSConnectionError,
			Message:    "error connecting to srs api, check your configuration",
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"url": url,
			},
			InnerError: err,
		}
		logrus.WithError(lerr).Error("error trying to get stream id")
		return nil
	}

	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		lerr := cerrors.LogicError{
			ID:         cerrors.LogicReadingHttpResponseBodyError,
			Message:    "error reading srs api response, check your configuration",
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"url": url,
			},
			InnerError: err,
		}
		logrus.WithError(lerr).Error("error reading response body")
		return nil
	}

	codeProber := &struct {
		Code uint `json:"code"`
	}{}

	err = json.Unmarshal(body, codeProber)
	if err != nil {
		lerr := cerrors.LogicError{
			ID:         cerrors.LogicUnmarshalingHttpResponseBodyError,
			Message:    "error probing srs response code, check your struct declear",
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"url":        url,
				"body_bytes": body,
			},
			InnerError: err,
		}
		logrus.WithError(lerr).Error("error unmarshaling srs response body")
		return nil
	}

	if codeProber.Code != 0 {
		lerr := cerrors.LogicError{
			ID:         cerrors.LogicSRSRepondNonZero,
			Message:    "srs respond with non-zero code, check your parameter",
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"url":  url,
				"code": codeProber.Code,
			},
			InnerError: err,
		}
		logrus.WithError(lerr).Error("srs respond with non-zero code")
		return nil
	}

	data := &SRSClientInfoResponse{}
	err = json.Unmarshal(body, data)
	if err != nil {
		lerr := cerrors.LogicError{
			ID:         cerrors.LogicUnmarshalingHttpResponseBodyError,
			Message:    "error unmarshaling srs response, check your struct declear (service.SRSClientInfoResponse)",
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"url":        url,
				"body_bytes": body,
			},
			InnerError: err,
		}
		logrus.WithError(lerr).Error("error unmarshaling srs response body")
		return nil
	}

	if data.Client.Stream == "" {
		logrus.Error("responded stream id is empty, check your code")
		return nil
	}

	cerr := models.RecordRoomStreamID(room.ID, data.Client.Stream)
	if cerr != nil {
		logrus.WithError(cerr).Error("error writing room stream id")
		return nil
	}
	return &data.Client.Stream
}

type SRSStreamInfo struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Vhost     string `json:"vhost"`
	App       string `json:"app"`
	LiveMs    int64  `json:"live_ms"`
	Clients   int    `json:"clients"`
	Frames    int    `json:"frames"`
	SendBytes int    `json:"send_bytes"`
	RecvBytes int    `json:"recv_bytes"`
	Kbps      struct {
		Recv30s int `json:"recv_30s"`
		Send30s int `json:"send_30s"`
	} `json:"kbps"`
	Publish struct {
		Active bool   `json:"active"`
		CID    string `json:"cid"`
	} `json:"publish"`
	Video struct {
		Codec   string `json:"codec"`
		Profile string `json:"profile"`
		Level   string `json:"level"`
		Width   int    `json:"width"`
		Height  int    `json:"height"`
	} `json:"video"`
	Audio struct {
		Codec      string `json:"codec"`
		SampleRate int    `json:"sample_rate"`
		Channel    int    `json:"channel"`
		Profile    string `json:"profile"`
	} `json:"audio"`
}

type SRSStreamInfoReponse struct {
	Code   int           `json:"code"`
	Server string        `json:"server"`
	Stream SRSStreamInfo `json:"stream"`
}

func GetRoomStreamSRSInfo(room *models.Room) (*SRSStreamInfo, cerrors.ChocolateError) {
	streamId := GetRoomStreamID(room)
	if streamId == nil {
		return nil, cerrors.RequestError{
			ID:      cerrors.RequestRoomNotPublishingStream,
			Message: "the specified room is not pushing streams to server",
		}
	}

	url := fmt.Sprintf("http://srs:1985/api/v1/streams/%s", *streamId)
	response, err := http.Get(url)

	if err != nil {
		lerr := cerrors.LogicError{
			ID:         cerrors.LogicSRSConnectionError,
			Message:    "error connecting to srs api, check your configuration",
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"url": url,
			},
			InnerError: err,
		}
		return nil, lerr
	}
	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		lerr := cerrors.LogicError{
			ID:         cerrors.LogicReadingHttpResponseBodyError,
			Message:    "error reading srs api response, check your configuration",
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"url": url,
			},
			InnerError: err,
		}
		return nil, lerr
	}

	codeProber := &struct {
		Code uint `json:"code"`
	}{}

	err = json.Unmarshal(body, codeProber)
	if err != nil {
		lerr := cerrors.LogicError{
			ID:         cerrors.LogicUnmarshalingHttpResponseBodyError,
			Message:    "error probing srs response code, check your struct declear",
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"url":        url,
				"body_bytes": body,
			},
			InnerError: err,
		}
		return nil, lerr
	}

	if codeProber.Code != 0 {
		lerr := cerrors.LogicError{
			ID:         cerrors.LogicSRSRepondNonZero,
			Message:    "srs respond with non-zero code, check your parameter",
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"url":  url,
				"code": codeProber.Code,
			},
			InnerError: err,
		}
		return nil, lerr
	}

	data := &SRSStreamInfoReponse{}
	err = json.Unmarshal(body, data)
	if err != nil {
		lerr := cerrors.LogicError{
			ID:         cerrors.LogicUnmarshalingHttpResponseBodyError,
			Message:    "error unmarshaling srs response, check your struct declear (service.SRSStreamInfoResponse)",
			StackTrace: cerrors.GetStackTrace(),
			Context: map[string]interface{}{
				"url":        url,
				"body_bytes": body,
			},
			InnerError: err,
		}
		return nil, lerr
	}

	return &data.Stream, nil
}

func PermItemAutoCompelete(user *models.User, roomId uint, permType models.PermissionSubjectType, prefix string) ([]*models.PermItemAutoCompeleteItem, cerrors.ChocolateError) {
	if len(prefix) == 0 || len(prefix) > 32 {
		return nil, cerrors.RequestError{
			ID:      cerrors.RequestInternalServerError,
			Message: "prefix < 32 char",
		}
	}

	room, err := models.GetRoomByID(roomId, []string{})
	if err != nil {
		return nil, err
	} else if room.OwnerID != user.ID {
		return nil, cerrors.RequestError{
			ID:      cerrors.RequestNotRoomOwner,
			Message: "not room owner",
		}
	}

	return models.RermItemAutoComplete(roomId, permType, prefix)
}
