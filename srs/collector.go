package srs

import (
	"time"

	"github.com/sirupsen/logrus"
)

type FixedLengthArray[T any] struct {
	underlay []*T
	start    int
	end      int
}

func (arr *FixedLengthArray[T]) Init(len uint) {
	arr.underlay = make([]*T, len+1)
}

func (arr *FixedLengthArray[T]) Append(v *T) {
	arr.underlay[arr.end] = v
	arr.end = (arr.end + 1) % len(arr.underlay)
	if arr.end == arr.start {
		arr.start = (arr.start + 1) % len(arr.underlay)
	}
}

func (arr *FixedLengthArray[T]) Len() int {
	psedoLen := arr.end - arr.start
	if psedoLen < 0 {
		return psedoLen + len(arr.underlay)
	} else {
		return psedoLen
	}
}

func (arr *FixedLengthArray[T]) ToList() []*T {
	list := make([]*T, arr.Len())
	if arr.Len() == 0 {
		return list
	}

	if arr.start < arr.end {
		copy(list, arr.underlay[arr.start:arr.end])
	} else {
		firstPartLen := len(arr.underlay) - arr.start - 1
		copy(list, arr.underlay[arr.start:])
		copy(list[firstPartLen:], arr.underlay[:arr.end])
	}
	return list
}

type collector struct {
	interval uint
	running  bool
	stop     chan struct{}
}

var metricsCollector collector

func collect[T statTypes](metric string, getter func() (T, error)) T {
	metrics, err := getter()
	if err != nil {
		logrus.WithError(err).WithField("metric", metric).Error("error when collecting metrics")
	}
	metrics.SetSampleTime(time.Now())
	return metrics
}

func (c collector) StartCollect(interval uint) {
	if c.running {
		c.Stop()
	}
	c.interval = interval
	c.stop = make(chan struct{}, 0)
	go func() {
		for {
			// FIXME: use interface & struct method may be better
			cacheSummries.Append(collect("summaries", getSummaries))
			cacheMemInfos.Append(collect("meminfo", getMeminfo))
			cacheVHosts.Append(collect("vhosts", getVHosts))
			cacheStreams.Append(collect("streams", getStreams))
			cacheClients.Append(collect("clients", getClients))

			select {
			case <-time.After(time.Second * time.Duration(interval)):
			case <-c.stop:
				break
			}
		}
	}()
	c.running = true
}

func (c collector) Stop() {
	if !c.running {
		return
	}
	close(c.stop)
	c.running = false
}

var (
	cacheSummries FixedLengthArray[Summaries]
	cacheMemInfos FixedLengthArray[MemInfo]
	cacheVHosts   FixedLengthArray[VHosts]
	cacheStreams  FixedLengthArray[Streams]
	cacheClients  FixedLengthArray[Clients]
)

func initMetricsCollector(nCaches uint, interval uint) {
	cacheSummries.Init(nCaches)
	cacheMemInfos.Init(nCaches)
	cacheVHosts.Init(nCaches)
	cacheStreams.Init(nCaches)
	cacheClients.Init(nCaches)

	metricsCollector.StartCollect(interval)
	logrus.Info("srs stats collector start collecting")
}
