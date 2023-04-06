package chat

import (
	"sync"
	"time"

	"github.com/sheey11/chocolate/common"
	"github.com/sheey11/chocolate/srs"
)

type ChatNumStat struct {
	Num  uint      `json:"num"`
	Time time.Time `json:"time"`
}

var chatNumStatsCache = &srs.FixedLengthArray[ChatNumStat]{}
var currentStat = &ChatNumStat{}
var mu = sync.Mutex{}

func init() {
	common.HookPostConfigLoad(func(cfg *common.ChocolateConfig) {
		chatNumStatsCache.Init(cfg.Srs.Stats.CacheNumber)
		go func() {
			ticker := time.NewTicker(time.Second * 30)
			for {
				<-ticker.C
				currentStat.Time = time.Now()
				mu.Lock()
				chatNumStatsCache.Append(currentStat)
				currentStat = &ChatNumStat{}
				mu.Unlock()
			}
		}()
	})
}

func increaseChatNum() {
	mu.Lock()
	defer mu.Unlock()
	currentStat.Num += 1
}

func GetChatNumStats() []*ChatNumStat {
	return chatNumStatsCache.ToList()
}
