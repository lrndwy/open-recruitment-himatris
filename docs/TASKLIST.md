# TASKLIST.md

# HIMATRIS OPREC — Development Task List

Dokumen ini berisi daftar task implementasi website Open Recruitment HIMATRIS berdasarkan dokumen:

* `MVP.md`
* `PRD.md`
* `SCHEMA.md`
* `API.md`
* `PAGES.md`
* `DESIGN.md`

Task disusun berdasarkan urutan pengerjaan agar development dapat dilakukan secara bertahap dari setup project hingga deployment.

---

# 1. PROJECT SETUP

## 1.1 Repository

* [ ] Buat repository project HIMATRIS OPREC
* [ ] Buat branch `main`
* [ ] Buat branch `development`
* [ ] Buat `.gitignore`
* [ ] Buat `README.md`
* [ ] Buat `LICENSE` jika diperlukan
* [ ] Buat `.env.example`

## 1.2 Struktur Project

* [ ] Buat folder `frontend/`
* [ ] Buat folder `backend/`
* [ ] Buat folder `storage/`
* [ ] Buat folder `docker/`
* [ ] Buat `docker-compose.yml`

Target struktur:

```text
himatris-oprec/
├── frontend/
├── backend/
├── storage/
├── docker/
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

# 2. FRONTEND SETUP

## 2.1 Next.js

* [ ] Inisialisasi Next.js
* [ ] Gunakan TypeScript
* [ ] Konfigurasi App Router
* [ ] Konfigurasi ESLint
* [ ] Konfigurasi Tailwind CSS
* [ ] Install Shadcn UI
* [ ] Konfigurasi path alias `@/*`

## 2.2 Shadcn UI

Install component yang dibutuhkan:

* [ ] Button
* [ ] Input
* [ ] Textarea
* [ ] Label
* [ ] Select
* [ ] Checkbox
* [ ] Radio Group
* [ ] Dialog
* [ ] Alert Dialog
* [ ] Table
* [ ] Badge
* [ ] Card
* [ ] Dropdown Menu
* [ ] Tooltip
* [ ] Calendar
* [ ] Popover
* [ ] Sheet
* [ ] Skeleton
* [ ] Alert
* [ ] Sonner

## 2.3 Frontend Library

* [ ] Setup API client
* [ ] Setup environment variable API URL
* [ ] Setup authentication helper
* [ ] Setup form validation
* [ ] Setup file validation
* [ ] Setup toast notification
* [ ] Setup error handler
* [ ] Setup loading state
* [ ] Setup reusable components

---

# 3. BACKEND SETUP

## 3.1 Gin

* [ ] Inisialisasi Go module
* [ ] Install Gin
* [ ] Buat HTTP server
* [ ] Setup router
* [ ] Setup middleware
* [ ] Setup graceful shutdown

## 3.2 Backend Dependency

* [ ] PostgreSQL driver
* [ ] JWT library
* [ ] Password hashing
* [ ] UUID library
* [ ] Validator
* [ ] CORS middleware
* [ ] Logging
* [ ] Configuration loader

## 3.3 Environment

Buat konfigurasi:

* [ ] `PORT`
* [ ] `DATABASE_URL`
* [ ] `JWT_SECRET`
* [ ] `JWT_EXPIRES_IN`
* [ ] `STORAGE_PATH`
* [ ] `MAX_CV_SIZE`
* [ ] `FRONTEND_URL`

---

# 4. DATABASE

## 4.1 PostgreSQL

* [ ] Setup PostgreSQL
* [ ] Buat database development
* [ ] Setup database connection
* [ ] Setup connection pooling
* [ ] Setup migration system

## 4.2 Extensions

* [ ] Enable `pgcrypto`
* [ ] Enable `pg_trgm`

## 4.3 Enum

* [ ] Create `selection_status`
* [ ] Create `admin_status`

Values:

```text
selection_status:
- PENDING
- ACCEPTED
- REJECTED

admin_status:
- ACTIVE
- INACTIVE
```

## 4.4 Tables

### Admin

* [ ] Create `admins`

Fields:

```text
id
username
password_hash
status
created_at
updated_at
```

### Registration Period

* [ ] Create `registration_periods`

Fields:

```text
id
name
start_at
end_at
created_at
updated_at
```

### Program Studies

* [ ] Create `program_studies`

Fields:

```text
id
name
code
is_active
deleted_at
created_at
updated_at
```

### Divisions

* [ ] Create `divisions`

Fields:

```text
id
name
description
is_active
deleted_at
created_at
updated_at
```

### Applicants

* [ ] Create `applicants`

Fields:

```text
id
registration_period_id
program_study_id
name
nim
class
division_1_id
division_1_reason
division_2_id
division_2_reason
selection_status
created_at
updated_at
```

### Files

* [ ] Create `files`

Fields:

```text
id
applicant_id
original_name
stored_name
path
mime_type
extension
size_bytes
created_at
```

---

# 5. DATABASE CONSTRAINT & INDEX

## 5.1 Constraints

* [ ] `registration_periods.end_at > start_at`
* [ ] Unique `(registration_period_id, nim)`
* [ ] Division 2 tidak boleh sama dengan Division 1
* [ ] Division 2 reason wajib jika Division 2 dipilih
* [ ] File size harus lebih dari 0

## 5.2 Foreign Keys

* [ ] Applicant → Registration Period
* [ ] Applicant → Program Study
* [ ] Applicant → Division 1
* [ ] Applicant → Division 2
* [ ] File → Applicant

## 5.3 Index

* [ ] Index NIM
* [ ] Index registration period
* [ ] Index program study
* [ ] Index division 1
* [ ] Index division 2
* [ ] Index selection status
* [ ] Index created_at
* [ ] Trigram index untuk nama

---

# 6. DATABASE SEEDING

* [ ] Buat seed admin
* [ ] Buat seed Program Study
* [ ] Buat seed Division
* [ ] Buat contoh Registration Period
* [ ] Pastikan password admin menggunakan hash
* [ ] Test seed berhasil

---

# 7. BACKEND ARCHITECTURE

Buat struktur:

```text
backend/
├── cmd/
│   └── server/
├── internal/
│   ├── handler/
│   ├── service/
│   ├── repository/
│   ├── model/
│   ├── middleware/
│   ├── validator/
│   ├── storage/
│   └── router/
├── migrations/
├── config/
└── go.mod
```

## 7.1 Model

* [ ] Admin model
* [ ] RegistrationPeriod model
* [ ] ProgramStudy model
* [ ] Division model
* [ ] Applicant model
* [ ] File model

## 7.2 Repository

* [ ] Admin repository
* [ ] Registration period repository
* [ ] Program study repository
* [ ] Division repository
* [ ] Applicant repository
* [ ] File repository

## 7.3 Service

* [ ] Authentication service
* [ ] Registration service
* [ ] Applicant service
* [ ] Division service
* [ ] Program Study service
* [ ] Registration Period service
* [ ] Export service

---

# 8. AUTHENTICATION

## Backend

* [ ] Implement login
* [ ] Validate username
* [ ] Validate password
* [ ] Compare password hash
* [ ] Generate JWT
* [ ] Validate JWT
* [ ] Implement authentication middleware
* [ ] Implement active admin check
* [ ] Implement unauthorized response

## Frontend

* [ ] Login form
* [ ] Store access token
* [ ] Auth state
* [ ] Protected admin routes
* [ ] Logout
* [ ] Redirect unauthenticated user to login

---

# 9. REGISTRATION PERIOD

## Backend

* [ ] GET registration period
* [ ] POST registration period
* [ ] PUT/PATCH registration period
* [ ] DELETE registration period
* [ ] Validate start/end datetime
* [ ] Determine `UPCOMING`
* [ ] Determine `OPEN`
* [ ] Determine `CLOSED`

## Frontend

* [ ] Registration period management page
* [ ] Create period dialog
* [ ] Edit period dialog
* [ ] Delete period confirmation
* [ ] Display current status
* [ ] Display start date/time
* [ ] Display end date/time

---

# 10. PROGRAM STUDY MANAGEMENT

## Backend

* [ ] GET program studies
* [ ] POST program study
* [ ] PATCH program study
* [ ] DELETE program study
* [ ] Validate duplicate name
* [ ] Validate duplicate code
* [ ] Implement soft delete
* [ ] Support active/inactive

## Frontend

* [ ] Program Study page
* [ ] Program Study table
* [ ] Add Program Study
* [ ] Edit Program Study
* [ ] Delete Program Study
* [ ] Activate Program Study
* [ ] Deactivate Program Study
* [ ] Search Program Study

---

# 11. DIVISION MANAGEMENT

## Backend

* [ ] GET divisions
* [ ] POST division
* [ ] PATCH division
* [ ] DELETE division
* [ ] Validate duplicate division
* [ ] Implement soft delete
* [ ] Support active/inactive

## Frontend

* [ ] Division page
* [ ] Division table
* [ ] Add Division
* [ ] Edit Division
* [ ] Delete Division
* [ ] Activate Division
* [ ] Deactivate Division
* [ ] Search Division

---

# 12. PUBLIC LANDING PAGE

Route:

```text
/
```

* [ ] Navbar
* [ ] Hero section
* [ ] Organization introduction
* [ ] Registration status
* [ ] Registration period information
* [ ] Division information
* [ ] CTA "Daftar Sekarang"
* [ ] CTA "Cek Hasil"
* [ ] Footer
* [ ] Responsive mobile layout

## Data

* [ ] Fetch registration period
* [ ] Fetch divisions
* [ ] Calculate registration status
* [ ] Handle loading
* [ ] Handle error

---

# 13. REGISTRATION PAGE

Route:

```text
/register
```

## 13.1 Registration State

* [ ] Fetch registration period
* [ ] Check registration status
* [ ] Block form when registration is closed
* [ ] Display upcoming state
* [ ] Display closed state

## 13.2 Form

### Personal Information

* [ ] Input Nama
* [ ] Input NIM
* [ ] Input Kelas
* [ ] Select Program Studi

### Division Preference

* [ ] Select Division 1
* [ ] Input Alasan Division 1
* [ ] Select Division 2
* [ ] Input Alasan Division 2
* [ ] Prevent Division 1 = Division 2

### CV

* [ ] Upload CV
* [ ] Validate PDF
* [ ] Validate maximum file size
* [ ] Display filename
* [ ] Allow remove file
* [ ] Drag & drop support

## 13.3 Validation

* [ ] Nama required
* [ ] NIM required
* [ ] Kelas required
* [ ] Program Study required
* [ ] Division 1 required
* [ ] Division 1 reason required
* [ ] Division 2 optional
* [ ] Division 2 reason required when Division 2 selected
* [ ] CV required
* [ ] CV must be PDF
* [ ] CV max 5MB

## 13.4 Submission

* [ ] Submit multipart/form-data
* [ ] Show loading state
* [ ] Prevent double submit
* [ ] Handle duplicate NIM
* [ ] Handle closed registration
* [ ] Handle validation error
* [ ] Handle server error
* [ ] Show success state

---

# 14. RESULT CHECKING

Route:

```text
/result
```

* [ ] NIM input
* [ ] Search button
* [ ] Validate NIM
* [ ] Call result API
* [ ] Loading state
* [ ] Error state
* [ ] Result state

## Result Status

### PENDING

* [ ] Display pending information

### ACCEPTED

* [ ] Display accepted information

### REJECTED

* [ ] Display rejected information

## Security

* [ ] Do not expose unnecessary applicant data
* [ ] Rate limit result lookup
* [ ] Do not expose CV
* [ ] Do not expose selection notes/internal data

---

# 15. ADMIN DASHBOARD

Route:

```text
/admin
```

## Metrics

* [ ] Total applicants
* [ ] Pending applicants
* [ ] Accepted applicants
* [ ] Rejected applicants
* [ ] Total Program Studies
* [ ] Total Divisions

## Additional Data

* [ ] Applicant statistics
* [ ] Applicants by Program Study
* [ ] Applicants by Division
* [ ] Recent applicants

## UI

* [ ] Sidebar
* [ ] Header
* [ ] Statistic cards
* [ ] Tables
* [ ] Charts if needed
* [ ] Responsive layout

---

# 16. APPLICANT MANAGEMENT

Route:

```text
/admin/applicants
```

## Table

* [ ] Applicant name
* [ ] NIM
* [ ] Class
* [ ] Program Study
* [ ] Division 1
* [ ] Division 2
* [ ] Selection Status
* [ ] Registration Date
* [ ] Actions

## Search

* [ ] Search by name
* [ ] Search by NIM
* [ ] Debounce search 300–500ms

## Filter

* [ ] Filter Program Study
* [ ] Filter Division
* [ ] Filter Status
* [ ] Filter Registration Period

## Pagination

* [ ] Pagination
* [ ] Page size
* [ ] Current page
* [ ] Total records

## Actions

* [ ] View applicant
* [ ] Change status
* [ ] View CV
* [ ] Download CV

---

# 17. APPLICANT DETAIL

Route:

```text
/admin/applicants/[id]
```

## Information

* [ ] Name
* [ ] NIM
* [ ] Class
* [ ] Program Study
* [ ] Division 1
* [ ] Reason Division 1
* [ ] Division 2
* [ ] Reason Division 2
* [ ] Registration Period
* [ ] Registration Date
* [ ] Current Status

## CV

* [ ] Display CV filename
* [ ] View CV
* [ ] Download CV

## Selection

* [ ] Display current status
* [ ] Set PENDING
* [ ] Set ACCEPTED
* [ ] Set REJECTED
* [ ] Confirmation before changing status

---

# 18. EXCEL EXPORT

Route:

```text
/admin/export/applicants
```

## Export

* [ ] Export all applicants
* [ ] Export filtered applicants
* [ ] Support registration period filter
* [ ] Support Program Study filter
* [ ] Support Division filter
* [ ] Support selection status filter

## Workbook

### Sheet 1 — Data Pendaftar

* [ ] No
* [ ] Nama
* [ ] NIM
* [ ] Kelas
* [ ] Program Studi
* [ ] Divisi 1
* [ ] Alasan Divisi 1
* [ ] Divisi 2
* [ ] Alasan Divisi 2
* [ ] Status
* [ ] Tanggal Daftar

### Sheet 2 — Statistik

* [ ] Total pendaftar
* [ ] Total pending
* [ ] Total accepted
* [ ] Total rejected
* [ ] Acceptance rate

### Sheet 3 — Rekap Prodi

* [ ] Program Study
* [ ] Total applicants
* [ ] Pending
* [ ] Accepted
* [ ] Rejected

### Sheet 4 — Rekap Divisi

* [ ] Division
* [ ] Preference 1 count
* [ ] Preference 2 count
* [ ] Total preference

## Excel Formatting

* [ ] Header formatting
* [ ] Auto width
* [ ] Freeze header
* [ ] Auto filter
* [ ] Number formatting
* [ ] Date formatting
* [ ] Status formatting
* [ ] Summary formatting
* [ ] Filename otomatis

---

# 19. FILE STORAGE

## CV Upload

* [ ] Create storage directory
* [ ] Create yearly directory
* [ ] Generate UUID filename
* [ ] Validate extension
* [ ] Validate MIME type
* [ ] Validate size
* [ ] Prevent executable upload
* [ ] Store metadata in database

Target:

```text
storage/
└── cvs/
    └── 2026/
        ├── uuid-1.pdf
        ├── uuid-2.pdf
        └── uuid-3.pdf
```

## Security

* [ ] CV tidak dapat diakses secara public
* [ ] CV hanya melalui authenticated endpoint
* [ ] Validate applicant ownership/reference
* [ ] Prevent path traversal
* [ ] Prevent arbitrary file access

---

# 20. API IMPLEMENTATION

## Authentication

* [ ] `POST /api/v1/auth/login`

## Public

* [ ] `GET /api/v1/public/registration`
* [ ] `GET /api/v1/public/divisions`
* [ ] `GET /api/v1/public/program-studies`
* [ ] `POST /api/v1/public/applications`
* [ ] `GET /api/v1/public/result`

## Admin Dashboard

* [ ] `GET /api/v1/admin/dashboard`

## Applicants

* [ ] `GET /api/v1/admin/applicants`
* [ ] `GET /api/v1/admin/applicants/:id`
* [ ] `PATCH /api/v1/admin/applicants/:id/status`
* [ ] `GET /api/v1/admin/applicants/:id/cv`

## Divisions

* [ ] `GET /api/v1/admin/divisions`
* [ ] `POST /api/v1/admin/divisions`
* [ ] `PATCH /api/v1/admin/divisions/:id`
* [ ] `DELETE /api/v1/admin/divisions/:id`

## Program Studies

* [ ] `GET /api/v1/admin/program-studies`
* [ ] `POST /api/v1/admin/program-studies`
* [ ] `PATCH /api/v1/admin/program-studies/:id`
* [ ] `DELETE /api/v1/admin/program-studies/:id`

## Registration Periods

* [ ] `GET /api/v1/admin/registration-periods`
* [ ] `POST /api/v1/admin/registration-periods`
* [ ] `PATCH /api/v1/admin/registration-periods/:id`
* [ ] `DELETE /api/v1/admin/registration-periods/:id`

## Export

* [ ] `GET /api/v1/admin/export/applicants`

---

# 21. API SECURITY

* [ ] JWT authentication
* [ ] Password hashing
* [ ] CORS configuration
* [ ] Rate limit login
* [ ] Rate limit registration
* [ ] Rate limit result checking
* [ ] Validate all request body
* [ ] Validate query parameters
* [ ] Validate file upload
* [ ] Sanitize input
* [ ] Prevent SQL injection
* [ ] Prevent path traversal
* [ ] Hide internal errors in production
* [ ] Add request logging
* [ ] Add recovery middleware

---

# 22. FRONTEND ERROR & STATE HANDLING

## Loading

* [ ] Skeleton dashboard
* [ ] Skeleton table
* [ ] Loading button
* [ ] Loading form

## Error

* [ ] API error component
* [ ] Form validation error
* [ ] Network error
* [ ] Unauthorized error
* [ ] Not found error
* [ ] Server error

## Empty State

* [ ] No applicants
* [ ] No divisions
* [ ] No Program Studies
* [ ] No search results

## Success

* [ ] Registration success
* [ ] CRUD success
* [ ] Status update success
* [ ] Export success

---

# 23. RESPONSIVE DESIGN

## Desktop

* [ ] Public layout
* [ ] Admin sidebar
* [ ] Data table
* [ ] Dashboard cards

## Tablet

* [ ] Responsive navigation
* [ ] Responsive table
* [ ] Responsive forms

## Mobile

* [ ] Mobile navbar
* [ ] Mobile sidebar / Sheet
* [ ] Stacked form
* [ ] Mobile-friendly table
* [ ] Touch-friendly buttons
* [ ] Responsive cards
* [ ] Responsive dialogs

---

# 24. ACCESSIBILITY

* [ ] Semantic HTML
* [ ] Label setiap input
* [ ] Keyboard navigation
* [ ] Visible focus state
* [ ] Accessible dialog
* [ ] Accessible dropdown
* [ ] Accessible table
* [ ] Error message terhubung dengan input
* [ ] Status tidak hanya dibedakan berdasarkan warna
* [ ] Kontras warna memenuhi WCAG AA
* [ ] Alt text untuk image
* [ ] Screen reader friendly

---

# 25. TESTING — BACKEND

## Unit Test

* [ ] Authentication service
* [ ] Registration validation
* [ ] Registration period validation
* [ ] Division validation
* [ ] Program Study validation
* [ ] Applicant status validation
* [ ] Excel export logic
* [ ] File validation

## Integration Test

* [ ] Login API
* [ ] Registration API
* [ ] Result API
* [ ] Applicant API
* [ ] Division API
* [ ] Program Study API
* [ ] Registration Period API
* [ ] Export API

---

# 26. TESTING — FRONTEND

* [ ] Login flow
* [ ] Registration flow
* [ ] Registration validation
* [ ] CV upload
* [ ] Result checking
* [ ] Applicant search
* [ ] Applicant filter
* [ ] Applicant detail
* [ ] Status update
* [ ] Division CRUD
* [ ] Program Study CRUD
* [ ] Registration Period CRUD
* [ ] Excel export
* [ ] Mobile layout

---

# 27. END-TO-END TESTING

## Applicant Flow

* [ ] Applicant membuka landing page
* [ ] Applicant melihat status pendaftaran
* [ ] Applicant membuka form
* [ ] Applicant mengisi data
* [ ] Applicant memilih Program Study
* [ ] Applicant memilih Division 1
* [ ] Applicant memilih Division 2
* [ ] Applicant upload CV
* [ ] Applicant submit form
* [ ] Data tersimpan
* [ ] Applicant mendapatkan success response
* [ ] Applicant mengecek hasil menggunakan NIM

## Admin Flow

* [ ] Admin login
* [ ] Admin melihat dashboard
* [ ] Admin melihat applicant
* [ ] Admin mencari applicant
* [ ] Admin melakukan filter
* [ ] Admin membuka detail applicant
* [ ] Admin melihat CV
* [ ] Admin mengubah status
* [ ] Applicant dapat mengecek status terbaru
* [ ] Admin export Excel

---

# 28. DOCKER

## Backend

* [ ] Create backend Dockerfile
* [ ] Multi-stage build
* [ ] Production binary
* [ ] Health check

## Frontend

* [ ] Create frontend Dockerfile
* [ ] Production build
* [ ] Configure API URL

## PostgreSQL

* [ ] PostgreSQL container
* [ ] Persistent volume
* [ ] Database environment

## Storage

* [ ] Persistent CV volume
* [ ] Correct permissions

## Docker Compose

Services:

```text
frontend
backend
postgres
```

* [ ] Configure networks
* [ ] Configure volumes
* [ ] Configure environment
* [ ] Configure dependency
* [ ] Configure health checks

---

# 29. ENVIRONMENT

## Development

* [ ] `.env.local`
* [ ] Backend `.env`
* [ ] PostgreSQL development database
* [ ] Local storage

## Production

* [ ] Production database
* [ ] Production JWT secret
* [ ] Production CORS
* [ ] Production storage
* [ ] Production frontend URL
* [ ] Production backend URL
* [ ] Disable debug mode

---

# 30. PERFORMANCE

* [ ] Database indexes
* [ ] Pagination applicants
* [ ] Debounced search
* [ ] Lazy loading where appropriate
* [ ] Optimize frontend bundle
* [ ] Optimize images
* [ ] Avoid unnecessary API requests
* [ ] Database connection pooling
* [ ] Limit CV upload size
* [ ] Optimize Excel export

---

# 31. SECURITY AUDIT

* [ ] Test SQL injection
* [ ] Test XSS
* [ ] Test CSRF where applicable
* [ ] Test path traversal
* [ ] Test unauthorized API access
* [ ] Test expired JWT
* [ ] Test invalid JWT
* [ ] Test duplicate NIM
* [ ] Test invalid CV
* [ ] Test oversized CV
* [ ] Test invalid division
* [ ] Test invalid Program Study
* [ ] Test registration outside open period
* [ ] Test public CV access
* [ ] Test brute-force login
* [ ] Test brute-force result checking

---

# 32. UI POLISH

* [ ] Apply final typography
* [ ] Apply spacing system
* [ ] Apply border radius
* [ ] Apply status badges
* [ ] Apply button hierarchy
* [ ] Apply hover state
* [ ] Apply focus state
* [ ] Apply disabled state
* [ ] Apply skeleton
* [ ] Apply empty state
* [ ] Apply error state
* [ ] Apply success state
* [ ] Check consistency across pages

---

# 33. CONTENT

* [ ] HIMATRIS logo
* [ ] HIMATRIS description
* [ ] Hero copy
* [ ] Recruitment period copy
* [ ] Division descriptions
* [ ] Registration instruction
* [ ] CV instruction
* [ ] Result checking instruction
* [ ] Footer information
* [ ] Admin labels
* [ ] Error messages
* [ ] Success messages

---

# 34. FINAL QA

## Functional

* [ ] Semua halaman dapat dibuka
* [ ] Semua API berjalan
* [ ] Registration dapat dilakukan
* [ ] CV dapat diupload
* [ ] Admin dapat melihat applicant
* [ ] Admin dapat mengubah status
* [ ] Result checking berjalan
* [ ] CRUD Division berjalan
* [ ] CRUD Program Study berjalan
* [ ] CRUD Registration Period berjalan
* [ ] Excel export berjalan

## Visual

* [ ] Desktop checked
* [ ] Tablet checked
* [ ] Mobile checked
* [ ] Typography checked
* [ ] Spacing checked
* [ ] Button checked
* [ ] Form checked
* [ ] Table checked
* [ ] Dialog checked

## Security

* [ ] Authentication checked
* [ ] Authorization checked
* [ ] File upload checked
* [ ] Rate limiting checked
* [ ] Input validation checked
* [ ] CORS checked
* [ ] Sensitive data exposure checked

---

# 35. DEPLOYMENT

## Pre-Deployment

* [ ] Run all tests
* [ ] Run migration
* [ ] Run seed production jika diperlukan
* [ ] Build frontend
* [ ] Build backend
* [ ] Build Docker images
* [ ] Test Docker Compose
* [ ] Test production environment

## Deployment

* [ ] Setup server
* [ ] Install Docker
* [ ] Configure domain
* [ ] Configure DNS
* [ ] Deploy Docker Compose
* [ ] Configure reverse proxy
* [ ] Configure HTTPS
* [ ] Configure persistent storage
* [ ] Configure PostgreSQL volume

## Post-Deployment

* [ ] Test landing page
* [ ] Test registration
* [ ] Test CV upload
* [ ] Test result checking
* [ ] Test admin login
* [ ] Test applicant management
* [ ] Test Excel export
* [ ] Test CRUD master data
* [ ] Check server logs
* [ ] Check database
* [ ] Check storage

---

# 36. PRODUCTION MONITORING

* [ ] Backend health check
* [ ] Database health check
* [ ] Storage health check
* [ ] Error logging
* [ ] Access logging
* [ ] Disk usage monitoring
* [ ] Database backup
* [ ] CV backup
* [ ] Docker container monitoring

---

# 37. DEVELOPMENT PRIORITY

## P0 — Core MVP

Task yang wajib selesai sebelum sistem dapat digunakan.

* [ ] Project setup
* [ ] PostgreSQL
* [ ] Database migration
* [ ] Admin authentication
* [ ] Registration Period
* [ ] Division CRUD
* [ ] Program Study CRUD
* [ ] Registration form
* [ ] CV upload
* [ ] Applicant storage
* [ ] Applicant management
* [ ] Selection status
* [ ] Result checking

## P1 — Important

* [ ] Admin dashboard
* [ ] Applicant search
* [ ] Applicant filtering
* [ ] Pagination
* [ ] CV preview/download
* [ ] Advanced Excel export
* [ ] Statistics
* [ ] Responsive optimization
* [ ] Accessibility

## P2 — Polish

* [ ] Advanced UI animation
* [ ] Advanced dashboard charts
* [ ] Dark mode
* [ ] Performance optimization
* [ ] Advanced monitoring
* [ ] Automated backup
* [ ] Advanced audit logging

---

# 38. DEFINITION OF DONE

Sebuah fitur dianggap **Done** apabila:

* [ ] Backend API selesai
* [ ] Database sudah mendukung
* [ ] Validation sudah dibuat
* [ ] Frontend UI selesai
* [ ] Loading state tersedia
* [ ] Error state tersedia
* [ ] Success state tersedia
* [ ] Responsive
* [ ] Accessible
* [ ] Security sudah diperiksa
* [ ] Unit test tersedia jika diperlukan
* [ ] Integration test tersedia jika diperlukan
* [ ] Dokumentasi API diperbarui jika terjadi perubahan

---

# 39. FINAL RELEASE CHECKLIST

Sebelum HIMATRIS OPREC dibuka:

* [ ] Registration Period sudah benar
* [ ] Division sudah benar
* [ ] Program Study sudah benar
* [ ] Admin account sudah siap
* [ ] Landing page sudah final
* [ ] Form pendaftaran sudah dites
* [ ] CV upload sudah dites
* [ ] Duplicate NIM sudah dites
* [ ] Result checking sudah dites
* [ ] Admin dashboard sudah dites
* [ ] Applicant management sudah dites
* [ ] Selection status sudah dites
* [ ] Excel export sudah dites
* [ ] Backup database sudah tersedia
* [ ] Backup storage sudah tersedia
* [ ] HTTPS aktif
* [ ] Production environment sudah aktif
* [ ] Final UAT selesai

---

# 40. RECOMMENDED DEVELOPMENT ORDER

Urutan implementasi yang direkomendasikan:

```text
01. Project Setup
        ↓
02. Database
        ↓
03. Backend Architecture
        ↓
04. Authentication
        ↓
05. Master Data
    ├── Division
    └── Program Study
        ↓
06. Registration Period
        ↓
07. Public Landing Page
        ↓
08. Registration Form
        ↓
09. CV Storage
        ↓
10. Applicant Management
        ↓
11. Result Checking
        ↓
12. Admin Dashboard
        ↓
13. Excel Export
        ↓
14. Testing
        ↓
15. Security Audit
        ↓
16. Docker
        ↓
17. Deployment
        ↓
18. Final QA
        ↓
19. OPEN RECRUITMENT HIMATRIS
```

---

# 41. MVP RELEASE CRITERIA

Website siap digunakan untuk Open Recruitment apabila seluruh checklist berikut terpenuhi:

* [ ] Admin dapat login
* [ ] Admin dapat membuat periode pendaftaran
* [ ] Admin dapat mengatur waktu buka dan tutup pendaftaran
* [ ] Admin dapat CRUD Program Study
* [ ] Admin dapat CRUD Division
* [ ] Mahasiswa dapat melihat informasi OPREC
* [ ] Mahasiswa dapat melakukan pendaftaran
* [ ] Sistem dapat menerima CV
* [ ] Sistem mencegah NIM duplikat pada periode yang sama
* [ ] Admin dapat melihat seluruh pendaftar
* [ ] Admin dapat mencari dan memfilter pendaftar
* [ ] Admin dapat melihat detail pendaftar
* [ ] Admin dapat melihat/download CV
* [ ] Admin dapat menentukan ACCEPTED/REJECTED/PENDING
* [ ] Mahasiswa dapat mengecek hasil menggunakan NIM
* [ ] Admin dapat melakukan export Excel
* [ ] Excel memiliki data dan statistik
* [ ] Sistem responsive
* [ ] Sistem memiliki validation
* [ ] Sistem memiliki authentication dan authorization
* [ ] Sistem berjalan menggunakan Docker
* [ ] Production deployment berhasil

---

# END OF TASKLIST.md
