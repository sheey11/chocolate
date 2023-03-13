package srs

type ServerInfo struct {
	ResponseCode uint   `json:"code"`
	ServerID     string `json:"server"`
	Service      string `json:"service"`
	PID          string `json:"pid"`
}

type Version struct {
	ServerInfo
	Major    uint
	Minor    uint
	Revision uint
}

type Summaries struct {
	ServerInfo
	Timestamp uint `json:"now_ms"`
	Self      struct {
		Version       string
		PID           uint `json:"pid"`
		PPID          uint `json:"ppid"`
		Argv          string
		CWD           string  `json:"cwd"`
		MemoryKBytes  uint    `json:"mem_kbyte"`
		MemoryPercent float64 `json:"mem_percent"`
		CPUPercent    float64 `json:"cpu_percent"`
		Uptime        uint    `json:"srs_uptime"`
	}
	System struct {
		CPUPercent        float64 `json:"cpu_percent"`
		DiskReadKBps      uint    `json:"disk_read_KBps"`
		DiskWriteKBps     uint    `json:"disk_write_KBps"`
		MemoryRamKB       uint    `json:"mem_ram_kbyte"`
		MemoryRamPercent  float64 `json:"men_ram_percent"`
		MemorySwapKB      uint    `json:"mem_swap_kbyte"`
		MemorySwapPercent float64 `json:"men_swap_percent"`
		CPUCount          uint    `json:"cpus"`
		CPUOnline         uint    `json:"cpus_online"`
		Uptime            uint    `json:"uptime"`
		IdleTime          uint    `json:"ilde_time"`
		Load1M            float64 `json:"load_1m"`
		Load5M            float64 `json:"load_5m"`
		Load15M           float64 `json:"load_15m"`
		NetSampleTime     uint    `json:"net_sample_time"`
		NetRecvBytes      uint    `json:"net_recv_bytes"`
		NetSendBytes      uint    `json:"net_send_bytes"`
		NetRecviBytes     uint    `json:"net_recvi_bytes"`
		NetSendiBytes     uint    `json:"net_sendi_bytes"`
		SrsSampleTime     uint    `json:"srs_sample_time"`
		SrsRecvBytes      uint    `json:"srs_recv_bytes"`
		SrsSendBytes      uint    `json:"srs_send_bytes"`
		SysConn           uint    `json:"conn_sys"`
		SysConnEt         uint    `json:"conn_sys_et"`
		SysConnTw         uint    `json:"conn_sys_tw"`
		SysConnUDP        uint    `json:"conn_sys_udp"`
		SrsConn           uint    `json:"conn_srs"`
	}
}

type MemInfo struct {
	ServerInfo
	SampleTime  uint    `json:"sample_time"`
	RamPercent  float64 `json:"percent_ram"`
	SwapPercent float64 `json:"percent_swap"`
	MemActive   uint    `json:"MemActive"`
	MemInUse    uint    `json:"RealInUse"`
	MemNotInUse uint    `json:"NotInUse"`
	MemTotal    uint    `json:"MemTotal"`
	MemFree     uint    `json:"MemFree"`
	Buffers     uint    `json:"Buffers"`
	Cached      uint    `json:"Cached"`
	SwapTotal   uint    `json:"SwapTotal"`
	SwapFree    uint    `json:"SwapFree"`
}

type Features struct {
	ServerInfo
	Options        string `json:"options2"`
	BuildTimestamp uint   `json:"build2"`
	FeatureList    struct {
		SSL         bool
		HLS         bool
		HDS         bool
		Callback    bool
		API         bool
		Httpd       bool
		DVR         bool
		Transcode   bool
		Ingest      bool
		Stat        bool
		Caster      bool
		ComplexSend bool
		TCPNoDelay  bool
		SoSendBuf   bool
		MR          bool
	} `json:"features"`
}

type VHost struct {
	ID          string
	Name        string
	Enabled     bool
	ClientCount uint
	StreamCount uint
	SendBytes   uint
	RecvBytes   uint
	Stat        struct {
		Recv30sKBytes uint `json:"recv_30s"`
		Send30sKBytes uint `json:"sned_30s"`
	} `json:"kbps"`
	HLS struct {
		Enabled  bool
		Fragment uint
	}
}

type VHosts struct {
	ServerInfo
	VHostList []VHost `json:"vhosts"`
}

type Stream struct {
	ID            string
	Name          string
	VHostID       string `json:"vhost"`
	App           string
	TCUrl         string `json:"tcUrl"`
	UrlPath       string `json:"url"`
	LiveTimestamp uint   `json:"live_ms"`
	ClientCount   uint   `json:"clients"`
	FrameCount    uint   `json:"frames"`
	SendBytes     uint   `json:"send_bytes"`
	RecvBytes     uint   `json:"recv_bytes"`
	Stat          struct {
		Recv30sKBytes uint `json:"recv_30s"`
		Send30sKBytes uint `json:"sned_30s"`
	} `json:"kbps"`
	Publish struct {
		Active bool
		CID    string
	}
	Video struct {
		Codec   string
		Profile string
		Level   string
		Width   uint
		Height  uint
	}
	Audio struct {
		Codec      string
		SampleRate uint `json:"sample_rate"`
		Channel    uint
		Profile    string
	}
}

type Streams struct {
	ServerInfo
	StreamList []Stream `json:"streams"`
}

type Client struct {
	ID        string
	VHostID   string  `json:"vhost"`
	StreamID  string  `json:"stream"`
	IP        string  `json:"ip"`
	PageUrl   string  `json:"pageUrl"`
	SwfUrl    string  `json:"swfUrl"`
	TCUrl     string  `json:"tcUrl"`
	Url       string  `json:"url"`
	Name      string  `json:"name"`
	Type      string  `json:"type"`
	Publish   bool    `json:"publish"`
	AliveSec  float64 `json:"alive"`
	SendBytes uint    `json:"send_bytes"`
	RecvBytes uint    `json:"recv_bytes"`
	Stat      struct {
		Recv30sKBytes uint `json:"recv_30s"`
		Send30sKBytes uint `json:"sned_30s"`
	} `json:"kbps"`
}

type Clients struct {
	ServerInfo
	ClientList []Client `json:"clients"`
}
