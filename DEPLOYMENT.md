# Production Deployment Guide (Dokploy)

## Prerequisites

- Dokploy instance sudah running
- Domain sudah dikonfigurasi di Dokploy (reverse proxy otomatis handle oleh Dokploy)
## Setup
## Setup di Dokploy

### 1. Buat Project Baru

Di Dokploy dashboard:
- Buat project baru: "HIMATRIS Open Recruitment"
- Pilih repository Git Anda

### 2. Environment Variables

Set di Dokploy project settings:

```
DATABASE_NAME=himatris_oprec
DATABASE_USER=postgres
DATABASE_PASSWORD=<generate-strong-password>
JWT_SECRET=<generate-random-32-char>
JWT_EXPIRES_IN=86400
MAX_CV_SIZE=5242880
REDIS_URL=redis://redis:6379/0
DB_MAX_CONNS=25
FRONTEND_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api/v1
```
- `FRONTEND_URL` & `NEXT_PUBLIC_API_URL`: ganti `oprec.himatris.com` dengan domain Anda
Generate secrets:
```bash
# JWT Secret
openssl rand -hex 32

# Database Password
openssl rand -base64 24
```

### 3. Deploy

Di Dokploy:
- Pilih `docker-compose.prod.yml` sebagai deployment file (Compose Path)
- Tambah domain di tab **Domains** (satu entri per service, isi persis seperti ini):

| Host | Path | Service Name | Port | HTTPS |
|---|---|---|---|---|
| `oprec.himatris.com` | _(kosong)_ | `frontend` | `3000` | aktif |
| `oprec.himatris.com` | `/api` | `backend` | `8080` | aktif |

- Deploy

Dua hal yang perlu diperhatikan:

1. Service `frontend` dan `backend` harus bisa dijangkau Traefik lewat network
   `dokploy-network`. Dokploy menyambungkannya otomatis saat deploy, jadi tidak
   perlu ditulis di compose. Kalau domain dibalas **404**, lihat bagian
   troubleshooting di bawah.
2. Jangan pakai `container_name` di compose yang dijalankan Dokploy. Dokploy
   melarangnya karena mengganggu log, metrics, dan fitur lain (compose produksi
   sudah bersih; `container_name` hanya ada di `docker-compose.prod.local.yml`
   untuk pemakaian di lokal).

Setiap kali domain ditambah/diubah di Dokploy, **deploy ulang** service-nya:
Dokploy menyuntikkan label Traefik pada saat deploy, jadi perubahan domain tidak
berlaku sebelum redeploy.

### 4. Verify

```bash
# Check health endpoints
curl https://your-domain.com/api/v1/health
curl https://your-domain.com
```
# Test health
### 5. Seed Data

Seed **tidak perlu dijalankan manual**. Seed ada di `backend/migrations/010_seed.sql` dan ikut dijalankan otomatis oleh backend saat startup, tapi hanya kalau migrasi itu belum pernah tercatat di tabel `schema_migrations` (yaitu: database masih baru).

Isi seed: admin `admin` / `admin123`, 5 divisi, 3 program studi, 1 periode pendaftaran (`OPREC HIMATRIS 2026`).

Kalau database sudah pernah jalan (misal deploy lama) dan Anda butuh data seed-nya, jalankan manual — aman diulang, semua insert-nya idempotent:

```bash
cd /etc/dokploy/compose/<app-name>/code
docker exec -i <postgres-container> psql -U postgres -d himatris_oprec < backend/migrations/010_seed.sql
```

Cek hasilnya:

```bash
docker exec <postgres-container> psql -U postgres -d himatris_oprec -c \
  "SELECT (SELECT count(*) FROM admins) admins, (SELECT count(*) FROM divisions) divisions, (SELECT count(*) FROM program_studies) prodi, (SELECT count(*) FROM registration_periods) periods;"
```

> Untuk paksa seed ulang seluruh database: hapus volume `postgres_data` lalu deploy ulang (data pendaftar ikut hilang).

> **Penting:** password admin dari seed (`admin123`) hanya untuk development. Setelah login pertama di production, segera ganti lewat menu **Kelola Admin** di dashboard.

## Kapasitas & Performa (ratusan pengunjung bersamaan)

Ringkasan hal yang sudah dipasang supaya situs tetap stabil saat ramai:

| Bagian | Yang dilakukan |
|---|---|
| Konten publik | Endpoint `GET /public/registration`, `/settings`, `/divisions`, `/program-studies` di-cache di Redis 30 detik dan langsung di-invalidate saat admin mengubah data, jadi halaman depan tidak selalu menekan PostgreSQL |
| Pembatas permintaan | `/public/result` 120 permintaan/menit per IP, `POST /public/applications` 20/menit per IP. Berlaku per IP asli (`X-Forwarded-For` hanya dipercaya dari jaringan internal), balasannya `429` |
| Redis | Service `redis` tanpa persistensi, `maxmemory 256mb`, `allkeys-lru`. Redis **opsional**: kalau mati, cache dan pembatas permintaan otomatis dilewati dan situs tetap melayani dari database |
| Pool database | `DB_MAX_CONNS` (default 25) + koneksi idle dipangkas otomatis, aman di bawah `max_connections` PostgreSQL (default 100) |
| Index database | Migrasi `018_perf_indexes.sql`: index FK `accepted_division_id`, index GIN untuk pencarian NIM (`ILIKE`), dan index gabungan status/periode + `created_at` untuk daftar pendaftar |
| Query | Perbandingan status sekarang memakai tipe enum (`= $n::selection_status`) supaya index-nya terpakai; import Excel memakai satu transaksi + `ON CONFLICT`, jadi 1.000 baris tidak lagi 1.000 kali commit |
| Gambar | Semua unggahan gambar dikompres di server (resize lebar maksimum 1280 px divisi / 1920 px hero, JPEG kualitas 82). Foto HP 5 MB jadi ratusan KB |
| File gambar publik | `Cache-Control: public, max-age=31536000, immutable` untuk `storage/divisions/*` dan `storage/landing/*` (nama file UUID, isinya tidak pernah berubah) |
| HTTP server | `ReadHeaderTimeout` 10s, `ReadTimeout` 60s, `WriteTimeout` 120s, `IdleTimeout` 120s, plus graceful shutdown |
| Container | `restart: always` untuk semua service, healthcheck postgres/redis/backend/frontend |

Kalau trafiknya ternyata lebih besar dari perkiraan, urutan penambahan kapasitas: naikkan `DB_MAX_CONNS`, lalu perbesar `maxmemory` Redis dan TTL cache, lalu tambah replika backend (pool tiap replika harus dihitung ulang).

## Management via Dokploy

### View Logs
Gunakan Dokploy dashboard logs viewer per service (postgres, backend, frontend).

### Restart Service
Via Dokploy dashboard → pilih service → restart button.

### Update & Redeploy
Push ke Git → Dokploy auto-rebuild jika webhook configured, atau trigger manual deploy.

## Backup

### Database Backup
Via Dokploy terminal atau SSH ke server:
```bash
docker exec <postgres-container-name> pg_dump -U postgres himatris_oprec > backup_$(date +%F).sql
```

### CV Storage Backup
```bash
docker run --rm -v <project>_cv_storage:/data -v $(pwd):/backup alpine tar czf /backup/cv_backup_$(date +%F).tar.gz /data
```

### Restore Database
```bash
docker exec -i <postgres-container-name> psql -U postgres himatris_oprec < backup.sql
```

## Monitoring

Dokploy provides built-in monitoring:
- Container status & health
- Resource usage (CPU, memory)
- Logs streaming

Health endpoints:
- Backend: `https://your-domain.com/api/v1/health`
- Frontend: `https://your-domain.com`

## Security Checklist

- [ ] JWT_SECRET minimal 32 karakter random
- [ ] DATABASE_PASSWORD kuat (min 24 karakter)
- [ ] Domain configured di Dokploy dengan auto SSL
- [ ] Dokploy firewall active
- [ ] Regular backup database & CV storage
- [ ] Monitor disk space untuk CV uploads via Dokploy dashboard

## Troubleshooting

### Domain balas `404 page not found` dan tidak ada log di container

Ini bukan masalah aplikasi: log FE kosong berarti request tidak pernah sampai ke
container, dan `404 page not found` adalah balasan Traefik ketika tidak ada
router yang cocok. Penyebab yang harus dicek (urut):

1. **Service tidak tersambung ke `dokploy-network`.** Traefik hanya bisa
   menjangkau container di network itu. Dokploy menyambungkannya otomatis, tapi
   ini tetap penyebab 404 paling sering, jadi layak dipastikan:
   ```bash
   docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' <container-frontend>
   # harus memuat dokploy-network
   docker network inspect dokploy-network --format '{{range .Containers}}{{.Name}} {{end}}'
   ```
2. **Domain belum di-redeploy.** Dokploy memakai label Traefik untuk compose, dan
   label itu baru dipasang saat deploy. Tambah domain, lalu Deploy ulang.
3. **Service Name / Port salah di tab Domains.** Harus cocok dengan nama service
   di compose (`frontend` + `3000`, `backend` + `8080`) dan path `/api` untuk backend.
4. **`container_name` masih dipakai.** Buang dari compose yang dijalankan Dokploy.
5. **A record domain belum mengarah ke IP server** sebelum domain ditambahkan,
   supaya sertifikat Let's Encrypt bisa terbit.

Verifikasi cepat dari dalam container:
```bash
docker exec dokploy-traefik wget -qO- http://<container-frontend>:3000/ | head -3
```

### Deploy gagal: `required variable DATABASE_PASSWORD is missing a value`

Ini **bukan** masalah `docker-compose.prod.yml`, tapi masalah lokasi file `.env` di server Dokploy.

`${DATABASE_PASSWORD:?...}` di-resolve oleh CLI Docker Compose dari: environment shell + file `.env` yang ada di **direktori tempat perintah `docker compose` dijalankan** (biasanya `/etc/dokploy/compose/<app-name>/code/`). Hanya menambah variabel di UI Dokploy tidak menolong kalau file `.env` tidak mendarat di direktori itu.

Cek penyebabnya di server:

```bash
# 1. Di mana .env ditulis, dan isinya lengkap?
find /etc/dokploy/compose -maxdepth 3 -name '.env' -exec sh -c 'echo "== $1"; cat "$1"' _ {} \;

# 2. composePath & isi env yang tersimpan di database Dokploy
docker exec -it $(docker ps -q -f name=dokploy-postgres) psql -U dokploy -d dokploy -c \
  "SELECT \"appName\", \"composePath\", \"sourceType\", length(coalesce(env,'')) AS env_len FROM compose;"
```

Kemungkinan hasil & solusinya:

| Temuan | Arti | Solusi |
|---|---|---|
| `env_len = 0` | Variabel disimpan di tempat lain (Environment project/shared), bukan di compose service | Pindahkan ke **compose service → Environment → Save**, lalu Deploy |
| `.env` ada di `/etc/dokploy/compose/<app>/.env` tapi `code/.env` kosong/tidak ada | Bug Dokploy #2777 (`composePath` sisa dari provider Git saat pindah ke Raw → `.env` ditulis satu level di atas) | Set `composePath` di General ke `docker-compose.prod.yml`, Save, Deploy ulang |
| `code/.env` ada tapi variabelnya kurang | Nama variabel salah/kurang | Samakan dengan blok Environment di atas |

Workaround cepat kalau tidak mau mengutak-atik `composePath`: copy file `.env`-nya, lalu tambahkan `--env-file ../.env` di **Advanced → Command** (command ini menggantikan default, jadi tulis lengkap):

```
compose -p <app-name> -f docker-compose.prod.yml --env-file ../.env up -d --build --remove-orphans --force-recreate
```

### Service tidak start
- Check Dokploy logs untuk error messages
- Verify semua environment variables sudah set
- Check container health status di dashboard

### Backend tidak bisa connect ke database
- Verify postgres container running
- Check DATABASE_* env vars match
- Review backend logs di Dokploy

### Frontend tidak load
- Check build logs di Dokploy
- Verify NEXT_PUBLIC_API_URL correct
- Ensure port 3000 exposed dan routing configured

### CV upload gagal
- Check cv_storage volume mounted
- Review backend logs
- Verify MAX_CV_SIZE setting
- Verify env vars: `docker compose -f docker-compose.prod.yml config`

### Frontend tidak load
- Check build logs: `docker compose -f docker-compose.prod.yml logs frontend`
- Verify NEXT_PUBLIC_API_URL di build args

### CV upload gagal
- Check storage volume: `docker volume inspect himatris-oprec_cv_storage`
- Check backend logs: `docker compose -f docker-compose.prod.yml logs backend`
- Verify permissions di container backend
