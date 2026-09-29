# API.md

# HIMATRIS Open Recruitment System

**Version:** 1.0
**Status:** Draft
**API Style:** REST API
**Backend:** Golang + Gin
**Database:** PostgreSQL

---

# 1. API Overview

Backend HIMATRIS Open Recruitment menyediakan REST API yang digunakan oleh:

* Public Website.
* Registration Form.
* Result Checking.
* Admin Dashboard.
* Admin Management.

Arsitektur:

```text
Next.js
   │
   │ HTTP / HTTPS
   ▼
Gin REST API
   │
   ├── PostgreSQL
   │
   └── Local File Storage
```

---

# 2. Base URL

Development:

```text
http://localhost:8080/api
```

Production:

```text
https://your-domain.com/api
```

Base URL harus disimpan sebagai environment variable pada frontend.

Contoh:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

---

# 3. API Versioning

MVP menggunakan:

```text
/api/v1
```

Sehingga endpoint:

```text
/api/v1/auth/login
/api/v1/public/registration
/api/v1/public/result
/api/v1/admin/applicants
```

Versioning digunakan agar API dapat dikembangkan tanpa merusak client lama.

---

# 4. HTTP Methods

| Method | Usage                  |
| ------ | ---------------------- |
| GET    | Mengambil data         |
| POST   | Membuat data           |
| PUT    | Mengubah seluruh data  |
| PATCH  | Mengubah sebagian data |
| DELETE | Menghapus data         |

---

# 5. Response Format

Semua response JSON mengikuti struktur standar.

## Success

```json
{
  "success": true,
  "message": "Data berhasil diambil.",
  "data": {}
}
```

## Error

```json
{
  "success": false,
  "message": "Terjadi kesalahan.",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {}
  }
}
```

---

# 6. HTTP Status Codes

| Status | Usage                        |
| -----: | ---------------------------- |
|    200 | Request berhasil             |
|    201 | Resource berhasil dibuat     |
|    204 | Berhasil tanpa response body |
|    400 | Bad request                  |
|    401 | Tidak terautentikasi         |
|    403 | Tidak memiliki akses         |
|    404 | Resource tidak ditemukan     |
|    409 | Conflict                     |
|    422 | Validation error             |
|    429 | Too many requests            |
|    500 | Internal server error        |

---

# 7. Authentication

Admin menggunakan authentication berbasis token.

Recommended:

```text
JWT
```

Setelah login berhasil:

```text
Client
   │
   │ POST /auth/login
   ▼
Backend
   │
   │ JWT
   ▼
Client
```

Request protected endpoint:

```http
Authorization: Bearer <access_token>
```

Catatan keamanan:

- Tidak ada endpoint pendaftaran akun publik. Akun admin dibuat dari panel admin
  (`POST /admin/users`, butuh token) atau lewat seed migrasi.
- Token diperiksa ulang ke database setiap request: akun yang dinonaktifkan
  (`INACTIVE`) atau dihapus langsung kehilangan akses, tanpa menunggu token
  kedaluwarsa.
- `POST /auth/login` dibatasi 10 percobaan/menit per IP (`429` bila lewat).

---

# 8. Authentication Endpoints

## POST `/auth/login`

Login admin.

### Request

```json
{
  "username": "admin",
  "password": "password"
}
```

Username dapat diganti dengan email.

### Response

```json
{
  "success": true,
  "message": "Login berhasil.",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "admin": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "admin",
      "email": "admin@himatris.local"
    }
  }
}
```

### Errors

```text
401 INVALID_CREDENTIALS
403 ACCOUNT_INACTIVE
```

---

# 9. Public API

Public endpoint tidak membutuhkan authentication.

---

# 10. GET Registration Status

## GET `/public/registration`

Mengambil informasi periode Open Recruitment.

Urutan pemilihan periode:

```text
1. Periode yang sedang dibuka (now() di antara start_at dan end_at)
2. Kalau tidak ada, periode terakhir (start_at terbaru) apa pun statusnya
3. Kalau belum ada periode sama sekali, data bernilai null
```

Poin 2 penting untuk halaman depan: saat pendaftaran sudah ditutup, pengunjung
tetap melihat periode terakhir beserta tanggalnya dan status `CLOSED`, bukan
halaman kosong.

### Response

```json
{
  "success": true,
  "message": "Registration status berhasil diambil.",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "OPREC HIMATRIS 2026",
    "start_at": "2026-09-15T01:00:00Z",
    "end_at": "2026-09-30T16:59:00Z",
    "status": "CLOSED"
  }
}
```

Status:

```text
UPCOMING  pendaftaran belum dibuka
OPEN      pendaftaran sedang dibuka
CLOSED    pendaftaran sudah ditutup
```

---

# 11. GET Public Divisions

## GET `/public/divisions`

Mengambil seluruh Divisi aktif.

### Response

```json
{
  "success": true,
  "message": "Divisi berhasil diambil.",
  "data": [
    {
      "id": "uuid",
      "name": "PSDM",
      "description": "Pengembangan sumber daya manusia.",
      "image_path": "divisions/uuid.jpg"
    },
    {
      "id": "uuid",
      "name": "Kajian Strategis",
      "description": "Divisi kajian strategis.",
      "image_path": null
    }
  ]
}
```

`image_path` adalah path relatif di dalam storage backend. URL publiknya:
`{API_URL}/storage/{image_path}`. Bernilai `null` kalau admin belum mengunggah gambar.

---

# 12. GET Public Program Studies

## GET `/public/program-studies`

Mengambil Program Studi aktif.

### Response

```json
{
  "success": true,
  "message": "Program Studi berhasil diambil.",
  "data": [
    {
      "id": "uuid",
      "name": "Teknik Informatika",
      "code": "TI"
    },
    {
      "id": "uuid",
      "name": "Rekayasa Perangkat Lunak",
      "code": "RPL"
    }
  ]
}
```

---

# 13. POST Registration

## POST `/public/applications`

Membuat pendaftaran baru.

Content-Type:

```http
multipart/form-data
```

Karena request memiliki file CV.

---

## Form Data

| Field             | Type   |    Required |
| ----------------- | ------ | ----------: |
| name              | string |         Yes |
| nim               | string |         Yes |
| class             | string |         Yes |
| program_study_id  | UUID   |         Yes |
| division_1_id     | UUID   |         Yes |
| division_1_reason | string |         Yes |
| division_2_id     | UUID   |          No |
| division_2_reason | string | Conditional |
| cv                | file   |         Yes |

---

## Example

```text
name:
Hafiz

nim:
23010001

class:
TI-2A

program_study_id:
uuid

division_1_id:
uuid

division_1_reason:
Saya tertarik dengan pengembangan anggota.

division_2_id:
uuid

division_2_reason:
Saya juga tertarik dengan kegiatan organisasi.

cv:
CV_Hafiz.pdf
```

---

# 14. Registration Validation

Backend wajib melakukan validasi.

### Name

```text
Required
Minimum 3 characters
Maximum 150 characters
```

### NIM

```text
Required
Maximum 50 characters
```

### Class

```text
Required
Maximum 50 characters
```

### Program Study

Harus:

```text
exists
AND
is_active = true
AND
deleted_at IS NULL
```

### Division 1

Harus:

```text
exists
AND
is_active = true
AND
deleted_at IS NULL
```

### Division 2

Jika ada:

```text
exists
AND
is_active = true
AND
deleted_at IS NULL
```

dan:

```text
division_2_id != division_1_id
```

### CV

Recommended:

```text
PDF
Maximum 5 MB
```

---

# 15. Registration Success

### Response

```json
{
  "success": true,
  "message": "Pendaftaran berhasil.",
  "data": {
    "id": "uuid",
    "nim": "23010001",
    "status": "PENDING",
    "registered_at": "2026-09-15T08:30:00+07:00"
  }
}
```

---

# 16. Registration Errors

## Registration Closed

HTTP:

```text
403
```

Response:

```json
{
  "success": false,
  "message": "Pendaftaran sedang tidak dibuka.",
  "error": {
    "code": "REGISTRATION_NOT_OPEN"
  }
}
```

---

## Duplicate NIM

HTTP:

```text
409
```

Response:

```json
{
  "success": false,
  "message": "NIM sudah terdaftar.",
  "error": {
    "code": "DUPLICATE_NIM"
  }
}
```

---

## Invalid Division

```json
{
  "success": false,
  "message": "Divisi yang dipilih tidak tersedia.",
  "error": {
    "code": "INVALID_DIVISION"
  }
}
```

---

## Invalid CV

```json
{
  "success": false,
  "message": "File CV tidak valid.",
  "error": {
    "code": "INVALID_CV"
  }
}
```

---

# 17. GET Result

## GET `/public/result?nim=23010001`

Mengecek hasil seleksi.

### Request

```http
GET /api/v1/public/result?nim=23010001
```

### Response — Pending

```json
{
  "success": true,
  "message": "Hasil seleksi berhasil ditemukan.",
  "data": {
    "nim": "23010001",
    "name": "Nama Pendaftar",
    "status": "PENDING"
  }
}
```

### Response — Accepted

```json
{
  "success": true,
  "message": "Hasil seleksi berhasil ditemukan.",
  "data": {
    "nim": "23010001",
    "name": "Nama Pendaftar",
    "status": "ACCEPTED",
    "accepted_division": {
      "id": "uuid",
      "name": "PSDM"
    }
  }
}
```

### Response — Rejected

```json
{
  "success": true,
  "message": "Hasil seleksi berhasil ditemukan.",
  "data": {
    "nim": "23010001",
    "name": "Nama Pendaftar",
    "status": "REJECTED"
  }
}
```

---

# 18. Result Not Found

Jika NIM tidak ditemukan:

HTTP:

```text
404
```

```json
{
  "success": false,
  "message": "Data pendaftar tidak ditemukan.",
  "error": {
    "code": "APPLICANT_NOT_FOUND"
  }
}
```

Public API hanya mengembalikan informasi minimum.

---

# 19. Admin API

Semua endpoint berikut membutuhkan:

```http
Authorization: Bearer <token>
```

---

# 20. Dashboard

## GET `/admin/dashboard`

Mengambil statistik dashboard.

### Response

```json
{
  "success": true,
  "message": "Dashboard berhasil diambil.",
  "data": {
    "applicants": {
      "total": 250,
      "pending": 100,
      "accepted": 90,
      "rejected": 60
    },
    "master_data": {
      "divisions": 8,
      "program_studies": 5
    },
    "registration": {
      "status": "OPEN",
      "name": "OPREC HIMATRIS 2026"
    }
  }
}
```

---

# 21. Applicant Management

## GET `/admin/applicants`

Mengambil daftar pendaftar.

---

## Query Parameters

```text
page
limit
search
nim
program_study_id
division_id
status
registration_period_id
sort
order
```

Contoh:

```http
GET /api/v1/admin/applicants?page=1&limit=20&search=hafiz&status=PENDING
```

---

# 22. Pagination

Default:

```text
page = 1
limit = 20
```

Maximum:

```text
limit = 100
```

### Response

```json
{
  "success": true,
  "message": "Data pendaftar berhasil diambil.",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 250,
      "total_pages": 13
    }
  }
}
```

---

# 23. Applicant List Item

```json
{
  "id": "uuid",
  "name": "Hafiz",
  "nim": "23010001",
  "class": "TI-2A",
  "program_study": {
    "id": "uuid",
    "name": "Teknik Informatika"
  },
  "division_1": {
    "id": "uuid",
    "name": "PSDM"
  },
  "division_2": {
    "id": "uuid",
    "name": "Humas"
  },
  "selection_status": "PENDING",
  "created_at": "2026-09-15T08:30:00Z"
}
```

---

# 24. GET Applicant Detail

## GET `/admin/applicants/:id`

Mengambil detail pendaftar.

### Response

```json
{
  "success": true,
  "message": "Detail pendaftar berhasil diambil.",
  "data": {
    "id": "uuid",
    "name": "Hafiz",
    "nim": "23010001",
    "class": "TI-2A",

    "program_study": {
      "id": "uuid",
      "name": "Teknik Informatika"
    },

    "division_1": {
      "id": "uuid",
      "name": "PSDM",
      "reason": "Saya tertarik..."
    },

    "division_2": {
      "id": "uuid",
      "name": "Humas",
      "reason": "Saya juga tertarik..."
    },

    "cv": {
      "id": "uuid",
      "original_name": "CV_Hafiz.pdf",
      "mime_type": "application/pdf",
      "size_bytes": 123456
    },

    "selection_status": "PENDING",

    "created_at": "2026-09-15T08:30:00Z",
    "updated_at": "2026-09-15T08:30:00Z"
  }
}
```

---

# 24.1. Bulk Delete Applicants

## POST `/admin/applicants/bulk-delete`

Menghapus beberapa pendaftar sekaligus beserta berkas pendaftarannya.
Maksimal 500 pendaftar per permintaan.

### Request

```json
{
  "ids": ["550e8400-e29b-41d4-a716-446655440000", "7c9e6679-7425-40de-944b-e07fc1f90ae7"]
}
```

### Response

```json
{
  "success": true,
  "message": "2 pendaftar berhasil dihapus.",
  "data": {
    "deleted": 2
  }
}
```

Berkas fisik (CV, poster, portofolio, surat izin) ikut dihapus dari storage,
dan barisnya di tabel `files` terhapus otomatis lewat cascade.

### Errors

```text
422 VALIDATION_ERROR   daftar kosong, id bukan uuid, atau lebih dari 500 id
404 NOT_FOUND          tidak ada id yang cocok
```

---

# 25. Update Selection Status

## PATCH `/admin/applicants/:id/status`

Mengubah status seleksi.

### Request

```json
{
  "status": "ACCEPTED"
}
```

Valid:

```text
PENDING
ACCEPTED
REJECTED
```

### Response

```json
{
  "success": true,
  "message": "Status pendaftar berhasil diperbarui.",
  "data": {
    "id": "uuid",
    "status": "ACCEPTED",
    "updated_at": "2026-09-20T10:30:00Z"
  }
}
```

---

# 26. CV Access

## GET `/admin/applicants/:id/cv`

Mengakses CV pendaftar.

Endpoint harus protected.

Response:

```http
Content-Type: application/pdf
Content-Disposition: inline
```

Backend membaca file berdasarkan metadata yang tersimpan pada database.

Frontend dapat:

* Membuka CV pada browser.
* Menampilkan PDF viewer.
* Menyediakan tombol download.

---

# 27. Division Management

## GET `/admin/divisions`

Mengambil seluruh Divisi.

Query:

```text
page
limit
search
is_active
include_deleted
```

---

# 28. POST Division

## POST `/admin/divisions`

### Request

```json
{
  "name": "PSDM",
  "description": "Pengembangan sumber daya manusia.",
  "is_active": true
}
```

### Response

```json
{
  "success": true,
  "message": "Divisi berhasil dibuat.",
  "data": {
    "id": "uuid",
    "name": "PSDM",
    "description": "Pengembangan sumber daya manusia.",
    "is_active": true
  }
}
```

---

# 29. PUT Division

## PUT `/admin/divisions/:id`

### Request

```json
{
  "name": "PSDM",
  "description": "Pengembangan sumber daya manusia HIMATRIS.",
  "is_active": true
}
```

---

# 30. DELETE Division

## DELETE `/admin/divisions/:id`

Menghapus Divisi.

Recommended behavior:

```text
Soft Delete
```

### Response

```json
{
  "success": true,
  "message": "Divisi berhasil dihapus."
}
```

Jika Divisi sudah digunakan oleh applicant, record tidak boleh dihapus secara fisik.

---

# 31. Program Study Management

## GET `/admin/program-studies`

Mengambil Program Studi.

Query:

```text
page
limit
search
is_active
include_deleted
```

---

# 32. POST Program Study

## POST `/admin/program-studies`

### Request

```json
{
  "name": "Teknik Informatika",
  "code": "TI",
  "is_active": true
}
```

### Response

```json
{
  "success": true,
  "message": "Program Studi berhasil dibuat.",
  "data": {
    "id": "uuid",
    "name": "Teknik Informatika",
    "code": "TI",
    "is_active": true
  }
}
```

---

# 33. PUT Program Study

## PUT `/admin/program-studies/:id`

### Request

```json
{
  "name": "Teknik Informatika",
  "code": "TI",
  "is_active": true
}
```

---

# 34. DELETE Program Study

## DELETE `/admin/program-studies/:id`

Menggunakan soft delete.

### Response

```json
{
  "success": true,
  "message": "Program Studi berhasil dihapus."
}
```

---

# 35. Registration Period Management

## GET `/admin/registration-periods`

Mengambil seluruh periode OPREC.

### Response

```json
{
  "success": true,
  "message": "Periode pendaftaran berhasil diambil.",
  "data": []
}
```

---

# 36. GET Active Registration Period

## GET `/admin/registration-periods/active`

Mengambil periode aktif.

### Response

```json
{
  "success": true,
  "message": "Periode aktif berhasil diambil.",
  "data": {
    "id": "uuid",
    "name": "OPREC HIMATRIS 2026",
    "start_at": "2026-09-15T01:00:00Z",
    "end_at": "2026-09-30T16:59:00Z",
    "status": "UPCOMING"
  }
}
```

---

# 37. POST Registration Period

## POST `/admin/registration-periods`

### Request

```json
{
  "name": "OPREC HIMATRIS 2026",
  "start_at": "2026-09-15T01:00:00Z",
  "end_at": "2026-09-30T16:59:00Z"
}
```

### Validation

```text
end_at > start_at
```

---

# 38. PUT Registration Period

## PUT `/admin/registration-periods/:id`

### Request

```json
{
  "name": "OPREC HIMATRIS 2026",
  "start_at": "2026-09-15T01:00:00Z",
  "end_at": "2026-09-30T16:59:00Z"
}
```

---

# 39. DELETE Registration Period

## DELETE `/admin/registration-periods/:id`

Periode tidak boleh dihapus apabila sudah memiliki applicant.

Recommended:

```text
ON DELETE RESTRICT
```

---

# 40. Excel Export

## GET `/admin/export/applicants`

Export seluruh data pendaftar.

### Query Parameters

```text
registration_period_id
status
program_study_id
division_id
```

Contoh:

```http
GET /api/v1/admin/export/applicants?registration_period_id=uuid
```

Response:

```http
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="HIMATRIS_OPREC_2026.xlsx"
```

Kolom berkas (CV, Poster, Portofolio, Surat Persetujuan) berisi tautan ke halaman
detail pendaftar di panel admin, bukan URL berkas langsung — berkas pendaftar
hanya bisa diunduh dengan token admin.

---

# 41. Excel Workbook Structure

Generated workbook:

```text
HIMATRIS_OPREC_2026.xlsx

├── Data Pendaftar
├── Statistik
├── Rekap Prodi
└── Rekap Divisi
```

---

# 42. Data Pendaftar Sheet

Column:

```text
No
Nama
NIM
Kelas
Program Studi
Divisi 1
Alasan Divisi 1
Divisi 2
Alasan Divisi 2
Status
Tanggal Pendaftaran
```

---

# 43. Statistik Sheet

Contoh:

```text
Total Pendaftar    250
Pending            100
Accepted            90
Rejected            60
```

---

# 44. Rekap Prodi Sheet

Contoh:

```text
Program Studi              Total
Teknik Informatika           100
Sistem Informasi              80
Rekayasa Perangkat Lunak      70
```

---

# 45. Rekap Divisi Sheet

Contoh:

```text
Divisi                Total
PSDM                    80
Kajian Strategis        60
Humas                   55
```

Jika applicant memilih dua divisi, data rekap dapat dihitung sebagai **jumlah pilihan**, bukan jumlah applicant unik.

---

# 46. API Error Codes

Standard error codes:

```text
VALIDATION_ERROR
INVALID_REQUEST

UNAUTHORIZED
INVALID_TOKEN
TOKEN_EXPIRED
FORBIDDEN

NOT_FOUND
APPLICANT_NOT_FOUND
DIVISION_NOT_FOUND
PROGRAM_STUDY_NOT_FOUND
REGISTRATION_PERIOD_NOT_FOUND

DUPLICATE_NIM
DUPLICATE_DIVISION
DUPLICATE_PROGRAM_STUDY

REGISTRATION_NOT_OPEN
REGISTRATION_CLOSED

INVALID_DIVISION
INVALID_PROGRAM_STUDY
INVALID_CV
CV_TOO_LARGE

EXPORT_FAILED

INTERNAL_SERVER_ERROR
```

---

# 47. Validation Error Format

Jika beberapa field invalid:

```json
{
  "success": false,
  "message": "Validasi gagal.",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "name": "Nama wajib diisi.",
      "nim": "NIM wajib diisi.",
      "division_1_id": "Divisi 1 wajib dipilih.",
      "cv": "CV wajib diupload."
    }
  }
}
```

Frontend dapat langsung memetakan error berdasarkan nama field.

---

# 48. Authentication Middleware

Protected routes:

```text
/admin/*
```

Middleware:

```text
AuthMiddleware
```

Flow:

```text
Request
   │
   ▼
Authorization Header
   │
   ▼
Validate JWT
   │
   ├── Invalid → 401
   │
   └── Valid
          │
          ▼
       Handler
```

---

# 49. Request Headers

JSON request:

```http
Content-Type: application/json
Authorization: Bearer <token>
```

File upload:

```http
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

Public request tidak membutuhkan Authorization.

---

# 50. CORS

Backend harus mengizinkan origin frontend.

Development:

```text
http://localhost:3000
```

Production:

```text
https://your-domain.com
```

Jangan menggunakan:

```text
Access-Control-Allow-Origin: *
```

untuk production apabila API menggunakan authentication.

---

# 51. Rate Limiting

Pembatas permintaan berjalan lewat Redis dengan hitungan per IP asli
(`X-Forwarded-For` hanya dipercaya dari jaringan internal/proxy).

Yang sudah diterapkan:

```text
GET  /public/result          120 permintaan / menit / IP
POST /public/applications     20 permintaan / menit / IP
```

Balasan saat melewati batas: HTTP `429`

```json
{
  "success": false,
  "message": "Terlalu banyak permintaan. Coba lagi sebentar lagi.",
  "error": { "code": "TOO_MANY_REQUESTS" }
}
```

Catatan:

* Limit dibuat longgar karena pengunjung kampus sering berbagi satu IP (NAT).
* Kalau Redis mati, pembatas ini otomatis dilewati (fail-open) supaya situs
  tetap melayani, bukan ikut tumbang.
* `POST /auth/login` belum dibatasi; kalau mau ditambahkan, pakai pola yang sama.

---

# 51.1 Cache Konten Publik

Endpoint publik berikut di-cache 30 detik di Redis dan dibuang otomatis begitu
admin mengubah data terkait:

```text
GET /public/registration
GET /public/settings
GET /public/divisions
GET /public/program-studies
```

Dampaknya: lonjakan pengunjung di halaman depan tidak semuanya sampai ke
PostgreSQL. `GET /public/result` sengaja **tidak** di-cache karena hasilnya
spesifik per NIM.

---

# 52. Result Lookup Protection

Karena hasil dapat dicari menggunakan NIM, endpoint result rawan enumeration
(NIM berpola, jadi sebagian bisa ditebak).

Yang berlaku sekarang:

* Endpoint hanya mengembalikan `nim`, `name`, `status`, dan `accepted_division`.
* Tidak mengembalikan applicant ID.
* Tidak mengembalikan CV atau berkas lain.
* Tidak mengembalikan Program Studi.
* Tidak mengembalikan alasan pendaftaran.
* NIM tidak ditemukan memakai pesan generik (`APPLICANT_NOT_FOUND`).

Belum diterapkan:

* **Rate limiting per IP.** Ini penting karena `name` ikut dikembalikan, jadi
  endpoint ini bisa dipakai untuk memanen nama pendaftar kalau ada yang
  menembak NIM berpola. Pasang di level route `/public/result`.
* Opsi masking nama (misal `Budi S*****`) kalau nama lengkap dianggap terlalu
  terbuka.

---

# 53. API Route Summary

## Public

```text
GET    /public/registration
GET    /public/settings
GET    /public/divisions
GET    /public/program-studies

POST   /public/applications

GET    /public/result
```

## Authentication

```text
POST   /auth/login
```

## Admin Dashboard

```text
GET    /admin/dashboard
```

## Applicants

```text
GET    /admin/applicants
GET    /admin/applicants/:id
PATCH  /admin/applicants/:id/status
DELETE /admin/applicants/:id
POST   /admin/applicants/bulk-delete
GET    /admin/applicants/:id/cv
```

## Divisions

```text
GET    /admin/divisions
POST   /admin/divisions
PUT    /admin/divisions/:id
DELETE /admin/divisions/:id
PUT    /admin/divisions/:id/image
DELETE /admin/divisions/:id/image
```

## Landing Page

```text
PUT    /admin/landing-hero
DELETE /admin/landing-hero
```

## Program Studies

```text
GET    /admin/program-studies
POST   /admin/program-studies
PUT    /admin/program-studies/:id
DELETE /admin/program-studies/:id
```

## Registration Period

```text
GET    /admin/registration-periods
GET    /admin/registration-periods/active
POST   /admin/registration-periods
PUT    /admin/registration-periods/:id
DELETE /admin/registration-periods/:id
```

## Export

```text
GET    /admin/export/applicants
```

---

# 54. API Architecture

Backend Gin direkomendasikan menggunakan struktur:

```text
internal/
│
├── handler/
│   ├── auth_handler.go
│   ├── public_handler.go
│   ├── applicant_handler.go
│   ├── division_handler.go
│   ├── program_study_handler.go
│   ├── registration_handler.go
│   └── export_handler.go
│
├── service/
│   ├── auth_service.go
│   ├── applicant_service.go
│   ├── division_service.go
│   ├── program_study_service.go
│   ├── registration_service.go
│   └── export_service.go
│
├── repository/
│   ├── admin_repository.go
│   ├── applicant_repository.go
│   ├── division_repository.go
│   ├── program_study_repository.go
│   └── registration_repository.go
│
├── middleware/
│   ├── auth.go
│   ├── cors.go
│   └── rate_limit.go
│
├── model/
│   ├── admin.go
│   ├── applicant.go
│   ├── division.go
│   ├── program_study.go
│   ├── registration_period.go
│   └── file.go
│
└── router/
    └── router.go
```

---

# 55. Request Flow

Contoh proses registration:

```text
Next.js
   │
   │ POST /public/applications
   ▼
Gin Router
   │
   ▼
Registration Handler
   │
   ▼
Registration Service
   │
   ├── Validate Period
   ├── Validate NIM
   ├── Validate Prodi
   ├── Validate Division
   ├── Validate CV
   │
   ▼
Applicant Repository
   │
   ▼
PostgreSQL
   │
   ▼
File Storage
   │
   ▼
Response
```

---

# 56. API Principles

API harus mengikuti prinsip:

### Consistency

Semua endpoint menggunakan format response yang konsisten.

### Validation

Validasi dilakukan di backend walaupun frontend sudah melakukan validasi.

### Security

Endpoint admin harus protected.

### Minimal Exposure

Public API hanya mengembalikan data yang memang diperlukan.

### Stateless

API tidak bergantung pada server-side session state untuk request API apabila menggunakan JWT.

### Maintainability

Business logic ditempatkan pada service layer, bukan langsung pada handler.

---

# 57. Definition of Done

API MVP dianggap selesai apabila:

* [ ] Admin dapat login.
* [ ] JWT berhasil dibuat.
* [ ] Protected route bekerja.
* [ ] Public dapat mengambil registration status.
* [ ] Public dapat mengambil Divisi.
* [ ] Public dapat mengambil Program Studi.
* [ ] Public dapat melakukan pendaftaran.
* [ ] Upload CV berhasil.
* [ ] Duplicate NIM ditolak.
* [ ] Public dapat mengecek hasil.
* [ ] Admin dapat melihat applicant.
* [ ] Admin dapat search applicant.
* [ ] Admin dapat filter applicant.
* [ ] Admin dapat melihat detail applicant.
* [ ] Admin dapat membuka CV.
* [ ] Admin dapat mengubah status seleksi.
* [ ] Admin dapat CRUD Divisi.
* [ ] Admin dapat CRUD Program Studi.
* [ ] Admin dapat mengatur periode.
* [ ] Admin dapat melakukan export Excel.
* [ ] Error response konsisten.
* [ ] Validation response dapat diproses frontend.
* [ ] Rate limiting diterapkan pada endpoint sensitif.
* [ ] CORS production dikonfigurasi dengan aman.

---

# 58. Future API

Fitur berikut dapat ditambahkan pada versi berikutnya:

```text
POST   /admin/interviews
GET    /admin/interviews
PUT    /admin/interviews/:id

POST   /admin/applicants/:id/scores
GET    /admin/applicants/:id/scores

GET    /admin/analytics

POST   /admin/notifications

GET    /admin/audit-logs
```

Untuk multi-event:

```text
GET    /admin/recruitment-events
POST   /admin/recruitment-events
PUT    /admin/recruitment-events/:id
DELETE /admin/recruitment-events/:id
```

---

# 59. Final API Structure

```text
/api/v1
│
├── /auth
│   └── POST /login
│
├── /public
│   ├── GET  /registration
│   ├── GET  /settings
│   ├── GET  /divisions
│   ├── GET  /program-studies
│   ├── POST /applications
│   └── GET  /result
│
└── /admin
    │
    ├── GET /dashboard
    │
    ├── /applicants
    │   ├── GET /
    │   ├── GET /:id
    │   ├── PATCH /:id/status
    │   ├── DELETE /:id
    │   ├── POST /bulk-delete
    │   └── GET /:id/cv
    │
    ├── /divisions
    │   ├── GET /
    │   ├── POST /
    │   ├── PUT /:id
    │   ├── DELETE /:id
    │   ├── PUT /:id/image
    │   └── DELETE /:id/image
    │
    ├── /landing-hero
    │   ├── PUT /
    │   └── DELETE /
    │
    ├── /program-studies
    │   ├── GET /
    │   ├── POST /
    │   ├── PUT /:id
    │   └── DELETE /:id
    │
    ├── /registration-periods
    │   ├── GET /
    │   ├── GET /active
    │   ├── POST /
    │   ├── PUT /:id
    │   └── DELETE /:id
    │
    └── /export
        └── GET /applicants
```

---

# 60. API Design Principle

API HIMATRIS Open Recruitment dibangun dengan prinsip:

> **Predictable, Secure, Simple, and Frontend-Friendly.**

Frontend Next.js harus dapat berkomunikasi dengan backend Gin tanpa mengetahui detail implementasi database.

Flow komunikasi:

```text
┌─────────────────┐
│    Next.js      │
│   + Shadcn UI   │
└────────┬────────┘
         │
         │ REST / JSON
         │ Multipart CV
         ▼
┌─────────────────┐
│    Gin API      │
├─────────────────┤
│ Handler         │
│ Service         │
│ Repository      │
│ Middleware      │
└────────┬────────┘
         │
    ┌────┴─────┐
    ▼          ▼
PostgreSQL   Storage
             CV Files
```

Dengan kontrak API ini, frontend dan backend dapat dikembangkan secara **parallel development** tanpa harus saling menunggu implementasi internal masing-masing.

---

# 61. Landing Images (Foto Hero & Gambar Divisi)

Gambar halaman depan diunggah dari halaman admin, bukan lewat repo.

## PUT `/admin/divisions/:id/image`

Mengunggah atau mengganti gambar sebuah Divisi. File lama otomatis dihapus.

### Request

`multipart/form-data`

```text
image = <file>
```

### Validasi

```text
Format: JPG, JPEG, PNG, WEBP
Ukuran maksimal: 8 MB
```

### Kompresi

Semua gambar dikompres di server sebelum disimpan:

```text
Resize  : lebar maksimum 1280 px (divisi) / 1920 px (hero), tidak diperbesar
Encode  : JPEG kualitas 82, latar putih untuk gambar transparan
Hasil   : selalu berekstensi .jpg
```

Foto dari kamera HP (3-8 MB) biasanya menyusut jadi ratusan KB, jadi storage dan
bandwidth tidak cepat penuh.

### Response

```json
{
  "success": true,
  "message": "Gambar divisi berhasil diunggah.",
  "data": {
    "image_path": "divisions/uuid.jpg"
  }
}
```

---

## DELETE `/admin/divisions/:id/image`

Menghapus gambar Divisi beserta file fisiknya.

---

## PUT `/admin/landing-hero`

Mengunggah atau mengganti foto background landing page.

### Request

`multipart/form-data`

```text
image = <file>
```

### Response

```json
{
  "success": true,
  "message": "Foto landing page berhasil diunggah.",
  "data": {
    "landing_hero_path": "landing/uuid.jpg"
  }
}
```

---

## DELETE `/admin/landing-hero`

Menghapus foto background landing page beserta file fisiknya.

---

## GET `/public/settings`

Mengambil pengaturan tampilan landing page.

### Response

```json
{
  "success": true,
  "message": "Pengaturan berhasil diambil.",
  "data": {
    "landing_hero_path": "landing/uuid.jpg"
  }
}
```

`landing_hero_path` bernilai `null` kalau admin belum mengunggah foto. Frontend
menyusun URL-nya menjadi `{API_URL}/storage/{path}`.

---

## Penyimpanan File

```text
storage/divisions/<uuid>.<ext>
storage/landing/<uuid>.<ext>
storage/cvs/<tahun>/<uuid>.pdf
storage/posters/<tahun>/<uuid>.<ext>
storage/portfolios/<tahun>/<uuid>.pdf
storage/parental_consents/<tahun>/<uuid>.pdf
```

Hanya gambar publik yang disajikan langsung lewat HTTP:

```text
GET /api/v1/storage/divisions/{path}
GET /api/v1/storage/landing/{path}
```

Berkas pendaftar (CV, poster, portofolio, surat persetujuan orang tua) **tidak**
disajikan publik. Berkas itu hanya bisa diunduh lewat endpoint admin
(`GET /admin/applicants/:id/cv|poster|portfolio|parental-consent`) yang
memerlukan token admin.

Karena nama filenya UUID, mengganti gambar menghasilkan URL baru sehingga cache
browser tidak perlu di-bust manual.
