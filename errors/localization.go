package errors

// Use these func to show a localized message,
// you may want to typedef structs, that is,
// the `Context` field, containing necessary
// information to generate the message for
// each types of error.
func (e RequestError) GetLocalizedMessage(lang string) string {
	// TODO
	return e.Message
}

func (e LogicError) GetLocalizedMessage(lang string) string {
	return e.Message
}

func (e DatabaseError) GetLocalizedMessage(lang string) string {
	return e.Message
}
