# HIMATRIS Open Recruitment System

Sistem open recruitment untuk organisasi HIMATRIS dengan fitur manajemen pendaftar, penilaian, dan notifikasi hasil.

## Stack

- **Backend**: Go 1.26, Gin, PostgreSQL 17, golang-migrate
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Infra**: Docker, Docker Compose, Caddy (auto HTTPS)

## Features

### Core
- ✅ Registrasi pendaftar dengan upload CV (PDF, max 5MB)
- ✅ Admin dashboard untuk review & scoring pendaftar
- ✅ Approval flow dengan status: pending → in_review → accepted/rejected
- ✅ Email notification hasil seleksi
- ✅ JWT authentication untuk admin

### Tech Highlights
- RESTful API dengan OpenAPI spec
- Database migration dengan versioning
- File storage dengan UUID naming
- Health check endpoints
- Security headers & rate limiting ready

## Quick Start

### Development

```bash
# 1. Clone repo
git clone <repo-url>
cd himatris-oprec

# 2. Start services
docker compose up -d

# 3. Access
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8080/api/v1
# - API Docs: http://localhost:8080/api/v1/swagger
```

Backend otomatis run migrations. Default admin user dibuat saat startup.

### Production

Deployment via Dokploy (recommended) atau manual Docker Compose.

Lihat [DEPLOYMENT.md](./DEPLOYMENT.md) untuk production deployment dengan:
- Dokploy orchestration dengan auto SSL
- Health checks & persistent volumes
│   ├── internal/
│   │   ├── handlers/        # HTTP handlers
│   │   ├── middleware/      # Auth, CORS, logging
│   │   ├── models/          # DB models
│   │   ├── repositories/    # Data access layer
│   │   ├── services/        # Business logic
│   │   └── validators/      # Request validation
│   ├── migrations/          # SQL migrations
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App Router
│   │   ├── components/     # React components
├── docker-compose.dev.yml   # Dev environment
├── docker-compose.prod.yml  # Production deployment
├── .env.example             # Environment template
└── DEPLOYMENT.md            # Production guide

## API Endpoints

### Public
- `POST /api/v1/applicants` - Submit application
- `GET /api/v1/divisions` - List divisions

### Admin (requires JWT)
- `POST /api/v1/auth/login` - Admin login
- `GET /api/v1/applicants` - List applicants (filterable)
- `GET /api/v1/applicants/:id` - Applicant detail
- `PUT /api/v1/applicants/:id/status` - Update status
- `PUT /api/v1/applicants/:id/score` - Set score
- `GET /api/v1/applicants/:id/cv` - Download CV

Lihat OpenAPI spec di `/api/v1/swagger` untuk detail lengkap.

## Environment Variables

Lihat `.env.example` untuk development dan `.env.production` untuk production template.

Required untuk production:
- `DATABASE_PASSWORD` - Strong database password
- `JWT_SECRET` - Random 32+ char string (generate: `openssl rand -hex 32`)
- `FRONTEND_URL` - Full domain URL (e.g., https://oprec.himatris.com)
- `NEXT_PUBLIC_API_URL` - API base URL (e.g., https://oprec.himatris.com/api/v1)

## Development

### Backend

```bash
cd backend
go run cmd/server/main.go
```

Requires PostgreSQL running. Set `DATABASE_*` env vars atau gunakan `.env` file.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL` untuk point ke backend.

### Migrations

```bash
cd backend
# Create new migration
migrate create -ext sql -dir migrations -seq migration_name

# Run migrations
migrate -path migrations -database "postgres://user:pass@localhost:5432/dbname?sslmode=disable" up
```

Atau jalankan via binary yang di-build di Dockerfile.

## Testing

```bash
# Backend unit tests (TODO)
cd backend && go test ./...

# Frontend (TODO)
cd frontend && npm test
```

## Security

- JWT dengan expiry configurable
- Password hashing dengan bcrypt
- CORS configured per environment
- File upload size limits enforced
- SQL injection protection via parameterized queries
- Security headers via Caddy in production

## License

[Tambahkan license jika ada]

## Contributing

[Tambahkan contribution guidelines jika ada]
