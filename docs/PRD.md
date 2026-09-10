# Product Requirements Document (PRD)

## HIMATRIS Open Recruitment System

**Version:** 1.0
**Status:** Draft
**Product:** HIMATRIS Open Recruitment
**Document:** Product Requirements Document
**Platform:** Web Application

---

# 1. Product Overview

## 1.1 Product Name

**HIMATRIS Open Recruitment System**

## 1.2 Product Description

HIMATRIS Open Recruitment System adalah aplikasi web yang digunakan untuk mengelola proses Open Recruitment HIMATRIS secara terintegrasi.

Sistem mencakup:

* Informasi Open Recruitment.
* Pendaftaran mahasiswa.
* Pengaturan periode pendaftaran.
* Pengelolaan Program Studi.
* Pengelolaan Divisi.
* Pengelolaan data pendaftar.
* Pengelolaan hasil seleksi.
* Pengecekan hasil seleksi berdasarkan NIM.
* Upload dan pengelolaan CV.
* Export data ke Excel.

---

# 2. Product Goals

## 2.1 Primary Goal

Menyediakan sistem OPREC HIMATRIS yang dapat mengotomatisasi proses pendaftaran dan administrasi seleksi sehingga panitia tidak perlu melakukan pengelolaan data secara manual.

## 2.2 Secondary Goals

Sistem diharapkan dapat:

1. Mengurangi kesalahan input data.
2. Memusatkan seluruh data pendaftar.
3. Mempermudah panitia melakukan seleksi.
4. Mempermudah pengelolaan Divisi dan Program Studi.
5. Mempermudah pendaftar mengetahui hasil seleksi.
6. Menghasilkan data Excel yang siap digunakan untuk kebutuhan administrasi.

---

# 3. Problem Statement

Proses Open Recruitment HIMATRIS membutuhkan pengelolaan data mahasiswa dalam jumlah besar.

Tanpa sistem terintegrasi, panitia berpotensi menghadapi masalah:

* Data pendaftar sulit dikelola.
* Data duplikat.
* Pengolahan spreadsheet manual.
* Kesalahan saat menentukan hasil seleksi.
* Sulit melakukan filtering berdasarkan Program Studi atau Divisi.
* CV tersimpan secara terpisah.
* Pengumuman hasil membutuhkan pekerjaan tambahan.
* Rekapitulasi membutuhkan waktu.

Produk ini dibuat untuk menyelesaikan masalah tersebut.

---

# 4. Target Users

## 4.1 Applicant

Mahasiswa yang mengikuti Open Recruitment HIMATRIS.

### Applicant Goals

* Mengetahui informasi OPREC.
* Mengetahui kapan pendaftaran dibuka.
* Mendaftar dengan mudah.
* Mengirim CV.
* Mengetahui status pendaftaran.
* Mengetahui hasil seleksi.

---

## 4.2 Admin

Panitia HIMATRIS yang mengelola sistem.

### Admin Goals

* Mengatur OPREC.
* Mengelola master data.
* Mengelola pendaftar.
* Melakukan seleksi.
* Mengelola hasil seleksi.
* Menghasilkan laporan.

---

# 5. User Journey

## 5.1 Applicant Journey

```text
Landing Page
      ↓
Melihat Informasi OPREC
      ↓
Klik "Daftar"
      ↓
Sistem Mengecek Periode
      ↓
Registration Form
      ↓
Mengisi Data
      ↓
Upload CV
      ↓
Submit
      ↓
Validasi
      ↓
Data Tersimpan
      ↓
Registration Success
      ↓
Menunggu Seleksi
      ↓
Cek Hasil dengan NIM
      ↓
Accepted / Rejected / Pending
```

---

## 5.2 Admin Journey

```text
Admin Login
      ↓
Dashboard
      ↓
Setup Program Studi
      ↓
Setup Divisi
      ↓
Setup Registration Period
      ↓
Open Registration
      ↓
Monitor Applicants
      ↓
Review Applicant
      ↓
Set Selection Status
      ↓
Export Data
      ↓
Publish Result
```

---

# 6. Functional Requirements

# FR-001 — Landing Page

Sistem harus menyediakan halaman utama untuk pengunjung.

### Requirements

Landing page harus menampilkan:

* Identitas HIMATRIS.
* Informasi OPREC.
* Periode pendaftaran.
* Status pendaftaran.
* Tombol daftar.
* Tombol cek hasil.
* Informasi divisi.
* Informasi Program Studi.

### Acceptance Criteria

* Pengunjung dapat membuka landing page tanpa login.
* Status pendaftaran ditampilkan berdasarkan konfigurasi sistem.
* Tombol daftar mengarah ke halaman pendaftaran.
* Tombol cek hasil mengarah ke halaman hasil seleksi.

---

# FR-002 — Registration Period

Admin harus dapat mengatur periode pendaftaran.

### Data

```text
Name
Start Date
Start Time
End Date
End Time
Status
```

### Business Logic

Sistem menentukan status:

```text
Current < Start
→ UPCOMING

Start <= Current <= End
→ OPEN

Current > End
→ CLOSED
```

### Acceptance Criteria

* Form tidak dapat diakses ketika `UPCOMING`.
* Form dapat digunakan ketika `OPEN`.
* Form tidak dapat digunakan ketika `CLOSED`.
* Status dapat ditampilkan di landing page.

---

# FR-003 — Registration Form

Sistem harus menyediakan form pendaftaran.

### Fields

```text
Nama
NIM
Kelas
Program Studi
Divisi 1
Alasan Divisi 1
Divisi 2
Alasan Divisi 2
CV
```

### Validation

#### Nama

Required:

```text
Yes
```

Minimal:

```text
3 characters
```

#### NIM

Required:

```text
Yes
```

NIM harus unik dalam satu periode.

#### Kelas

Required:

```text
Yes
```

#### Program Studi

Required:

```text
Yes
```

Value harus berasal dari Program Studi aktif.

#### Divisi 1

Required:

```text
Yes
```

Value harus berasal dari Divisi aktif.

#### Alasan Divisi 1

Required:

```text
Yes
```

#### Divisi 2

Required:

```text
No
```

#### Alasan Divisi 2

Required jika:

```text
Divisi 2 != null
```

#### CV

Required:

```text
Yes
```

---

# FR-004 — Duplicate Registration

Sistem harus mencegah pendaftar melakukan pendaftaran lebih dari satu kali dalam periode yang sama.

### Rule

```text
UNIQUE(
    registration_period_id,
    nim
)
```

### Error

Jika NIM sudah terdaftar:

```text
NIM sudah terdaftar pada periode Open Recruitment ini.
```

---

# FR-005 — Division Selection

Sistem harus mengambil pilihan Divisi dari database.

### Requirements

* Hanya Divisi aktif yang muncul.
* Divisi 1 wajib dipilih.
* Divisi 2 opsional.
* Divisi 2 tidak boleh sama dengan Divisi 1.

### Example

Jika:

```text
Divisi 1 = PSDM
```

Maka:

```text
Divisi 2 ≠ PSDM
```

---

# FR-006 — Program Study Selection

Sistem harus mengambil pilihan Program Studi dari database.

### Requirements

* Hanya Program Studi aktif yang muncul.
* Program Studi tidak ditulis manual oleh user.
* Perubahan master data otomatis tercermin pada form.

---

# FR-007 — CV Upload

Pendaftar dapat mengupload CV.

### Requirements

File harus:

* Memiliki extension yang diizinkan.
* Memiliki MIME type yang valid.
* Memiliki ukuran maksimal yang ditentukan sistem.
* Disimpan pada local storage.

### Recommended

Format:

```text
PDF
```

Maximum size:

```text
5 MB
```

### Storage

```text
/storage/cvs/{year}/{unique-file-name}.pdf
```

Database hanya menyimpan metadata/path file.

---

# FR-008 — Registration Success

Setelah berhasil mendaftar, sistem menampilkan halaman sukses.

### Information

Minimal:

```text
Pendaftaran berhasil.

NIM:
XXXXXXXX

Status:
Menunggu Seleksi
```

Sistem tidak perlu menampilkan informasi sensitif lainnya.

---

# FR-009 — Admin Authentication

Admin harus login sebelum mengakses dashboard.

### Login Fields

```text
Email / Username
Password
```

### Requirements

* Password harus di-hash.
* Session/token harus digunakan.
* Endpoint admin harus protected.

---

# FR-010 — Admin Dashboard

Dashboard menampilkan ringkasan OPREC.

### Metrics

```text
Total Pendaftar
Pending
Accepted
Rejected
```

### Additional Information

```text
Registration Status
Total Division
Total Program Study
```

---

# FR-011 — Applicant Management

Admin dapat melihat seluruh pendaftar.

### Table

Minimal:

| Field             |
| ----------------- |
| No                |
| Nama              |
| NIM               |
| Kelas             |
| Program Studi     |
| Divisi 1          |
| Divisi 2          |
| Status            |
| Registration Date |
| Action            |

### Actions

Admin dapat:

* View detail.
* Membuka CV.
* Mengubah status.

---

# FR-012 — Applicant Search

Admin dapat mencari pendaftar.

### Search Fields

Minimal:

```text
Nama
NIM
```

Search harus mendukung partial matching.

Contoh:

```text
haf
```

dapat menemukan:

```text
Hafiz
Hafizh
Muhammad Hafiz
```

---

# FR-013 — Applicant Filtering

Admin dapat melakukan filtering.

### Filters

```text
Program Studi
Divisi 1
Divisi 2
Status
```

Contoh:

```text
Program Studi = Teknik Informatika
Status = PENDING
```

---

# FR-014 — Applicant Detail

Admin dapat melihat detail pendaftar.

### Information

```text
Nama
NIM
Kelas
Program Studi

Divisi 1
Alasan Divisi 1

Divisi 2
Alasan Divisi 2

CV
Selection Status
Created At
Updated At
```

---

# FR-015 — Selection Management

Admin dapat menentukan status seleksi.

### Status

```text
PENDING
ACCEPTED
REJECTED
```

### Default

Ketika pendaftar baru masuk:

```text
PENDING
```

### Admin Action

Admin dapat mengubah:

```text
PENDING → ACCEPTED
PENDING → REJECTED
ACCEPTED → REJECTED
REJECTED → ACCEPTED
```

Sistem tidak membatasi perubahan status pada MVP.

---

# FR-016 — Result Checking

Public dapat mengecek hasil berdasarkan NIM.

### Input

```text
NIM
```

### Result

Sistem menampilkan salah satu:

```text
NOT_FOUND
PENDING
ACCEPTED
REJECTED
```

### Public Information

Jika accepted:

```text
Selamat!
Anda dinyatakan diterima.
```

Jika rejected:

```text
Terima kasih telah mengikuti
Open Recruitment HIMATRIS.
```

Jika pending:

```text
Hasil seleksi Anda masih dalam proses.
```

---

# FR-017 — Division CRUD

Admin dapat:

### Create

Menambahkan Divisi.

### Read

Melihat seluruh Divisi.

### Update

Mengubah:

```text
Nama
Deskripsi
Status
```

### Delete

Menghapus Divisi.

### Recommendation

Gunakan soft delete apabila Divisi telah digunakan oleh data pendaftar.

---

# FR-018 — Program Study CRUD

Admin dapat:

### Create

Menambahkan Program Studi.

### Read

Melihat Program Studi.

### Update

Mengubah:

```text
Nama
Status
```

### Delete

Menghapus Program Studi.

### Recommendation

Gunakan soft delete apabila sudah digunakan oleh pendaftar.

---

# FR-019 — Excel Export

Admin dapat mengexport data pendaftar.

### Export Data

Kolom:

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

# FR-020 — Advanced Excel Report

Workbook harus memiliki beberapa sheet.

### Sheet 1 — Data Pendaftar

Berisi seluruh data pendaftar.

### Sheet 2 — Statistik

Contoh:

```text
Total Pendaftar       250
Pending               100
Accepted               90
Rejected               60
```

### Sheet 3 — Rekap Program Studi

Contoh:

```text
Program Studi       Jumlah
TI                  100
TRPL                 80
RKS                  70
```

### Sheet 4 — Rekap Divisi

Contoh:

```text
Divisi              Jumlah
PSDM                 80
Kajian Strategis     60
Humas                55
```

### Formatting

Excel harus memiliki:

* Header styling.
* Auto filter.
* Freeze pane.
* Auto column width.
* Number formatting.
* Date formatting.
* Status formatting.
* Table formatting.

---

# 7. Non-Functional Requirements

# NFR-001 — Performance

Target:

* Landing page dapat dimuat dengan cepat.
* API response normal < 500ms pada kondisi normal.
* Export Excel dapat menangani setidaknya ratusan hingga beberapa ribu data pendaftar.

---

# NFR-002 — Security

Sistem harus:

* Menggunakan password hashing.
* Menggunakan authentication.
* Menggunakan authorization.
* Memvalidasi upload.
* Memvalidasi input.
* Mencegah SQL Injection.
* Membatasi akses CV.
* Tidak mengekspos data pribadi pada public API.

---

# NFR-003 — Reliability

Data pendaftaran harus tersimpan secara konsisten.

Jika terjadi kegagalan:

```text
Database berhasil
File gagal
```

atau:

```text
File berhasil
Database gagal
```

sistem harus menangani kondisi tersebut agar tidak meninggalkan data orphan.

---

# NFR-004 — Maintainability

Codebase harus dipisahkan berdasarkan tanggung jawab.

Frontend:

```text
components
pages
features
services
hooks
types
```

Backend:

```text
handler
service
repository
model
middleware
routes
```

---

# NFR-005 — Scalability

MVP harus memiliki struktur yang memungkinkan pengembangan menjadi sistem recruitment multi-periode.

Contoh:

```text
OPREC 2026
OPREC 2027
OPREC 2028
```

Data pendaftar harus terhubung dengan registration period.

---

# 8. UI/UX Requirements

## 8.1 Design Principles

UI harus:

* Modern.
* Clean.
* Responsive.
* Accessible.
* Mobile friendly.
* Konsisten.
* Menggunakan komponen Shadcn UI.

---

# 8.2 Public UI

Public website menggunakan pendekatan:

```text
Modern Organization Website
+
Recruitment Landing Page
```

Fokus utama:

```text
Information
↓
Interest
↓
Registration
```

---

# 8.3 Admin UI

Admin dashboard menggunakan layout:

```text
Sidebar
├── Dashboard
├── Pendaftar
├── Divisi
├── Program Studi
├── Periode Pendaftaran
└── Settings

Main Content
```

---

# 8.4 Responsive Design

Sistem harus mendukung:

```text
Mobile
Tablet
Desktop
```

Prioritas utama:

```text
Mobile First
```

karena mayoritas pendaftar kemungkinan mengakses melalui smartphone.

---

# 9. Page Requirements

## Public Pages

### `/`

Landing page.

### `/register`

Registration form.

### `/result`

Result checking.

---

## Admin Pages

### `/admin/login`

Login.

### `/admin`

Dashboard.

### `/admin/applicants`

Applicant management.

### `/admin/applicants/[id]`

Applicant detail.

### `/admin/divisions`

Division management.

### `/admin/program-studies`

Program Study management.

### `/admin/registration`

Registration period management.

---

# 10. Error Handling

Sistem harus memberikan feedback yang jelas.

## Validation Error

```text
Nama wajib diisi.
```

## Duplicate NIM

```text
NIM sudah terdaftar.
```

## Registration Closed

```text
Pendaftaran telah ditutup.
```

## Invalid CV

```text
Format CV tidak didukung.
```

## File Too Large

```text
Ukuran CV terlalu besar.
Maksimal 5 MB.
```

## Server Error

```text
Terjadi kesalahan pada server.
Silakan coba lagi.
```

---

# 11. Empty States

Sistem harus menyediakan empty state.

## No Applicants

```text
Belum ada pendaftar.
```

## No Division

```text
Belum ada divisi.
Silakan tambahkan divisi terlebih dahulu.
```

## No Program Study

```text
Belum ada Program Studi.
```

## No Search Result

```text
Pendaftar tidak ditemukan.
```

---

# 12. Loading States

Sistem harus menggunakan loading state pada operasi asynchronous.

Contoh:

```text
Memuat data...
```

Button:

```text
Menyimpan...
Mengupload...
Mengubah status...
Mengekspor...
```

---

# 13. Confirmation Requirements

Operasi destructive harus memiliki confirmation dialog.

Contoh:

```text
Apakah Anda yakin ingin menghapus
Divisi "PSDM"?

Data yang sudah digunakan oleh pendaftar
tidak akan dihapus secara permanen.
```

---

# 14. Data Integrity

## Applicant

NIM harus unik berdasarkan periode.

```text
registration_period_id + nim
```

## Division

Nama Divisi sebaiknya unik.

## Program Study

Nama Program Studi sebaiknya unik.

## Selection

Status harus berasal dari enum yang valid.

```text
PENDING
ACCEPTED
REJECTED
```

---

# 15. API Requirements

Frontend berkomunikasi dengan backend menggunakan REST API.

Base:

```text
/api
```

Public:

```text
/api/public/*
```

Admin:

```text
/api/admin/*
```

Authentication:

```text
/api/auth/*
```

Detail request/response akan didefinisikan pada `API.md`.

---

# 16. Database Requirements

Database:

```text
PostgreSQL
```

Minimal entity:

```text
admins
registration_periods
applicants
divisions
program_studies
```

Relasi utama:

```text
registration_periods
        │
        │
        ▼
    applicants
      │ │ │
      │ │ └── program_studies
      │ │
      │ ├──── divisions
      │
      └────── divisions
```

Detail schema akan didefinisikan pada `SCHEMA.md`.

---

# 17. File Storage Requirements

CV disimpan pada local storage.

Contoh:

```text
/storage
└── cvs
    └── 2026
        ├── uuid-1.pdf
        ├── uuid-2.pdf
        └── uuid-3.pdf
```

Database menyimpan:

```text
file_name
file_path
file_size
mime_type
```

Jangan menyimpan binary file CV langsung ke PostgreSQL untuk MVP.

---

# 18. Docker Requirements

Aplikasi harus dapat dijalankan menggunakan Docker Compose.

Minimal service:

```text
frontend
backend
postgres
```

Storage menggunakan persistent volume:

```text
cv_storage
```

Contoh arsitektur:

```text
Docker Compose
│
├── Next.js
│
├── Gin API
│
├── PostgreSQL
│
└── CV Volume
```

---

# 19. Acceptance Criteria

## Registration

* [ ] User dapat mengisi form.
* [ ] Semua required field divalidasi.
* [ ] Program Studi berasal dari database.
* [ ] Divisi berasal dari database.
* [ ] Divisi 2 bersifat opsional.
* [ ] Divisi 2 tidak boleh sama dengan Divisi 1.
* [ ] CV dapat diupload.
* [ ] NIM tidak dapat didaftarkan dua kali pada periode yang sama.
* [ ] Data tersimpan di PostgreSQL.
* [ ] CV tersimpan di local storage.

## Admin

* [ ] Admin dapat login.
* [ ] Admin dapat melihat dashboard.
* [ ] Admin dapat melihat pendaftar.
* [ ] Admin dapat mencari pendaftar.
* [ ] Admin dapat filter pendaftar.
* [ ] Admin dapat melihat detail.
* [ ] Admin dapat membuka CV.
* [ ] Admin dapat mengubah status.

## Master Data

* [ ] Admin dapat CRUD Divisi.
* [ ] Admin dapat CRUD Program Studi.

## Registration Period

* [ ] Admin dapat menentukan waktu buka.
* [ ] Admin dapat menentukan waktu tutup.
* [ ] Sistem otomatis menentukan status.
* [ ] Form hanya aktif pada periode OPEN.

## Result

* [ ] User dapat memasukkan NIM.
* [ ] Sistem dapat menemukan pendaftar.
* [ ] Sistem menampilkan PENDING.
* [ ] Sistem menampilkan ACCEPTED.
* [ ] Sistem menampilkan REJECTED.
* [ ] Sistem tidak mengekspos data sensitif.

## Export

* [ ] Admin dapat export Excel.
* [ ] Data pendaftar masuk ke Excel.
* [ ] Statistik tersedia.
* [ ] Rekap Program Studi tersedia.
* [ ] Rekap Divisi tersedia.
* [ ] Excel memiliki formatting yang baik.

---

# 20. Out of Scope

Fitur berikut tidak termasuk dalam PRD MVP:

* Google Login.
* WhatsApp API.
* Email notification.
* Interview management.
* Scoring system.
* Automatic ranking.
* Multiple reviewer.
* Role-based access control kompleks.
* Mobile application.
* Cloud storage.
* Public ranking.
* Payment.
* AI screening.
* AI CV analysis.

---

# 21. Future Roadmap

## Phase 2 — Recruitment Management

Tambahkan:

```text
Interview
Scoring
Reviewer
Assessment
```

Flow:

```text
Registration
    ↓
Administration Screening
    ↓
Interview
    ↓
Scoring
    ↓
Final Decision
```

---

## Phase 3 — Notification

Tambahkan:

```text
Email
WhatsApp
```

Notification ketika:

```text
Registration Submitted
Interview Scheduled
Selection Result Published
```

---

## Phase 4 — Multi Event

Sistem mendukung beberapa event:

```text
OPREC HIMATRIS 2026
OPREC HIMATRIS 2027
Leadership Recruitment
Volunteer Recruitment
Committee Recruitment
```

---

# 22. Product Metrics

MVP dapat dievaluasi menggunakan:

### Registration Completion Rate

```text
Completed Registration
---------------------- × 100%
Started Registration
```

### Duplicate Attempt Rate

Jumlah percobaan pendaftaran menggunakan NIM yang sudah terdaftar.

### Result Lookup Success

Persentase pencarian hasil yang berhasil menemukan data.

### Export Usage

Jumlah export Excel yang dilakukan admin.

---

# 23. MVP Priority Matrix

| Feature               | Priority | MVP |
| --------------------- | -------- | --- |
| Landing Page          | P0       | Yes |
| Registration Form     | P0       | Yes |
| Registration Period   | P0       | Yes |
| Applicant Management  | P0       | Yes |
| Division CRUD         | P0       | Yes |
| Program Study CRUD    | P0       | Yes |
| Selection Status      | P0       | Yes |
| Result Checking       | P0       | Yes |
| Admin Login           | P0       | Yes |
| CV Upload             | P0       | Yes |
| Excel Export          | P1       | Yes |
| Dashboard Statistics  | P1       | Yes |
| Advanced Excel Report | P1       | Yes |
| Email                 | P2       | No  |
| WhatsApp              | P2       | No  |
| Interview             | P2       | No  |
| Scoring               | P2       | No  |
| AI Screening          | P3       | No  |

---

# 24. Definition of Done

MVP dianggap selesai apabila:

1. Admin dapat login.
2. Admin dapat mengatur periode OPREC.
3. Admin dapat membuat Program Studi.
4. Admin dapat membuat Divisi.
5. Mahasiswa dapat melakukan pendaftaran.
6. Sistem melakukan validasi seluruh data.
7. CV berhasil disimpan.
8. Data pendaftar tersimpan di PostgreSQL.
9. Admin dapat melihat data pendaftar.
10. Admin dapat mencari dan melakukan filtering.
11. Admin dapat melihat CV.
12. Admin dapat menentukan status seleksi.
13. Mahasiswa dapat mengecek hasil menggunakan NIM.
14. Admin dapat mengexport data ke Excel.
15. Excel memiliki data pendaftar dan rekapitulasi.
16. Sistem dapat dijalankan menggunakan Docker.
17. Sistem dapat digunakan dengan baik pada mobile dan desktop.
18. Tidak terdapat akses public ke dashboard admin.
19. Tidak terdapat kebocoran data sensitif melalui API public.

---

# 25. Final Product Flow

```text
                    ┌─────────────────────┐
                    │     HIMATRIS OPREC  │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
              PUBLIC                       ADMIN
                 │                           │
        ┌────────┼────────┐          ┌───────┴────────┐
        │        │        │          │                │
     Landing  Register  Result    Dashboard        Settings
                 │                    │                │
                 │             ┌──────┼───────┐        │
                 │             │      │       │        │
                 │         Applicants Division Prodi   │
                 │             │                         │
                 └──────► PostgreSQL ◄───────────────────┘
                              │
                              │
                         Local Storage
                              │
                             CV
```

---

# 26. Final Technology Specification

| Layer            | Technology     |
| ---------------- | -------------- |
| Frontend         | Next.js        |
| Language         | TypeScript     |
| UI               | Shadcn UI      |
| Styling          | Tailwind CSS   |
| Backend          | Golang         |
| Framework        | Gin            |
| API              | REST           |
| Database         | PostgreSQL     |
| File Storage     | Local Storage  |
| Containerization | Docker         |
| Orchestration    | Docker Compose |

---

# 27. Product Principle

HIMATRIS Open Recruitment System harus mengikuti prinsip:

> **Simple for Applicants, Powerful for Administrators.**

Pendaftar harus dapat menyelesaikan proses pendaftaran dengan sesedikit mungkin friction.

Admin harus mendapatkan kontrol penuh terhadap:

* Periode pendaftaran.
* Master data.
* Data pendaftar.
* CV.
* Seleksi.
* Hasil.
* Export data.

Dengan prinsip tersebut, MVP tetap sederhana untuk dikembangkan tetapi memiliki fondasi yang cukup kuat untuk dikembangkan menjadi **Recruitment Management System HIMATRIS** pada tahap berikutnya.
