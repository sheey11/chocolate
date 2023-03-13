package common

func Map[T any, U any](array []T, filter func(x T) U) []U {
	result := make([]U, len(array))
	for i := range array {
		result[i] = filter(array[i])
	}
	return result
}

func Contains[T comparable](array []T, the_one T) bool {
	for i := range array {
		if array[i] == the_one {
			return true
		}
	}
	return false
}

func Keys[T comparable, V any](dict map[T]V) []T {
	keys := make([]T, len(dict))
	i := 0
	for k := range dict {
		keys[i] = k
		i++
	}
	return keys
}
