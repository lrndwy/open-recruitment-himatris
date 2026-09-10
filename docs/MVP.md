# HIMATRIS Open Recruitment — MVP

## 1. Overview

### 1.1 Nama Project

**HIMATRIS Open Recruitment System**

Sistem website Open Recruitment (OPREC) untuk **HIMATRIS** yang digunakan untuk mengelola proses pendaftaran calon anggota/pengurus secara terpusat, mulai dari pembukaan pendaftaran, pengisian formulir, pengelolaan data pendaftar, seleksi, hingga pengumuman hasil seleksi.

### 1.2 Tujuan

Membangun sistem OPREC HIMATRIS yang:

* Mempermudah mahasiswa melakukan pendaftaran secara online.
* Mempermudah panitia/admin mengelola data pendaftar.
* Memungkinkan admin mengatur periode pendaftaran.
* Memungkinkan admin mengelola Program Studi dan Divisi.
* Memungkinkan admin menentukan status penerimaan peserta.
* Menyediakan halaman pengecekan hasil seleksi berdasarkan NIM.
* Menyediakan export data pendaftaran ke Excel untuk kebutuhan administrasi dan seleksi.

---

# 2. Problem Statement

Proses Open Recruitment organisasi mahasiswa umumnya masih menggunakan formulir online dan pengolahan spreadsheet secara manual.

Beberapa permasalahan yang ingin diselesaikan:

1. Data pendaftar tersebar di berbagai tempat.
2. Admin harus melakukan pengolahan data secara manual.
3. Pilihan divisi dan program studi sulit dikelola secara dinamis.
4. Periode pendaftaran tidak terintegrasi dengan sistem.
5. Pengumuman hasil seleksi membutuhkan proses manual.
6. Pengelolaan CV masih terpisah dari data pendaftar.
7. Export data membutuhkan formatting tambahan secara manual.

HIMATRIS membutuhkan satu sistem terintegrasi untuk mengelola seluruh proses tersebut.

---

# 3. Target Users

MVP memiliki dua jenis pengguna utama.

## 3.1 Pendaftar

Mahasiswa yang ingin mengikuti Open Recruitment HIMATRIS.

Pendaftar dapat:

* Melihat informasi OPREC.
* Mengisi formulir pendaftaran.
* Memilih Program Studi.
* Memilih Divisi 1.
* Memilih Divisi 2 secara opsional.
* Mengisi alasan memilih divisi.
* Mengupload CV.
* Melihat status pendaftaran.
* Mengecek hasil seleksi menggunakan NIM.

## 3.2 Admin

Panitia/pengurus HIMATRIS yang bertanggung jawab terhadap proses OPREC.

Admin dapat:

* Login ke dashboard.
* Mengatur periode pendaftaran.
* Mengelola Program Studi.
* Mengelola Divisi.
* Melihat data pendaftar.
* Melihat detail pendaftar.
* Mengakses CV pendaftar.
* Menentukan status penerimaan.
* Mengekspor data pendaftar ke Excel.

---

# 4. MVP Scope

MVP dibagi menjadi beberapa modul utama:

1. Public Website
2. Registration System
3. Registration Period Management
4. Program Study Management
5. Division Management
6. Applicant Management
7. Selection Management
8. Result Checking
9. Excel Export
10. Admin Authentication

---

# 5. Public Website

## 5.1 Landing Page

Website menyediakan halaman utama untuk memberikan informasi Open Recruitment HIMATRIS.

Minimal berisi:

* Logo HIMATRIS
* Nama HIMATRIS
* Judul Open Recruitment
* Deskripsi OPREC
* Periode pendaftaran
* Status pendaftaran
* CTA "Daftar Sekarang"
* CTA "Cek Hasil Seleksi"
* Informasi singkat divisi
* Informasi Program Studi
* Footer

### Registration Status

Landing page menampilkan status berdasarkan konfigurasi periode pendaftaran.

Contoh:

**Belum Dibuka**

> Pendaftaran akan dibuka pada 15 September 2026.

**Sedang Dibuka**

> Pendaftaran dibuka sampai 30 September 2026.

**Sudah Ditutup**

> Pendaftaran Open Recruitment telah ditutup.

---

# 6. Registration System

## 6.1 Registration Form

Pendaftar dapat mengisi formulir pendaftaran.

Field MVP:

| Field           | Required    | Type     |
| --------------- | ----------- | -------- |
| Nama            | Ya          | Text     |
| NIM             | Ya          | Text     |
| Kelas           | Ya          | Text     |
| Program Studi   | Ya          | Select   |
| Divisi 1        | Ya          | Select   |
| Alasan Divisi 1 | Ya          | Textarea |
| Divisi 2        | Tidak       | Select   |
| Alasan Divisi 2 | Kondisional | Textarea |
| CV              | Ya          | File     |

---

## 6.2 Rules

### Nama

* Wajib diisi.
* Minimal 3 karakter.

### NIM

* Wajib diisi.
* Tidak boleh kosong.
* Harus unik dalam satu periode OPREC.

### Kelas

* Wajib diisi.

### Program Studi

* Wajib memilih salah satu Program Studi aktif.

Data berasal dari master Program Studi.

### Divisi 1

* Wajib memilih satu divisi.

Data berasal dari master Divisi.

### Alasan Divisi 1

* Wajib diisi.
* Berupa textarea.

### Divisi 2

* Opsional.
* Tidak boleh sama dengan Divisi 1.

### Alasan Divisi 2

Jika Divisi 2 dipilih, alasan Divisi 2 menjadi wajib.

Jika Divisi 2 tidak dipilih, alasan Divisi 2 tidak diperlukan.

### CV

* Wajib diupload.
* Hanya menerima format file yang ditentukan sistem.
* File disimpan pada local storage server.

---

# 7. Registration Period

Admin dapat mengatur periode pendaftaran.

## 7.1 Configuration

Minimal memiliki:

* Registration Name
* Start Date
* Start Time
* End Date
* End Time
* Status

Contoh:

```text
OPREC HIMATRIS 2026

Open:
15 September 2026 08:00

Close:
30 September 2026 23:59
```

---

## 7.2 Registration States

Sistem memiliki tiga kondisi utama:

```text
UPCOMING
OPEN
CLOSED
```

### UPCOMING

Pendaftaran belum dimulai.

Form tidak dapat digunakan.

### OPEN

Pendaftaran sedang dibuka.

Pendaftar dapat mengisi form.

### CLOSED

Pendaftaran telah berakhir.

Form tidak dapat digunakan.

---

# 8. Program Study Management

Admin dapat melakukan CRUD Program Studi.

## 8.1 Create

Admin dapat menambahkan Program Studi.

Contoh:

```text
Teknik Informatika
Sistem Informasi
Rekayasa Perangkat Lunak
```

## 8.2 Read

Admin dapat melihat seluruh Program Studi.

## 8.3 Update

Admin dapat mengubah:

* Nama Program Studi
* Status aktif

## 8.4 Delete

Admin dapat menghapus Program Studi yang tidak digunakan.

Untuk keamanan data, implementasi disarankan menggunakan **soft delete** apabila Program Studi sudah digunakan oleh pendaftar.

---

# 9. Division Management

Admin dapat melakukan CRUD Divisi HIMATRIS.

## 9.1 Division Data

Minimal:

```text
Nama Divisi
Deskripsi
Status Aktif
```

Contoh:

```text
Kajian Strategis
PSDM
Humas
Minat dan Bakat
Kewirausahaan
```

## 9.2 CRUD

Admin dapat:

* Membuat Divisi.
* Melihat Divisi.
* Mengubah Divisi.
* Mengaktifkan/nonaktifkan Divisi.
* Menghapus Divisi.

Sama seperti Program Studi, soft delete lebih disarankan untuk data yang sudah digunakan dalam pendaftaran.

---

# 10. Applicant Management

Admin dapat melihat seluruh data pendaftar.

## 10.1 Applicant List

Data minimal yang ditampilkan:

* Nama
* NIM
* Kelas
* Program Studi
* Divisi 1
* Divisi 2
* Status Seleksi
* Waktu Pendaftaran

---

# 11. Applicant Detail

Admin dapat membuka detail setiap pendaftar.

Detail:

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
Status Seleksi

Created At
Updated At
```

Admin dapat membuka/mengunduh CV.

---

# 12. Selection Management

Admin dapat menentukan hasil seleksi setiap pendaftar.

## 12.1 Selection Status

MVP menggunakan status:

```text
PENDING
ACCEPTED
REJECTED
```

### PENDING

Pendaftar belum mendapatkan keputusan.

### ACCEPTED

Pendaftar dinyatakan diterima.

### REJECTED

Pendaftar dinyatakan tidak diterima.

---

# 13. Result Checking

Website menyediakan halaman khusus untuk mengecek hasil seleksi.

URL konseptual:

```text
/result
```

Pendaftar memasukkan:

```text
NIM
```

Kemudian sistem mencari data pendaftar berdasarkan NIM.

---

## 13.1 Result States

### Data Tidak Ditemukan

```text
NIM tidak ditemukan.
Silakan periksa kembali NIM Anda.
```

### Masih Diproses

```text
Hasil seleksi Anda masih dalam proses.
Silakan cek kembali nanti.
```

### Diterima

```text
Selamat!

Anda dinyatakan DITERIMA
sebagai bagian dari HIMATRIS.
```

### Tidak Diterima

```text
Terima kasih telah mengikuti
Open Recruitment HIMATRIS.

Anda dinyatakan BELUM DITERIMA.
```

Informasi yang ditampilkan kepada publik harus dibatasi agar tidak membocorkan data pribadi pendaftar.

---

# 14. Excel Export

Admin dapat melakukan export data pendaftar.

## 14.1 Basic Export

Export seluruh data pendaftar ke Excel.

Minimal kolom:

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
Status Seleksi
Tanggal Pendaftaran
```

---

## 14.2 Advanced Export

Export harus memiliki formatting yang membantu proses administrasi.

Fitur MVP:

* Header terformat.
* Auto filter.
* Freeze header.
* Auto width column.
* Sheet data pendaftar.
* Sheet statistik.
* Sorting/filtering.
* Status seleksi.
* Rekap berdasarkan Program Studi.
* Rekap berdasarkan Divisi 1.
* Rekap berdasarkan Divisi 2.

Contoh struktur workbook:

```text
HIMATRIS_OPREC_2026.xlsx

├── Data Pendaftar
├── Statistik
├── Rekap Prodi
└── Rekap Divisi
```

---

# 15. Admin Dashboard

Admin memiliki dashboard utama.

## 15.1 Dashboard Metrics

Minimal menampilkan:

```text
Total Pendaftar
Pendaftar Pending
Pendaftar Diterima
Pendaftar Ditolak
```

Tambahan:

```text
Total Program Studi
Total Divisi
Status Pendaftaran
```

---

# 16. Admin Authentication

Admin wajib melakukan login untuk mengakses dashboard.

## 16.1 Login

Minimal:

```text
Username / Email
Password
```

## 16.2 Protected Routes

Halaman berikut harus membutuhkan autentikasi:

```text
/admin
/admin/dashboard
/admin/applicants
/admin/divisions
/admin/program-studies
/admin/settings
```

Public page tidak membutuhkan login.

---

# 17. System Architecture

MVP menggunakan arsitektur:

```text
                    ┌───────────────────┐
                    │      Browser      │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │    Next.js App    │
                    │   + Shadcn UI     │
                    └─────────┬─────────┘
                              │
                         REST API
                              │
                              ▼
                    ┌───────────────────┐
                    │    Gin Golang     │
                    │      Backend      │
                    └───────┬─────┬─────┘
                            │     │
                ┌───────────┘     └────────────┐
                ▼                              ▼
       ┌────────────────┐             ┌────────────────┐
       │   PostgreSQL   │             │  Local Storage │
       │    Database    │             │      Files     │
       └────────────────┘             └────────────────┘
```

---

# 18. Technology Stack

## Frontend

```text
Next.js
TypeScript
Shadcn UI
Tailwind CSS
```

## Backend

```text
Golang
Gin Framework
REST API
```

## Database

```text
PostgreSQL
```

## File Storage

```text
Local Storage
```

Digunakan untuk menyimpan file CV.

Contoh struktur:

```text
/storage
└── cvs
    ├── 2026
    │   ├── applicant-001.pdf
    │   ├── applicant-002.pdf
    │   └── applicant-003.pdf
```

## Deployment

```text
Docker
Docker Compose
```

---

# 19. Docker Architecture

MVP dapat menggunakan beberapa container:

```text
docker-compose
│
├── frontend
│   └── Next.js
│
├── backend
│   └── Gin Golang
│
├── database
│   └── PostgreSQL
│
└── storage
    └── Persistent Volume
```

File CV harus menggunakan Docker volume agar file tidak hilang ketika container dibuat ulang.

---

# 20. Core Data Entities

MVP minimal membutuhkan entity:

```text
Admin
Registration Period
Applicant
Program Study
Division
```

Relasi konseptual:

```text
Registration Period
        │
        │ 1:N
        ▼
    Applicant
        │
        ├──────────► Program Study
        │
        ├──────────► Division 1
        │
        └──────────► Division 2
```

---

# 21. Business Rules

## 21.1 Registration

Pendaftar hanya dapat melakukan pendaftaran ketika:

```text
Current Time >= Start Time
AND
Current Time <= End Time
```

## 21.2 Duplicate NIM

NIM tidak boleh melakukan pendaftaran lebih dari satu kali dalam periode OPREC yang sama.

```text
UNIQUE(period_id, nim)
```

## 21.3 Division 2

Divisi 2 bersifat opsional.

Jika dipilih:

```text
division_2 != division_1
```

## 21.4 Division Availability

Hanya Divisi dengan status:

```text
active = true
```

yang dapat muncul pada form pendaftaran.

## 21.5 Program Study Availability

Hanya Program Studi aktif yang dapat dipilih.

## 21.6 Selection

Default status ketika pendaftar selesai melakukan registrasi:

```text
PENDING
```

Admin kemudian dapat mengubah menjadi:

```text
ACCEPTED
```

atau:

```text
REJECTED
```

---

# 22. MVP Pages

## Public

```text
/
├── Landing Page
│
├── /register
│   └── Registration Form
│
└── /result
    └── Result Checking
```

## Admin

```text
/admin/login

/admin
└── Dashboard

/admin/applicants
└── Applicant Management

/admin/applicants/:id
└── Applicant Detail

/admin/divisions
└── Division Management

/admin/program-studies
└── Program Study Management

/admin/settings
└── Registration Settings
```

---

# 23. MVP API Concept

Backend menyediakan REST API.

Contoh endpoint:

```text
POST   /api/auth/login

GET    /api/public/registration-status
POST   /api/public/register
GET    /api/public/result/:nim

GET    /api/admin/dashboard

GET    /api/admin/applicants
GET    /api/admin/applicants/:id
PATCH  /api/admin/applicants/:id/status

GET    /api/admin/divisions
POST   /api/admin/divisions
PUT    /api/admin/divisions/:id
DELETE /api/admin/divisions/:id

GET    /api/admin/program-studies
POST   /api/admin/program-studies
PUT    /api/admin/program-studies/:id
DELETE /api/admin/program-studies/:id

GET    /api/admin/registration-period
POST   /api/admin/registration-period
PUT    /api/admin/registration-period/:id

GET    /api/admin/export
```

Detail API akan didefinisikan pada `API.md`.

---

# 24. Security Requirements

Walaupun MVP, beberapa aspek keamanan wajib diterapkan.

## Authentication

Password admin tidak boleh disimpan dalam bentuk plaintext.

Gunakan password hashing seperti:

```text
bcrypt
```

## Authorization

Endpoint `/api/admin/*` hanya dapat diakses oleh admin yang terautentikasi.

## File Upload

CV harus divalidasi:

* Extension.
* MIME type.
* Ukuran file.
* Nama file.

Nama file upload sebaiknya tidak menggunakan nama asli secara langsung untuk menghindari konflik.

## NIM Lookup

Endpoint pengecekan hasil berdasarkan NIM harus membatasi informasi yang diberikan.

Jangan mengembalikan:

* Alamat.
* Nomor telepon.
* Email.
* CV.
* Data pribadi lain.

## Database

Gunakan parameterized query / ORM untuk mencegah SQL Injection.

---

# 25. MVP Non-Goals

Fitur berikut **tidak termasuk dalam MVP** dan dapat dikembangkan pada versi berikutnya:

* Registrasi menggunakan Google OAuth.
* Email notification.
* WhatsApp notification.
* Multiple admin roles.
* Sistem penilaian otomatis.
* Interview scheduling.
* Interview scoring.
* Upload dokumen selain CV.
* QR Code hasil seleksi.
* Public ranking.
* Payment system.
* Analytics tingkat lanjut.
* Audit log kompleks.
* Multi-event OPREC dalam satu dashboard.
* Mobile application.
* Real-time notification.
* Cloud object storage.

---

# 26. Future Development

Setelah MVP berhasil digunakan, sistem dapat dikembangkan menjadi platform manajemen recruitment HIMATRIS.

Potential features:

### Recruitment Workflow

```text
Registration
     ↓
Administrative Screening
     ↓
Interview
     ↓
Assessment
     ↓
Final Selection
     ↓
Announcement
```

### Scoring System

Admin dapat memberikan nilai:

```text
Administrasi
Motivasi
Pengalaman
Interview
Kompetensi
```

Kemudian sistem menghitung nilai akhir.

### Multiple Recruitment Period

Sistem dapat mendukung:

```text
OPREC HIMATRIS 2026
OPREC HIMATRIS 2027
OPREC HIMATRIS 2028
```

Data setiap periode tetap terpisah.

### Role Management

Contoh:

```text
Super Admin
Admin
Reviewer
Interviewer
```

### Notification

Sistem dapat mengirim:

```text
Email
WhatsApp
```

kepada peserta.

---

# 27. MVP Success Criteria

MVP dianggap berhasil apabila:

### Pendaftar

* [ ] Dapat membuka website HIMATRIS.
* [ ] Dapat melihat status OPREC.
* [ ] Dapat mengisi form pendaftaran.
* [ ] Dapat memilih Program Studi.
* [ ] Dapat memilih Divisi 1.
* [ ] Dapat memilih Divisi 2 secara opsional.
* [ ] Dapat mengupload CV.
* [ ] Tidak dapat mendaftar menggunakan NIM yang sama dalam periode yang sama.
* [ ] Dapat mengecek hasil menggunakan NIM.

### Admin

* [ ] Dapat login.
* [ ] Dapat melihat dashboard.
* [ ] Dapat mengatur periode OPREC.
* [ ] Dapat CRUD Program Studi.
* [ ] Dapat CRUD Divisi.
* [ ] Dapat melihat seluruh pendaftar.
* [ ] Dapat melihat detail pendaftar.
* [ ] Dapat membuka CV.
* [ ] Dapat mengubah status pendaftar.
* [ ] Dapat export data ke Excel.
* [ ] Excel memiliki data dan rekap yang terstruktur.

### System

* [ ] Frontend menggunakan Next.js.
* [ ] UI menggunakan Shadcn UI.
* [ ] Backend menggunakan Gin Golang.
* [ ] Database menggunakan PostgreSQL.
* [ ] CV tersimpan pada persistent local storage.
* [ ] Sistem dapat dijalankan menggunakan Docker.
* [ ] Admin endpoint terlindungi authentication.
* [ ] Data pendaftar tersimpan secara konsisten.

---

# 28. Definition of Done

MVP dinyatakan selesai apabila seluruh flow utama berikut dapat berjalan tanpa intervensi manual:

```text
Admin Login
     ↓
Setup Program Studi
     ↓
Setup Divisi
     ↓
Setup Periode OPREC
     ↓
Open Registration
     ↓
Mahasiswa Membuka Website
     ↓
Mengisi Form
     ↓
Upload CV
     ↓
Data Masuk Database
     ↓
Admin Melihat Pendaftar
     ↓
Admin Melakukan Seleksi
     ↓
Admin Mengubah Status
     ↓
Mahasiswa Memasukkan NIM
     ↓
Melihat Hasil Seleksi
     ↓
Admin Export Excel
```

---

# 29. MVP Priorities

Prioritas development:

### P0 — Critical

```text
Authentication
Registration Period
Registration Form
Applicant Database
Division Management
Program Study Management
Selection Status
Result Checking
```

### P1 — Important

```text
Admin Dashboard
CV Management
Excel Export
Statistics
```

### P2 — Future

```text
Email Notification
WhatsApp Notification
Interview System
Scoring System
Role Management
Multiple Recruitment Events
Advanced Analytics
```

---

# 30. Final MVP Definition

**HIMATRIS Open Recruitment MVP** adalah sistem recruitment berbasis web yang memungkinkan mahasiswa melakukan pendaftaran secara online selama periode yang telah ditentukan, sementara admin HIMATRIS dapat mengelola master data, melihat pendaftar, mengakses CV, menentukan hasil seleksi, dan mengekspor data.

Arsitektur utama:

```text
                    HIMATRIS OPREC
                           │
             ┌─────────────┴─────────────┐
             │                           │
          PUBLIC                       ADMIN
             │                           │
      ┌──────┼──────┐             ┌──────┼──────┐
      │      │      │             │      │      │
   Landing Register Result      Dashboard Manage Export
             │                           │
             └─────────────┬─────────────┘
                           │
                       REST API
                           │
                     Gin Golang
                           │
                  ┌────────┴────────┐
                  │                 │
             PostgreSQL        Local Storage
                                (CV Files)
```

Stack final:

```text
Frontend       : Next.js + TypeScript
UI             : Shadcn UI + Tailwind CSS
Backend        : Golang + Gin
Database       : PostgreSQL
File Storage   : Local Storage / Docker Volume
API            : REST API
Deployment     : Docker + Docker Compose
```

Fokus utama MVP adalah **simplicity, reliability, dan kemudahan administrasi**, sehingga fitur yang tidak berhubungan langsung dengan proses OPREC inti ditunda ke fase pengembangan berikutnya.
