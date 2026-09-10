# HIMATRIS Open Recruitment System

Sistem Open Recruitment HIMATRIS: pendaftaran mahasiswa, pengelolaan pendaftar, seleksi, pengecekan hasil, dan export Excel.

## Stack

- **Frontend:** Next.js + TypeScript + Shadcn UI + Tailwind CSS (`frontend/`)
- **Backend:** Golang + Gin (`backend/`)
- **Database:** PostgreSQL
- **Storage:** Local storage untuk CV (`storage/cvs/`)

## Development

```bash
# 1. Nyalakan PostgreSQL
docker compose up -d

# 2. Backend (terminal 1)
cd backend
cp ../.env.example .env
go mod tidy
go run ./cmd/server

# 3. Frontend (terminal 2)
cd frontend
cp ../.env.example .env.local
npm install
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api/v1
- Health check: http://localhost:8080/api/v1/health
- Login admin (seed): username `admin`, password `admin123`

## Docker (full stack)

```bash
docker compose up -d --build
```

Melayankan PostgreSQL (port 5432), Backend (port 8080), dan Frontend (port 3000) beserta migrasi otomatis. CV tersimpan di volume `cv_storage`.

## Dokumentasi

Lihat folder `docs/` (PRD, MVP, SCHEMA, API, PAGES, TASKLIST).
