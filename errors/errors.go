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
)

const (
	_ LogicErrorCode = iota | (0x01 << 56)
	LogicNilReference
	LogicDatabaseAffiliatedFieldsMissing
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

	DatabaseDeleteUserError
	DatabaseDeleteRoomError

	DatabaseSetUserRoleError
	DatabaseSetUserPasswordError

	DatabaseUpdateRoomPermissionTypeError
	DatabaseUpdateRoomStatusError
	DatabaseUpdareRoomPushKeyError
	DatabaseUpdateRoomTitleError
	DatabaseIncreaseRoomViewersError
	DatabaseDecreaseRoomViewersError

	DatabaseClearRoomPermissionItemError
	DatabaseClearRoomViewersError
)
