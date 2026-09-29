package cache

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

// Batas waktu tiap operasi Redis. Redis adalah lapisan opsional: kalau lambat
// atau mati, request harus tetap jalan lewat database, bukan ikut menggantung.
const opTimeout = 300 * time.Millisecond

// Key cache konten publik. Router mengisinya, handler admin membuangnya saat
// ada perubahan supaya halaman depan langsung ikut terbarui.
const (
	KeyRegistration   = "public:registration"
	KeySettings       = "public:settings"
	KeyDivisions      = "public:divisions"
	KeyProgramStudies = "public:program-studies"
)

type Cache struct {
	rdb    *redis.Client
	prefix string
}

// New mengembalikan cache. URL kosong = cache dimatikan (aplikasi tetap jalan).
func New(url string) *Cache {
	if url == "" {
		log.Println("cache: REDIS_URL kosong, cache dimatikan")
		return &Cache{}
	}

	opt, err := redis.ParseURL(url)
	if err != nil {
		log.Printf("cache: REDIS_URL tidak valid (%v), cache dimatikan", err)
		return &Cache{}
	}
	opt.MaxRetries = 1
	opt.DialTimeout = 500 * time.Millisecond
	opt.ReadTimeout = opTimeout
	opt.WriteTimeout = opTimeout
	opt.PoolSize = 20

	return &Cache{rdb: redis.NewClient(opt), prefix: "oprec:"}
}

func (c *Cache) Enabled() bool {
	return c != nil && c.rdb != nil
}

func (c *Cache) Close() error {
	if !c.Enabled() {
		return nil
	}
	return c.rdb.Close()
}

func (c *Cache) Ping(ctx context.Context) bool {
	if !c.Enabled() {
		return false
	}
	opCtx, cancel := context.WithTimeout(ctx, opTimeout)
	defer cancel()
	return c.rdb.Ping(opCtx).Err() == nil
}

// GetJSON mengambil nilai dari cache. false berarti cache miss atau Redis mati,
// dan pemanggil harus mengambil dari database.
func (c *Cache) GetJSON(ctx context.Context, key string, dst any) bool {
	if !c.Enabled() {
		return false
	}
	opCtx, cancel := context.WithTimeout(ctx, opTimeout)
	defer cancel()

	raw, err := c.rdb.Get(opCtx, c.prefix+key).Bytes()
	if err != nil {
		return false
	}
	return json.Unmarshal(raw, dst) == nil
}

func (c *Cache) SetJSON(ctx context.Context, key string, value any, ttl time.Duration) {
	if !c.Enabled() {
		return
	}
	raw, err := json.Marshal(value)
	if err != nil {
		return
	}
	opCtx, cancel := context.WithTimeout(ctx, opTimeout)
	defer cancel()
	c.rdb.Set(opCtx, c.prefix+key, raw, ttl)
}

// Del membuang key tertentu. Dipakai admin agar perubahan langsung terlihat.
func (c *Cache) Del(ctx context.Context, keys ...string) {
	if !c.Enabled() || len(keys) == 0 {
		return
	}
	prefixed := make([]string, len(keys))
	for i, k := range keys {
		prefixed[i] = c.prefix + k
	}
	opCtx, cancel := context.WithTimeout(ctx, opTimeout)
	defer cancel()
	c.rdb.Del(opCtx, prefixed...)
}

// Allow membatasi jumlah permintaan per key dalam satu window (fixed window).
// Fail-open: kalau Redis mati, permintaan tetap diizinkan supaya situs tidak
// ikut tumbang bersama Redis.
func (c *Cache) Allow(ctx context.Context, key string, limit int, window time.Duration) bool {
	if !c.Enabled() {
		return true
	}
	opCtx, cancel := context.WithTimeout(ctx, opTimeout)
	defer cancel()

	full := c.prefix + key
	count, err := c.rdb.Incr(opCtx, full).Result()
	if err != nil {
		return true
	}
	if count == 1 {
		c.rdb.Expire(opCtx, full, window)
	}
	return count <= int64(limit)
}
