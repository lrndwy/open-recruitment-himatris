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
- Pilih `docker-compose.prod.yml` sebagai deployment file
- Configure domain routing:
  - Backend: `your-domain.com/api` → port 8080
  - Frontend: `your-domain.com` → port 3000
- Deploy

### 4. Verify

```bash
# Check health endpoints
curl https://your-domain.com/api/v1/health
curl https://your-domain.com
```
# Test health
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
