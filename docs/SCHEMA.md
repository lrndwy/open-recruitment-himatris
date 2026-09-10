# SCHEMA.md

# HIMATRIS Open Recruitment System

**Version:** 1.0
**Database:** PostgreSQL
**Status:** Draft

---

# 1. Database Overview

Database HIMATRIS Open Recruitment digunakan untuk menyimpan seluruh data yang berkaitan dengan proses Open Recruitment.

Database utama terdiri dari:

```text
admins
registration_periods
program_studies
divisions
applicants
files
```

Relasi utama:

```text
                    ┌──────────────────────┐
                    │ registration_periods │
                    └──────────┬───────────┘
                               │
                               │ 1:N
                               ▼
                    ┌──────────────────────┐
                    │      applicants      │
                    └──────┬───────┬───────┘
                           │       │
                     N:1   │       │   N:1
                           ▼       ▼
                    ┌──────────┐ ┌──────────┐
                    │  prodi   │ │ division │
                    └──────────┘ └──────────┘
                           │
                           │
                           ▼
                    ┌──────────────┐
                    │    files     │
                    └──────────────┘
```

---

# 2. Design Principles

Database menggunakan prinsip:

* Relational database.
* Normalized data.
* Foreign key.
* Referential integrity.
* UUID sebagai primary key.
* Timestamp menggunakan UTC.
* Soft delete untuk master data.
* Unique constraint untuk mencegah data duplikat.
* Index untuk query yang sering digunakan.

---

# 3. UUID Strategy

Seluruh primary key menggunakan UUID.

Contoh:

```text
550e8400-e29b-41d4-a716-446655440000
```

Alasan:

* Tidak mudah ditebak.
* Aman digunakan sebagai identifier API.
* Cocok untuk distributed application.
* Tidak bergantung pada auto-increment integer.

PostgreSQL dapat menggunakan:

```sql
gen_random_uuid()
```

dengan extension:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

---

# 4. Timestamp Strategy

Seluruh timestamp menggunakan:

```sql
TIMESTAMPTZ
```

Contoh:

```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Database menyimpan timestamp dalam UTC.

Frontend/backend bertanggung jawab melakukan conversion ke timezone pengguna.

Untuk HIMATRIS Indonesia:

```text
Asia/Jakarta
```

digunakan pada presentation layer.

---

# 5. ENUM Types

## 5.1 Selection Status

```sql
CREATE TYPE selection_status AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REJECTED'
);
```

---

## 5.2 Registration Period Status

Status periode tidak wajib disimpan sebagai enum karena dapat dihitung berdasarkan waktu.

Secara logical:

```text
UPCOMING
OPEN
CLOSED
```

Status sebaiknya dihitung dari:

```text
start_at
end_at
```

sehingga tidak terjadi data yang tidak konsisten.

---

## 5.3 Admin Status

```sql
CREATE TYPE admin_status AS ENUM (
    'ACTIVE',
    'INACTIVE'
);
```

---

# 6. Table: admins

Menyimpan akun administrator.

## Structure

| Column        | Type         | Nullable | Default           |
| ------------- | ------------ | -------: | ----------------- |
| id            | UUID         |       No | gen_random_uuid() |
| username      | VARCHAR(50)  |       No | -                 |
| email         | VARCHAR(255) |       No | -                 |
| password_hash | TEXT         |       No | -                 |
| status        | admin_status |       No | ACTIVE            |
| last_login_at | TIMESTAMPTZ  |      Yes | NULL              |
| created_at    | TIMESTAMPTZ  |       No | NOW()             |
| updated_at    | TIMESTAMPTZ  |       No | NOW()             |

## SQL

```sql
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,

    status admin_status NOT NULL DEFAULT 'ACTIVE',

    last_login_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT admins_username_unique
        UNIQUE (username),

    CONSTRAINT admins_email_unique
        UNIQUE (email)
);
```

---

# 7. Table: registration_periods

Menyimpan periode Open Recruitment.

## Structure

| Column     | Type         | Nullable |
| ---------- | ------------ | -------: |
| id         | UUID         |       No |
| name       | VARCHAR(150) |       No |
| start_at   | TIMESTAMPTZ  |       No |
| end_at     | TIMESTAMPTZ  |       No |
| created_at | TIMESTAMPTZ  |       No |
| updated_at | TIMESTAMPTZ  |       No |

## SQL

```sql
CREATE TABLE registration_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL,

    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT registration_period_valid_time
        CHECK (end_at > start_at)
);
```

## Registration Status

Status dihitung:

```sql
CASE
    WHEN NOW() < start_at THEN 'UPCOMING'
    WHEN NOW() >= start_at AND NOW() <= end_at THEN 'OPEN'
    ELSE 'CLOSED'
END
```

Tidak perlu menyimpan `status` di database.

---

# 8. Table: program_studies

Menyimpan master Program Studi.

## Structure

| Column     | Type         | Nullable |
| ---------- | ------------ | -------: |
| id         | UUID         |       No |
| name       | VARCHAR(150) |       No |
| code       | VARCHAR(30)  |      Yes |
| is_active  | BOOLEAN      |       No |
| deleted_at | TIMESTAMPTZ  |      Yes |
| created_at | TIMESTAMPTZ  |       No |
| updated_at | TIMESTAMPTZ  |       No |

## SQL

```sql
CREATE TABLE program_studies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL,
    code VARCHAR(30),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    deleted_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Unique Constraint

Karena menggunakan soft delete:

```sql
CREATE UNIQUE INDEX program_studies_name_unique
ON program_studies (LOWER(name))
WHERE deleted_at IS NULL;
```

Code:

```sql
CREATE UNIQUE INDEX program_studies_code_unique
ON program_studies (LOWER(code))
WHERE code IS NOT NULL
AND deleted_at IS NULL;
```

---

# 9. Table: divisions

Menyimpan master Divisi HIMATRIS.

## Structure

| Column      | Type         | Nullable |
| ----------- | ------------ | -------: |
| id          | UUID         |       No |
| name        | VARCHAR(150) |       No |
| description | TEXT         |      Yes |
| is_active   | BOOLEAN      |       No |
| deleted_at  | TIMESTAMPTZ  |      Yes |
| created_at  | TIMESTAMPTZ  |       No |
| updated_at  | TIMESTAMPTZ  |       No |

## SQL

```sql
CREATE TABLE divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL,
    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    deleted_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Unique

```sql
CREATE UNIQUE INDEX divisions_name_unique
ON divisions (LOWER(name))
WHERE deleted_at IS NULL;
```

---

# 10. Table: applicants

Tabel utama yang menyimpan data pendaftar.

## Structure

| Column                 | Type             | Nullable | Default |
| ---------------------- | ---------------- | -------: | ------- |
| id                     | UUID             |       No | UUID    |
| registration_period_id | UUID             |       No | -       |
| name                   | VARCHAR(150)     |       No | -       |
| nim                    | VARCHAR(50)      |       No | -       |
| class                  | VARCHAR(50)      |       No | -       |
| program_study_id       | UUID             |       No | -       |
| division_1_id          | UUID             |       No | -       |
| division_1_reason      | TEXT             |       No | -       |
| division_2_id          | UUID             |      Yes | NULL    |
| division_2_reason      | TEXT             |      Yes | NULL    |
| selection_status       | selection_status |       No | PENDING |
| created_at             | TIMESTAMPTZ      |       No | NOW()   |
| updated_at             | TIMESTAMPTZ      |       No | NOW()   |

---

## SQL

```sql
CREATE TABLE applicants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    registration_period_id UUID NOT NULL,
    program_study_id UUID NOT NULL,

    name VARCHAR(150) NOT NULL,
    nim VARCHAR(50) NOT NULL,
    class VARCHAR(50) NOT NULL,

    division_1_id UUID NOT NULL,
    division_1_reason TEXT NOT NULL,

    division_2_id UUID,
    division_2_reason TEXT,

    selection_status selection_status NOT NULL DEFAULT 'PENDING',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT applicants_period_fk
        FOREIGN KEY (registration_period_id)
        REFERENCES registration_periods(id)
        ON DELETE RESTRICT,

    CONSTRAINT applicants_program_study_fk
        FOREIGN KEY (program_study_id)
        REFERENCES program_studies(id)
        ON DELETE RESTRICT,

    CONSTRAINT applicants_division_1_fk
        FOREIGN KEY (division_1_id)
        REFERENCES divisions(id)
        ON DELETE RESTRICT,

    CONSTRAINT applicants_division_2_fk
        FOREIGN KEY (division_2_id)
        REFERENCES divisions(id)
        ON DELETE RESTRICT,

    CONSTRAINT applicants_nim_period_unique
        UNIQUE (registration_period_id, nim),

    CONSTRAINT applicants_division_different
        CHECK (
            division_2_id IS NULL
            OR division_2_id <> division_1_id
        ),

    CONSTRAINT applicants_division_2_reason_required
        CHECK (
            division_2_id IS NULL
            OR (
                division_2_reason IS NOT NULL
                AND LENGTH(TRIM(division_2_reason)) > 0
            )
        )
);
```

---

# 11. CV File Design

CV tidak disimpan langsung sebagai binary data di PostgreSQL.

Database hanya menyimpan metadata file.

Karena satu applicant pada MVP hanya memiliki satu CV, file dapat memiliki relasi:

```text
Applicant 1 ─────── 1 File
```

---

# 12. Table: files

Menyimpan metadata file yang diupload.

## Structure

| Column        | Type         | Nullable |
| ------------- | ------------ | -------: |
| id            | UUID         |       No |
| applicant_id  | UUID         |       No |
| original_name | VARCHAR(255) |       No |
| stored_name   | VARCHAR(255) |       No |
| path          | TEXT         |       No |
| mime_type     | VARCHAR(100) |       No |
| extension     | VARCHAR(20)  |       No |
| size_bytes    | BIGINT       |       No |
| created_at    | TIMESTAMPTZ  |       No |

## SQL

```sql
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    applicant_id UUID NOT NULL,

    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,

    path TEXT NOT NULL,

    mime_type VARCHAR(100) NOT NULL,
    extension VARCHAR(20) NOT NULL,

    size_bytes BIGINT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT files_applicant_fk
        FOREIGN KEY (applicant_id)
        REFERENCES applicants(id)
        ON DELETE CASCADE,

    CONSTRAINT files_size_positive
        CHECK (size_bytes > 0),

    CONSTRAINT files_applicant_unique
        UNIQUE (applicant_id)
);
```

---

# 13. Complete Entity Relationship

```text
┌─────────────────────────────┐
│           admins            │
├─────────────────────────────┤
│ id PK                       │
│ username                    │
│ email                       │
│ password_hash               │
│ status                      │
│ last_login_at               │
│ created_at                  │
│ updated_at                  │
└─────────────────────────────┘


┌─────────────────────────────┐
│    registration_periods     │
├─────────────────────────────┤
│ id PK                       │
│ name                        │
│ start_at                    │
│ end_at                      │
│ created_at                  │
│ updated_at                  │
└──────────────┬──────────────┘
               │
               │ 1:N
               ▼
┌─────────────────────────────┐
│         applicants          │
├─────────────────────────────┤
│ id PK                       │
│ registration_period_id FK   │
│ program_study_id FK        │
│ name                        │
│ nim                         │
│ class                       │
│ division_1_id FK            │
│ division_1_reason           │
│ division_2_id FK            │
│ division_2_reason           │
│ selection_status            │
│ created_at                  │
│ updated_at                  │
└───────┬─────────┬───────────┘
        │         │
        │         │
        │         └─────────────────┐
        │                           │
        ▼                           ▼
┌──────────────────┐       ┌──────────────────┐
│ program_studies  │       │    divisions     │
├──────────────────┤       ├──────────────────┤
│ id PK            │       │ id PK            │
│ name             │       │ name             │
│ code             │       │ description      │
│ is_active        │       │ is_active        │
│ deleted_at       │       │ deleted_at       │
│ created_at       │       │ created_at       │
│ updated_at       │       │ updated_at       │
└──────────────────┘       └──────────────────┘
                                   ▲
                                   │
                         ┌─────────┴─────────┐
                         │ division_2_id     │
                         │ division_1_id     │
                         └───────────────────┘


┌─────────────────────────────┐
│            files            │
├─────────────────────────────┤
│ id PK                       │
│ applicant_id FK UNIQUE      │
│ original_name               │
│ stored_name                 │
│ path                        │
│ mime_type                   │
│ extension                   │
│ size_bytes                  │
│ created_at                  │
└─────────────────────────────┘
```

---

# 14. Relationship Summary

| Parent              | Child                   | Cardinality |
| ------------------- | ----------------------- | ----------- |
| Registration Period | Applicants              | 1:N         |
| Program Study       | Applicants              | 1:N         |
| Division            | Applicants (Division 1) | 1:N         |
| Division            | Applicants (Division 2) | 1:N         |
| Applicant           | File                    | 1:1         |

---

# 15. Foreign Key Rules

## Registration Period

```text
registration_periods
        ↓
applicants
```

`ON DELETE RESTRICT`

Periode tidak boleh dihapus apabila sudah memiliki pendaftar.

---

## Program Study

```text
program_studies
        ↓
applicants
```

`ON DELETE RESTRICT`

Program Studi yang sudah digunakan tidak boleh benar-benar dihapus.

Gunakan:

```text
is_active = false
```

dan:

```text
deleted_at = NOW()
```

---

## Division

```text
divisions
        ↓
applicants
```

Gunakan:

```text
ON DELETE RESTRICT
```

untuk menjaga historical data.

---

## Applicant → File

```text
applicants
     ↓
files
```

Gunakan:

```text
ON DELETE CASCADE
```

Jika applicant benar-benar dihapus, metadata file ikut dihapus.

---

# 16. Index Strategy

Index diperlukan untuk query yang sering digunakan.

## Applicants

```sql
CREATE INDEX applicants_nim_idx
ON applicants (nim);
```

```sql
CREATE INDEX applicants_period_idx
ON applicants (registration_period_id);
```

```sql
CREATE INDEX applicants_program_study_idx
ON applicants (program_study_id);
```

```sql
CREATE INDEX applicants_division_1_idx
ON applicants (division_1_id);
```

```sql
CREATE INDEX applicants_division_2_idx
ON applicants (division_2_id);
```

```sql
CREATE INDEX applicants_selection_status_idx
ON applicants (selection_status);
```

```sql
CREATE INDEX applicants_created_at_idx
ON applicants (created_at DESC);
```

---

# 17. Search Index

Untuk pencarian berdasarkan nama, PostgreSQL dapat menggunakan:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Kemudian:

```sql
CREATE INDEX applicants_name_trgm_idx
ON applicants
USING GIN (name gin_trgm_ops);
```

Hal ini membantu query seperti:

```sql
SELECT *
FROM applicants
WHERE name ILIKE '%hafiz%';
```

---

# 18. Registration Period Index

```sql
CREATE INDEX registration_periods_start_at_idx
ON registration_periods (start_at);

CREATE INDEX registration_periods_end_at_idx
ON registration_periods (end_at);
```

---

# 19. Active Master Data Index

Program Studi:

```sql
CREATE INDEX program_studies_active_idx
ON program_studies (is_active)
WHERE deleted_at IS NULL;
```

Divisi:

```sql
CREATE INDEX divisions_active_idx
ON divisions (is_active)
WHERE deleted_at IS NULL;
```

---

# 20. Applicant Search & Filter

Query umum:

### Search NIM

```sql
SELECT *
FROM applicants
WHERE nim = $1;
```

### Search Name

```sql
SELECT *
FROM applicants
WHERE name ILIKE '%' || $1 || '%';
```

### Filter Program Studi

```sql
SELECT *
FROM applicants
WHERE program_study_id = $1;
```

### Filter Division

```sql
SELECT *
FROM applicants
WHERE division_1_id = $1
   OR division_2_id = $1;
```

### Filter Status

```sql
SELECT *
FROM applicants
WHERE selection_status = $1;
```

---

# 21. Public Result Query

Public hanya membutuhkan status.

Query:

```sql
SELECT
    nim,
    selection_status
FROM applicants
WHERE nim = $1
LIMIT 1;
```

Backend tidak boleh mengembalikan seluruh object applicant ke public.

---

# 22. Applicant Detail Query

Admin dapat memperoleh data lengkap:

```sql
SELECT
    a.id,
    a.name,
    a.nim,
    a.class,

    ps.id AS program_study_id,
    ps.name AS program_study_name,

    d1.id AS division_1_id,
    d1.name AS division_1_name,
    a.division_1_reason,

    d2.id AS division_2_id,
    d2.name AS division_2_name,
    a.division_2_reason,

    a.selection_status,

    a.created_at,
    a.updated_at

FROM applicants a

JOIN program_studies ps
    ON ps.id = a.program_study_id

JOIN divisions d1
    ON d1.id = a.division_1_id

LEFT JOIN divisions d2
    ON d2.id = a.division_2_id

WHERE a.id = $1;
```

---

# 23. Data Validation Rules

Database harus menjadi lapisan terakhir validasi.

## Applicant Name

```text
NOT NULL
```

## NIM

```text
NOT NULL
UNIQUE per registration period
```

## Class

```text
NOT NULL
```

## Program Study

```text
NOT NULL
FOREIGN KEY
```

## Division 1

```text
NOT NULL
FOREIGN KEY
```

## Division 2

```text
NULLABLE
FOREIGN KEY
```

## Division 2 Reason

```text
NULLABLE

BUT REQUIRED WHEN division_2_id IS NOT NULL
```

---

# 24. Important Business Constraints

## Constraint 1 — Duplicate NIM

Tidak boleh:

```text
Period A + NIM 123
Period A + NIM 123
```

Boleh:

```text
Period A + NIM 123
Period B + NIM 123
```

Karena unique constraint:

```sql
UNIQUE (registration_period_id, nim)
```

---

## Constraint 2 — Division 2

Tidak boleh:

```text
Division 1 = PSDM
Division 2 = PSDM
```

Database mencegahnya dengan:

```sql
CHECK (
    division_2_id IS NULL
    OR division_2_id <> division_1_id
)
```

---

## Constraint 3 — Division 2 Reason

Tidak boleh:

```text
division_2_id = PSDM
division_2_reason = NULL
```

---

## Constraint 4 — Registration Period

Tidak boleh:

```text
start_at >= end_at
```

Database menggunakan:

```sql
CHECK (end_at > start_at)
```

---

# 25. Soft Delete Strategy

Master data:

```text
Program Study
Division
```

menggunakan soft delete.

Contoh:

```text
deleted_at = NULL
```

berarti aktif secara record.

Ketika dihapus:

```text
deleted_at = NOW()
is_active = FALSE
```

Data applicant lama tetap dapat mereferensikan record tersebut.

---

# 26. Why Soft Delete?

Misalnya:

```text
2026

Applicant:
Hafiz
Program Study:
Teknik Informatika
```

Kemudian admin menghapus Program Studi.

Jika menggunakan hard delete, historical data dapat bermasalah.

Dengan soft delete:

```text
program_studies
----------------------------
name: Teknik Informatika
is_active: false
deleted_at: 2027-01-01
```

Data pendaftar tahun 2026 tetap valid.

---

# 27. Data Retention

MVP tidak menghapus data pendaftar secara otomatis.

Data tetap tersimpan untuk kebutuhan:

* Arsip.
* Rekap organisasi.
* Export.
* Historical recruitment.

Penghapusan permanen dapat dibuat sebagai fitur administratif pada fase berikutnya.

---

# 28. Security Considerations

## Password

Tidak boleh:

```text
password
```

Disimpan langsung.

Harus:

```text
password_hash
```

Contoh algoritma:

```text
bcrypt
```

---

## CV

Path file tidak boleh dapat ditebak secara mudah.

Gunakan UUID:

```text
/storage/cvs/2026/
550e8400-e29b-41d4-a716-446655440000.pdf
```

bukan:

```text
/storage/cvs/2026/hafiz.pdf
```

---

# 29. File Security

Database menyimpan:

```text
mime_type
extension
size_bytes
```

Backend harus tetap melakukan validasi file.

Recommended:

```text
Allowed MIME:
application/pdf
```

Maximum:

```text
5 MB
```

---

# 30. Transaction Strategy

Proses pendaftaran harus menggunakan database transaction.

Flow:

```text
BEGIN
   │
   ├── Validate registration period
   │
   ├── Validate NIM
   │
   ├── Validate Program Study
   │
   ├── Validate Division
   │
   ├── Create Applicant
   │
   ├── Create File Metadata
   │
   └── COMMIT
```

Jika terjadi error:

```text
ROLLBACK
```

---

# 31. Registration Transaction Consideration

Karena CV disimpan pada filesystem dan bukan PostgreSQL, proses registration perlu menangani kemungkinan:

```text
Database success
File failure
```

atau:

```text
File success
Database failure
```

Recommended flow:

```text
1. Validate request
2. Validate CV
3. Generate UUID
4. Save CV temporary
5. BEGIN DB transaction
6. Create applicant
7. Create file metadata
8. COMMIT
9. Move/rename CV to final location
```

Jika database gagal:

```text
ROLLBACK
Delete temporary CV
```

Backend harus memiliki cleanup mechanism untuk file orphan.

---

# 32. Recommended Storage Structure

```text
/storage
│
└── cvs
    │
    ├── 2026
    │   ├── {uuid}.pdf
    │   ├── {uuid}.pdf
    │   └── {uuid}.pdf
    │
    └── 2027
        ├── {uuid}.pdf
        └── {uuid}.pdf
```

Storage berada pada Docker volume.

---

# 33. Recommended Database Migration Order

Migration dijalankan dengan urutan:

```text
001_extensions.sql
        ↓
002_enums.sql
        ↓
003_admins.sql
        ↓
004_registration_periods.sql
        ↓
005_program_studies.sql
        ↓
006_divisions.sql
        ↓
007_applicants.sql
        ↓
008_files.sql
        ↓
009_indexes.sql
        ↓
010_seed.sql
```

---

# 34. Seed Data

Development environment dapat memiliki seed:

## Admin

```text
username:
admin

email:
admin@himatris.local
```

Password harus dibuat menggunakan hash.

Jangan menggunakan password production pada seed.

---

## Program Studies

Contoh:

```text
Teknik Informatika
Sistem Informasi
Rekayasa Perangkat Lunak
```

Data sebenarnya harus disesuaikan dengan Program Studi HIMATRIS.

---

## Divisions

Contoh:

```text
Kajian Strategis
PSDM
Humas
Minat dan Bakat
Kewirausahaan
```

Data sebenarnya harus disesuaikan dengan struktur resmi HIMATRIS.

---

# 35. Database Environment

## Development

```text
Database:
himatris_oprec_dev
```

## Testing

```text
Database:
himatris_oprec_test
```

## Production

```text
Database:
himatris_oprec
```

Credential tidak boleh hardcode di source code.

Gunakan environment variables.

---

# 36. Environment Variables

Backend membutuhkan:

```text
DATABASE_HOST
DATABASE_PORT
DATABASE_NAME
DATABASE_USER
DATABASE_PASSWORD

JWT_SECRET

STORAGE_PATH
MAX_CV_SIZE
```

Contoh:

```text
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=himatris_oprec
DATABASE_USER=postgres
DATABASE_PASSWORD=********

STORAGE_PATH=/storage
MAX_CV_SIZE=5242880
```

---

# 37. Future Schema Considerations

Schema MVP sengaja dibuat sederhana.

Untuk versi berikutnya dapat ditambahkan:

```text
recruitment_events
application_scores
interviews
interviewers
interview_schedules
notifications
admin_roles
admin_permissions
audit_logs
application_status_history
```

Contoh future architecture:

```text
Recruitment Event
        │
        ▼
Application
        │
   ┌────┼────┐
   ▼    ▼    ▼
Interview Score Documents
   │
   ▼
Selection
```

---

# 38. Future Selection History

MVP hanya menyimpan status terbaru:

```text
selection_status
```

Pada versi berikutnya sebaiknya dibuat:

```text
selection_status_histories
```

Contoh:

```text
PENDING
   ↓
ACCEPTED
   ↓
REJECTED
```

Dengan data:

```text
changed_by
old_status
new_status
reason
created_at
```

Hal ini memungkinkan audit trail.

---

# 39. Final Schema

MVP final terdiri dari:

```text
┌────────────────────────────┐
│           admins           │
└────────────────────────────┘

┌────────────────────────────┐
│    registration_periods    │
└──────────────┬─────────────┘
               │
               ▼
┌────────────────────────────┐
│         applicants         │
└──────┬────────┬────────────┘
       │        │
       ▼        ▼
┌────────────┐ ┌────────────┐
│  prodi     │ │  divisions │
└────────────┘ └────────────┘
       │
       │
       ▼
┌────────────────────────────┐
│           files            │
└────────────────────────────┘
```

### Tables

```text
1. admins
2. registration_periods
3. program_studies
4. divisions
5. applicants
6. files
```

### Enums

```text
selection_status
admin_status
```

### Extensions

```text
pgcrypto
pg_trgm
```

### Primary Key

```text
UUID
```

### Timestamp

```text
TIMESTAMPTZ
```

### Soft Delete

```text
program_studies
divisions
```

### Main Unique Constraint

```text
(registration_period_id, nim)
```

---

# 40. Schema Design Principle

Database HIMATRIS Open Recruitment mengikuti prinsip:

> **Historical data must remain valid even when master data changes.**

Karena itu:

* Applicant tidak boleh kehilangan relasi ketika Divisi berubah.
* Applicant tidak boleh kehilangan relasi ketika Program Studi dinonaktifkan.
* Registration Period tidak boleh dihapus jika sudah digunakan.
* Master data menggunakan soft delete.
* CV disimpan di filesystem dengan metadata pada database.
* Status registration dihitung dari waktu, bukan disimpan sebagai data redundant.

Dengan struktur ini, database MVP tetap sederhana namun sudah memiliki fondasi yang baik untuk dikembangkan menjadi **Recruitment Management System HIMATRIS**.
