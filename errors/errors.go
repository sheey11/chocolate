package errors

const (
	_ RequestErrorCode = iota
	RequestInternalServerError
	RequestUnknownContentType
	RequestInvalidUsernameFormat
	RequestInvalidPasswordFormat
	RequestUsernameTaken
	RequestUsernameDuplicate
	ReuqestRoleNotFound
	RequestBadParameter
	RequestNoSuchRoleFound
	RequestUsernameNotMeetConstraint
	RequestPasswordNotMeetConstraint
	RequestNotLoggedIn
	RequestPermissionDenied
	RequestJwtVerificationFailed
	RequestCorruptJwtPayload
	RequestSessionExpire
	RequestUserNotExist
	RequestPasswordIncorrect
	RequestOnlyAdminLeftDeletionDenied
	RequestInvalidRoomUID
	RequestRoomNotFound
)

const (
	_ DatabaseErrorCode = iota | (0x02 << 56)
	DatabaseCreateNewSessionError
	DatabaseCreateAdminAccountError
	DatabaseCreateUserAccountError
	DatabaseCountAdminAccountError
	DatabaseLookupUsernamesError
	DatabaseLookupRolesError
	DatabaseLookupLabelsError
	DatabaseLookupUserError
	DatabaseDeleteUserError
	DatabaseLookupRoomByUIDError
)
