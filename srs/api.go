package srs

func GetSummariesHistory() []*Summaries {
	return cacheSummries.ToList()
}

func GetMemInfoHistory() []*MemInfo {
	return cacheMemInfos.ToList()
}

func GetVHostsHistory() []*VHosts {
	return cacheVHosts.ToList()
}

func GetStreamsHistory() []*Streams {
	return cacheStreams.ToList()
}

func GetClientsHistory() []*Clients {
	return cacheClients.ToList()
}
