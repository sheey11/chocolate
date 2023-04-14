package errors

const (
	_ RequestErrorCode = iota
	RequestInternalServerError
	RequestInvalidRequestData
	RequestInvalidParameter
	ReuqestRoleNotFound
	RequestUserNotFound
	RequestRoomNotFound
	RequestUsernameTaken
	RequestUsernameDuplicate
	RequestUsernameNotMeetConstraint
	RequestPasswordNotMeetConstraint
	RequestPasswordIncorrect
	RequestNotLoggedIn
	RequestPermissionDenied
	RequestJwtVerificationFailed
	RequestCorruptJwtPayload
	RequestSessionExpire
	RequestOneLastAdminDeletionNotAllowed
	RequestInvalidRoomUID
	RequestInvalidRoomID
	RequestInvalidLogFilter
	RequestInvalidLogFilterBeforeTimestamp
	RequestInvalidLogFilterAfterTimestamp
	RequestNotRoomOwner
	RequestUnknownRoomActionType
	RequestUnknownRoomPermissionType
	RequestUnknownRoomPermissionItemType
	RequestPermissionItemAlreadyExistError
	RequestPermissionItemNotExistError
	RequestLogRetrivalLimitTooBig
	RequestLogRetrivalInvalidTimeRange
	RequestRoomCountReachedMax
	RequestRoomTitleTooLong
	RequestLabelExists
	RequestUserNotHaveLabel
	RequestRoomBanned
	RequestRoomNotPublishingStream
	RequestTimeRangeTooLong
)

const (
	_ LogicErrorCode = iota | (0x01 << 56)
	LogicNilReference
	LogicDatabaseAffiliatedFieldsMissing
	LogicSRSConnectionError
	LogicReadingHttpResponseBodyError
	LogicUnmarshalingHttpResponseBodyError
	LogicSRSRepondNonZero
)

const (
	_ DatabaseErrorCode = iota | (0x02 << 56)
	DatabaseCreateNewSessionError
	DatabaseCreateAdminAccountError
	DatabaseCreateUserAccountError
	DatabaseCreatePermissionItemError
	DatabaseCreateRoomError
	DatabaseCreateChatMessageError
	DatabaseCreateLabelError
	DatabaseCreateUserLabelError
	DatabaseCreateEventError

	DatabaseCountAdminAccountError
	DatabaseCountPermissionItemError
	DatabaseCountLogsError

	DatabaseLookupUsernamesError
	DatabaseLookupRolesError
	DatabaseLookupLabelsError
	DatabaseLookupUserError
	DatabaseLookupRoomError
	DatabaseLookupLogsError

	DatabaseListRoomsError
	DatabaseListAccountsError
	DatabaseListEventsError

	DatabaseDeleteUserError
	DatabaseDeleteRoomError

	DatabaseSetUserRoleError
	DatabaseSetUserPasswordError

	DatabaseUpdateRoomPermissionTypeError
	DatabaseUpdateRoomStatusError
	DatabaseUpdareRoomPushKeyError
	DatabaseUpdateRoomTitleError
	DatabaseUpdateRoomSrsClientIDError
	DatabaseUpdateRoomSrsStreamIDError
	DatabaseIncreaseRoomViewersError
	DatabaseDecreaseRoomViewersError

	DatabaseClearRoomPermissionItemError
	DatabaseClearRoomViewersError
	DatabaseClearRoomSrsRelatedIDError
)
