package chat

import (
	"sync"

	"github.com/sheey11/chocolate/models"
	"github.com/sirupsen/logrus"
)

type Hub struct {
	affiliateRoom *models.Room
	channel       chan *models.ChatMessage
	subscribers   map[int64]chan<- *models.ChatMessage
	mu            sync.Mutex
}

func newHub(room *models.Room) *Hub {
	h := &Hub{
		affiliateRoom: room,
		channel:       make(chan *models.ChatMessage, 10),
		subscribers:   make(map[int64]chan<- *models.ChatMessage, 0),
		mu:            sync.Mutex{},
	}
	go h.dispatch()
	return h
}

func (h *Hub) dispatch() {
	for {
		message := <-h.channel
		go h.saveToDatabase(message)
		h.mu.Lock()
		for _, sub := range h.subscribers {
			sub <- message
		}
		h.mu.Unlock()
	}
}

func (h *Hub) saveToDatabase(message *models.ChatMessage) {
	if err := models.CreateChat(message); err != nil {
		logrus.WithError(err).Error("error when writing chat message to database")
	}
}

func (h *Hub) subscribe(uid int64, ch chan<- *models.ChatMessage) {
	h.mu.Lock()
	h.subscribers[uid] = ch
	h.mu.Unlock()
}

func (h *Hub) unsubscribe(uid int64) {
	h.mu.Lock()
	delete(h.subscribers, uid)
	h.mu.Unlock()
}

func (h *Hub) sendMessage(message *models.ChatMessage) {
	h.channel <- message
}
