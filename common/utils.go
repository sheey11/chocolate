package common

// deprecated, use lo.Map instead
func Map[T any, U any](array []T, filter func(x T) U) []U {
	result := make([]U, len(array))
	for i := range array {
		result[i] = filter(array[i])
	}
	return result
}

// deprecated, use lo.Contains instead
func Contains[T comparable](array []T, the_one T) bool {
	for i := range array {
		if array[i] == the_one {
			return true
		}
	}
	return false
}

// deprecated, use lo.Keys instead
func Keys[T comparable, V any](dict map[T]V) []T {
	keys := make([]T, len(dict))
	i := 0
	for k := range dict {
		keys[i] = k
		i++
	}
	return keys
}
