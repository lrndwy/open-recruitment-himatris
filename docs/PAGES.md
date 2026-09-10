# PAGES.md

# HIMATRIS Open Recruitment System

**Version:** 1.0
**Status:** Draft
**Frontend:** Next.js + TypeScript
**UI:** Shadcn UI + Tailwind CSS

---

# 1. Overview

Dokumen ini mendefinisikan seluruh halaman yang harus dibuat oleh Frontend HIMATRIS Open Recruitment.

Setiap halaman menjelaskan:

* Route.
* User yang dapat mengakses.
* Tujuan halaman.
* Operasi.
* Input.
* Variables.
* State.
* API yang digunakan.
* Komponen UI.
* Loading state.
* Error state.
* Empty state.
* Success state.

---

# 2. Page Architecture

Frontend dibagi menjadi dua area:

```text id="c3f11u"
PUBLIC
│
├── Landing
├── Registration
└── Result Checking


ADMIN
│
├── Login
├── Dashboard
├── Applicants
├── Applicant Detail
├── Divisions
├── Program Studies
└── Registration Period
```

---

# 3. Route Map

```text id="s3c7a8"
/                           → Landing Page

/register                   → Registration Page

/result                     → Result Checking Page


/admin/login                → Admin Login

/admin                      → Admin Dashboard

/admin/applicants           → Applicant Management

/admin/applicants/[id]      → Applicant Detail

/admin/divisions            → Division Management

/admin/program-studies      → Program Study Management

/admin/registration         → Registration Period Management
```

---

# 4. Global Frontend Requirements

Seluruh halaman harus:

* Responsive.
* Mobile friendly.
* Menggunakan Shadcn UI.
* Menggunakan TypeScript.
* Menggunakan reusable components.
* Memiliki loading state.
* Memiliki error state.
* Memiliki empty state jika relevan.
* Menggunakan toast untuk feedback operasi.
* Tidak menampilkan data sensitif kepada public.

---

# 5. PUBLIC PAGES

# PAGE-001 — Landing Page

## Route

```text id="y2by6k"
/
```

## Access

```text id="mlqhrw"
Public
```

---

## Purpose

Halaman utama untuk memperkenalkan Open Recruitment HIMATRIS dan mengarahkan mahasiswa ke proses pendaftaran.

---

## Main Sections

```text id="n4s1v5"
Navbar
Hero
Registration Status
About OPREC
Divisions
Registration CTA
Result CTA
Footer
```

---

## Operations

### Get Registration Status

```text id="eiy7fn"
GET /public/registration
```

### Get Divisions

```text id="0yl8x9"
GET /public/divisions
```

---

## Variables

```ts id="zt0j2e"
registrationPeriod
divisions
registrationStatus
isLoading
error
```

---

## Registration Period Object

```ts id="5ylb9u"
type RegistrationPeriod = {
  id: string
  name: string
  start_at: string
  end_at: string
  status: "UPCOMING" | "OPEN" | "CLOSED"
}
```

---

## UI Behavior

### UPCOMING

CTA:

```text
Pendaftaran Belum Dibuka
```

Button register disabled.

### OPEN

CTA:

```text
Daftar Sekarang
```

Button aktif.

### CLOSED

CTA:

```text
Pendaftaran Telah Ditutup
```

Button register disabled.

---

## Components

```text id="j6gqq7"
Navbar
Hero
Badge
RegistrationStatusCard
DivisionCard
Button
Footer
```

---

# PAGE-002 — Registration Page

## Route

```text id="zmmc49"
/register
```

## Access

```text id="h5bdz7"
Public
```

---

## Purpose

Halaman utama untuk melakukan pendaftaran OPREC HIMATRIS.

---

# Operations

### Get Registration Status

```text id="y3vqfc"
GET /public/registration
```

### Get Program Studies

```text id="k9k4uy"
GET /public/program-studies
```

### Get Divisions

```text id="0l4e4k"
GET /public/divisions
```

### Submit Registration

```text id="5w24ec"
POST /public/applications
```

---

# Form Inputs

## 1. Nama

```text id="1drn7y"
name
```

Type:

```text
text
```

Required:

```text
true
```

---

## 2. NIM

```text id="y2fk1g"
nim
```

Type:

```text
text
```

Required:

```text
true
```

---

## 3. Kelas

```text id="n8o4wq"
class
```

Type:

```text
text
```

Required:

```text
true
```

---

## 4. Program Studi

```text id="9ik5a0"
program_study_id
```

Type:

```text
select
```

Required:

```text
true
```

Options berasal dari:

```text
programStudies
```

---

## 5. Divisi 1

```text id="20m6b3"
division_1_id
```

Type:

```text
select
```

Required:

```text
true
```

Options:

```text
divisions
```

---

## 6. Alasan Divisi 1

```text id="w8o4gs"
division_1_reason
```

Type:

```text
textarea
```

Required:

```text
true
```

---

## 7. Divisi 2

```text id="6fzvqc"
division_2_id
```

Type:

```text
select
```

Required:

```text
false
```

---

## 8. Alasan Divisi 2

```text id="3ql7i8"
division_2_reason
```

Type:

```text
textarea
```

Required:

```text
division_2_id != null
```

---

## 9. CV

```text id="19e5p5"
cv
```

Type:

```text
file
```

Required:

```text
true
```

Recommended:

```text
PDF
Maximum 5 MB
```

---

# Form State

```ts id="u3h8cx"
type RegistrationForm = {
  name: string
  nim: string
  class: string
  program_study_id: string
  division_1_id: string
  division_1_reason: string
  division_2_id: string | null
  division_2_reason: string
  cv: File | null
}
```

---

# Page Variables

```ts id="td2lh7"
registrationPeriod
programStudies
divisions

form
errors

isLoading
isSubmitting

submitError
submitSuccess
```

---

# Client-Side Validation

```text id="aj1c8e"
name
→ required
→ minimum 3 characters

nim
→ required

class
→ required

program_study_id
→ required

division_1_id
→ required

division_1_reason
→ required

division_2_id
→ optional

division_2_reason
→ required when division_2_id exists

cv
→ required
→ PDF
→ maximum 5 MB
```

---

# Dynamic Behavior

Jika:

```text
division_2_id = null
```

maka:

```text
division_2_reason
```

tidak wajib.

Jika:

```text
division_2_id != null
```

maka:

```text
division_2_reason
```

menjadi required.

Division 1 tidak boleh muncul sebagai option Division 2.

---

# Submit Flow

```text id="z5v1oq"
Fill Form
   ↓
Client Validation
   ↓
Create FormData
   ↓
POST /public/applications
   ↓
Success
   ↓
Registration Success State
```

---

# Registration Success

Setelah berhasil:

```text id="6nq1ce"
Pendaftaran Berhasil

NIM:
23010001

Status:
Menunggu Seleksi
```

Button:

```text
Cek Hasil Seleksi
```

---

# Error States

### Registration Closed

```text
Pendaftaran sedang tidak dibuka.
```

### Duplicate NIM

```text
NIM sudah terdaftar.
```

### Invalid CV

```text
File CV tidak valid.
```

### Server Error

```text
Terjadi kesalahan.
Silakan coba lagi.
```

---

# Components

```text id="ohx3ps"
RegistrationForm
Input
Select
Textarea
FileUpload
Button
FormError
RegistrationStatus
SuccessCard
```

---

# PAGE-003 — Result Checking

## Route

```text id="q6qpj6"
/result
```

## Access

```text
Public
```

---

## Purpose

Memungkinkan mahasiswa mengecek hasil seleksi menggunakan NIM.

---

# Input

```text id="ct7mfi"
nim
```

Type:

```text
text
```

Required:

```text
true
```

---

# Operations

### Check Result

```text id="3aw7gq"
GET /public/result?nim={nim}
```

---

# Variables

```ts id="35f5fq"
nim
result
isLoading
error
hasSearched
```

---

# Result Type

```ts id="w9g0cl"
type SelectionStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
```

---

# UI States

## Initial

```text
Masukkan NIM Anda
```

---

## Loading

```text
Mengecek hasil...
```

---

## PENDING

```text
Hasil Seleksi Masih Diproses
```

---

## ACCEPTED

```text
Selamat!

Anda dinyatakan DITERIMA
di HIMATRIS.
```

---

## REJECTED

```text
Terima kasih telah mengikuti
Open Recruitment HIMATRIS.

Anda dinyatakan BELUM DITERIMA.
```

---

## NOT FOUND

```text
Data pendaftar tidak ditemukan.
```

---

# Components

```text id="20gcxi"
ResultSearchForm
Input
Button
ResultCard
StatusBadge
```

---

# 6. ADMIN PAGES

# PAGE-004 — Admin Login

## Route

```text id="91o4f4"
/admin/login
```

## Access

```text
Public
```

---

## Purpose

Authentikasi administrator.

---

# Inputs

## Username

```text id="x3v8z3"
username
```

Type:

```text
text
```

Required:

```text
true
```

---

## Password

```text id="oh9n1y"
password
```

Type:

```text
password
```

Required:

```text
true
```

---

# Operations

```text id="x2w6zq"
POST /auth/login
```

---

# Variables

```ts id="7t3tah"
username
password

isLoading
error

accessToken
admin
```

---

# Success Flow

```text id="mmu5qg"
Login
 ↓
Receive JWT
 ↓
Store Auth State
 ↓
Redirect /admin
```

---

# Error

```text
Username atau password salah.
```

---

# Components

```text id="qfglxu"
LoginForm
Input
PasswordInput
Button
Alert
```

---

# PAGE-005 — Admin Dashboard

## Route

```text id="gzceh2"
/admin
```

## Access

```text
Authenticated Admin
```

---

# Purpose

Menampilkan ringkasan kondisi OPREC.

---

# Operations

```text id="qcf5c4"
GET /admin/dashboard
```

---

# Variables

```ts id="86i1c5"
dashboard
isLoading
error
```

---

# Dashboard Type

```ts id="q5a4w9"
type Dashboard = {
  applicants: {
    total: number
    pending: number
    accepted: number
    rejected: number
  }

  master_data: {
    divisions: number
    program_studies: number
  }

  registration: {
    status: "UPCOMING" | "OPEN" | "CLOSED"
    name: string
  }
}
```

---

# UI

Metrics:

```text
Total Pendaftar
Pending
Accepted
Rejected
```

Additional:

```text
Total Divisi
Total Program Studi
Registration Status
```

---

# Components

```text id="4cq09t"
AdminSidebar
AdminHeader
MetricCard
RegistrationStatusCard
QuickAction
```

---

# PAGE-006 — Applicant Management

## Route

```text id="g7e44h"
/admin/applicants
```

## Access

```text
Authenticated Admin
```

---

# Purpose

Mengelola seluruh data pendaftar.

---

# Operations

### Get Applicants

```text id="8b2ghy"
GET /admin/applicants
```

### Search

Menggunakan parameter:

```text
search
```

### Filter

```text
program_study_id
division_id
status
registration_period_id
```

---

# Query Variables

```ts id="h1qyrj"
page
limit

search
nim

programStudyId
divisionId
status
registrationPeriodId

sort
order
```

---

# Page State

```ts id="xklyjk"
applicants
pagination

isLoading
error
```

---

# Applicant List

Columns:

```text
No
Nama
NIM
Kelas
Program Studi
Divisi 1
Divisi 2
Status
Tanggal Pendaftaran
Action
```

---

# Operations

### Search

Input:

```text
search
```

### Filter Status

Select:

```text
ALL
PENDING
ACCEPTED
REJECTED
```

### Filter Program Studi

Select dari:

```text
programStudies
```

### Filter Division

Select dari:

```text
divisions
```

### Pagination

```text
page
limit
```

### View Detail

Navigate:

```text
/admin/applicants/{id}
```

---

# Components

```text id="pjjfpl"
DataTable
SearchInput
FilterDropdown
StatusBadge
Pagination
Button
DropdownMenu
```

---

# PAGE-007 — Applicant Detail

## Route

```text id="k2tvf4"
/admin/applicants/[id]
```

## Access

```text
Authenticated Admin
```

---

# Purpose

Menampilkan seluruh detail pendaftar dan menyediakan operasi seleksi.

---

# Operations

### Get Applicant

```text
GET /admin/applicants/:id
```

### Update Status

```text
PATCH /admin/applicants/:id/status
```

### Get CV

```text
GET /admin/applicants/:id/cv
```

---

# Route Variable

```ts id="zj8e2p"
id: string
```

---

# Page Variables

```ts id="p8w8dq"
applicant
isLoading
error

selectionStatus
isUpdatingStatus
statusUpdateError

cvUrl
isLoadingCV
```

---

# Applicant Data

```ts id="a4u4jf"
type Applicant = {
  id: string
  name: string
  nim: string
  class: string

  program_study: {
    id: string
    name: string
  }

  division_1: {
    id: string
    name: string
    reason: string
  }

  division_2: {
    id: string
    name: string
    reason: string
  } | null

  cv: {
    id: string
    original_name: string
    mime_type: string
    size_bytes: number
  }

  selection_status:
    | "PENDING"
    | "ACCEPTED"
    | "REJECTED"

  created_at: string
  updated_at: string
}
```

---

# UI Sections

```text
Applicant Header

Personal Information
├── Nama
├── NIM
├── Kelas
└── Program Studi

Division Preference
├── Division 1
├── Reason
├── Division 2
└── Reason

CV
└── View / Download

Selection
└── Status
```

---

# Selection Input

```text id="8v3n7c"
selectionStatus
```

Select:

```text
PENDING
ACCEPTED
REJECTED
```

---

# Status Update Flow

```text id="b5g23j"
Select Status
      ↓
Confirmation Dialog
      ↓
PATCH API
      ↓
Success
      ↓
Refresh Applicant
```

---

# Confirmation

Contoh:

```text
Apakah Anda yakin ingin mengubah
status pendaftar menjadi ACCEPTED?
```

---

# CV Operation

Button:

```text
Lihat CV
```

Membuka:

```text
/admin/applicants/:id/cv
```

atau menggunakan blob URL pada browser.

---

# Components

```text id="o7esb0"
ApplicantInfo
DivisionPreference
CVViewer
SelectionControl
ConfirmationDialog
StatusBadge
Button
```

---

# PAGE-008 — Division Management

## Route

```text id="b4shd7"
/admin/divisions
```

## Access

```text
Authenticated Admin
```

---

# Purpose

CRUD Divisi HIMATRIS.

---

# Operations

```text
GET    /admin/divisions
POST   /admin/divisions
PUT    /admin/divisions/:id
DELETE /admin/divisions/:id
```

---

# Variables

```ts id="b7nvjj"
divisions

search
isActive

isLoading
isSubmitting

selectedDivision
isDialogOpen
isDeleteDialogOpen

form
errors
```

---

# Division Form

## Name

```text
name
```

Type:

```text
text
```

Required:

```text
true
```

---

## Description

```text
description
```

Type:

```text
textarea
```

Required:

```text
false
```

---

## Status

```text
is_active
```

Type:

```text
switch
```

Default:

```text
true
```

---

# Form Type

```ts id="yrxb8g"
type DivisionForm = {
  name: string
  description: string
  is_active: boolean
}
```

---

# UI

```text
Page Header
├── Title
└── Add Division

Search

Division Table
├── Name
├── Description
├── Status
└── Action
```

---

# Create Flow

```text
Click Add Division
 ↓
Open Dialog
 ↓
Fill Form
 ↓
Validate
 ↓
POST
 ↓
Refresh List
```

---

# Edit Flow

```text
Click Edit
 ↓
Load Data
 ↓
Open Dialog
 ↓
Modify
 ↓
PUT
 ↓
Refresh List
```

---

# Delete Flow

```text
Click Delete
 ↓
Confirmation
 ↓
DELETE
 ↓
Refresh List
```

---

# Components

```text
DataTable
DivisionDialog
Input
Textarea
Switch
DropdownMenu
AlertDialog
Button
```

---

# PAGE-009 — Program Study Management

## Route

```text id="q1j7de"
/admin/program-studies
```

## Access

```text
Authenticated Admin
```

---

# Operations

```text
GET    /admin/program-studies
POST   /admin/program-studies
PUT    /admin/program-studies/:id
DELETE /admin/program-studies/:id
```

---

# Variables

```ts id="0j4a0b"
programStudies

search
isActive

isLoading
isSubmitting

selectedProgramStudy
isDialogOpen
isDeleteDialogOpen

form
errors
```

---

# Program Study Form

## Name

```text
name
```

Type:

```text
text
```

Required:

```text
true
```

---

## Code

```text
code
```

Type:

```text
text
```

Required:

```text
false
```

---

## Status

```text
is_active
```

Type:

```text
switch
```

---

# Form Type

```ts id="1t8yjh"
type ProgramStudyForm = {
  name: string
  code: string
  is_active: boolean
}
```

---

# Table

```text
No
Name
Code
Status
Action
```

---

# Operations

```text
Create
Read
Update
Delete
Search
Filter Active
```

---

# Components

```text
DataTable
ProgramStudyDialog
Input
Switch
DropdownMenu
AlertDialog
Button
```

---

# PAGE-010 — Registration Period Management

## Route

```text id="qqc9ml"
/admin/registration
```

## Access

```text
Authenticated Admin
```

---

# Purpose

Mengatur periode Open Recruitment.

---

# Operations

```text
GET    /admin/registration-periods
GET    /admin/registration-periods/active
POST   /admin/registration-periods
PUT    /admin/registration-periods/:id
DELETE /admin/registration-periods/:id
```

---

# Variables

```ts id="wyx48f"
registrationPeriods
activeRegistrationPeriod

isLoading
isSubmitting

selectedPeriod

isDialogOpen
isDeleteDialogOpen

form
errors
```

---

# Registration Form

## Name

```text
name
```

Type:

```text
text
```

Required:

```text
true
```

---

## Start Date

```text
start_date
```

Type:

```text
date
```

Required:

```text
true
```

---

## Start Time

```text
start_time
```

Type:

```text
time
```

Required:

```text
true
```

---

## End Date

```text
end_date
```

Type:

```text
date
```

Required:

```text
true
```

---

## End Time

```text
end_time
```

Type:

```text
time
```

Required:

```text
true
```

---

# Frontend Form Type

```ts id="7bqz73"
type RegistrationPeriodForm = {
  name: string
  start_date: string
  start_time: string
  end_date: string
  end_time: string
}
```

---

# API Payload

Frontend menggabungkan date + time menjadi:

```ts id="q2ebv8"
{
  name: string
  start_at: string
  end_at: string
}
```

Contoh:

```text id="bfbx1y"
2026-09-15
+
08:00

↓

2026-09-15T08:00:00+07:00
```

Backend menerima timestamp.

---

# Registration Status

Frontend menampilkan:

```text
UPCOMING
OPEN
CLOSED
```

Status dihitung backend.

---

# UI

```text
Page Header
├── Title
└── Add Registration Period

Current Registration Card

Registration Period Table
├── Name
├── Start
├── End
├── Status
└── Action
```

---

# Components

```text
RegistrationPeriodDialog
DatePicker
TimePicker
DataTable
StatusBadge
AlertDialog
Button
```

---

# 7. ADMIN LAYOUT

Semua halaman admin kecuali login menggunakan:

```text id="7e6ibf"
AdminLayout
```

---

# Sidebar

```text
HIMATRIS

Dashboard

Recruitment
├── Pendaftar
└── Periode Pendaftaran

Master Data
├── Divisi
└── Program Studi

Account
└── Logout
```

---

# Header

Menampilkan:

```text
Admin Name
Admin Email
Notification / Status
Profile Menu
```

---

# 8. GLOBAL COMPONENTS

Komponen reusable:

```text id="z8x6a4"
Button
Input
Textarea
Select
Checkbox
Switch
Dialog
AlertDialog
DropdownMenu
Table
Badge
Card
Toast
Tooltip
Popover
Calendar
Pagination
Skeleton
Alert
```

---

# 9. GLOBAL STATE

State global yang dibutuhkan:

```ts id="w7k5sp"
auth
```

Contoh:

```ts id="3rdj72"
type AuthState = {
  isAuthenticated: boolean
  accessToken: string | null

  admin: {
    id: string
    username: string
    email: string
  } | null
}
```

---

# 10. API Client Variables

Frontend memiliki API client terpusat.

Contoh:

```ts id="1xw4kz"
const API_URL = process.env.NEXT_PUBLIC_API_URL
```

---

# 11. Common API States

Setiap halaman yang melakukan request harus menangani:

```text
idle
loading
success
error
```

Contoh:

```ts id="u0xj4y"
type RequestState =
  | "idle"
  | "loading"
  | "success"
  | "error"
```

---

# 12. Form State Convention

Form menggunakan pola:

```text
values
errors
isSubmitting
submitError
```

Contoh:

```ts id="j5e5p3"
{
  values,
  errors,
  isSubmitting,
  submitError
}
```

---

# 13. Pagination Convention

Semua table besar menggunakan:

```text
page
limit
total
total_pages
```

Frontend default:

```text
page = 1
limit = 20
```

Maximum:

```text
limit = 100
```

---

# 14. Search Convention

Search input:

```text
search
```

Search sebaiknya menggunakan debounce.

Recommended:

```text
300–500ms
```

Flow:

```text
User Typing
     ↓
Debounce
     ↓
API Request
     ↓
Update Table
```

---

# 15. Toast Convention

Success:

```text
✓ Data berhasil disimpan.
```

Error:

```text
✕ Gagal menyimpan data.
```

Delete:

```text
✓ Data berhasil dihapus.
```

Status:

```text
✓ Status berhasil diperbarui.
```

---

# 16. Loading Convention

Table:

```text
Skeleton Rows
```

Form submit:

```text
Menyimpan...
```

CV:

```text
Memuat CV...
```

Dashboard:

```text
Skeleton Cards
```

---

# 17. Error Boundary

Frontend harus memiliki error boundary untuk:

* Unexpected rendering error.
* API failure yang tidak tertangani.
* Runtime error.

Fallback:

```text
Terjadi kesalahan.

Silakan coba lagi.
```

Button:

```text
Coba Lagi
```

---

# 18. Responsive Requirements

## Mobile

Admin table dapat menggunakan:

```text
Horizontal Scroll
```

atau:

```text
Responsive Card Layout
```

Registration form:

```text
1 column
```

---

## Tablet

```text
2 column form
```

---

## Desktop

```text
2–3 column layout
```

Admin:

```text
Sidebar + Main Content
```

---

# 19. Route Protection

Public:

```text
/
/register
/result
/admin/login
```

Authenticated:

```text
/admin
/admin/applicants
/admin/applicants/[id]
/admin/divisions
/admin/program-studies
/admin/registration
```

Jika user tidak authenticated:

```text
/admin/*
     ↓
/admin/login
```

Jika authenticated membuka:

```text
/admin/login
```

redirect:

```text
/admin
```

---

# 20. Frontend Data Flow

## Public Registration

```text id="m6r3ah"
Landing
   │
   ├── GET Registration
   ├── GET Divisions
   └── GET Program Studies
            │
            ▼
       Registration
            │
            ▼
       POST Application
            │
            ▼
         Success
```

---

## Admin Applicant

```text id="5v7z4f"
Dashboard
    │
    ▼
Applicants
    │
    ├── Search
    ├── Filter
    └── Pagination
            │
            ▼
      Applicant Detail
            │
       ┌────┴────┐
       ▼         ▼
      CV       Status
                 │
                 ▼
              Update
```

---

# 21. Page-to-API Mapping

| Page                     | API                                                          |
| ------------------------ | ------------------------------------------------------------ |
| `/`                      | GET registration, GET divisions                              |
| `/register`              | GET registration, GET divisions, GET prodi, POST application |
| `/result`                | GET result                                                   |
| `/admin/login`           | POST login                                                   |
| `/admin`                 | GET dashboard                                                |
| `/admin/applicants`      | GET applicants                                               |
| `/admin/applicants/[id]` | GET applicant, PATCH status, GET CV                          |
| `/admin/divisions`       | CRUD divisions                                               |
| `/admin/program-studies` | CRUD program studies                                         |
| `/admin/registration`    | CRUD registration periods                                    |

---

# 22. Page Development Priority

## P0

```text
/admin/login
/admin
/register
/result
/admin/applicants
/admin/applicants/[id]
```

## P1

```text
/admin/divisions
/admin/program-studies
/admin/registration
```

## P2

Future pages:

```text
/admin/interviews
/admin/scoring
/admin/analytics
/admin/settings
```

---

# 23. Frontend Folder Recommendation

Struktur Next.js:

```text id="1w1n7c"
src/
│
├── app/
│   │
│   ├── page.tsx
│   │
│   ├── register/
│   │   └── page.tsx
│   │
│   ├── result/
│   │   └── page.tsx
│   │
│   └── admin/
│       ├── login/
│       │   └── page.tsx
│       │
│       ├── page.tsx
│       │
│       ├── applicants/
│       │   ├── page.tsx
│       │   └── [id]/
│       │       └── page.tsx
│       │
│       ├── divisions/
│       │   └── page.tsx
│       │
│       ├── program-studies/
│       │   └── page.tsx
│       │
│       └── registration/
│           └── page.tsx
│
├── components/
│   ├── ui/
│   ├── public/
│   ├── admin/
│   ├── forms/
│   └── tables/
│
├── features/
│   ├── auth/
│   ├── applicants/
│   ├── divisions/
│   ├── program-studies/
│   └── registration/
│
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   └── utils.ts
│
├── hooks/
│
├── types/
│
└── stores/
```

---

# 24. Final Page List

Frontend MVP harus memiliki **10 halaman utama**:

```text
01. Landing Page
    /

02. Registration Page
    /register

03. Result Checking
    /result

04. Admin Login
    /admin/login

05. Admin Dashboard
    /admin

06. Applicant Management
    /admin/applicants

07. Applicant Detail
    /admin/applicants/[id]

08. Division Management
    /admin/divisions

09. Program Study Management
    /admin/program-studies

10. Registration Period Management
    /admin/registration
```

---

# 25. Final Frontend Flow

```text
                         PUBLIC
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
           Landing      Register      Result
              │            │            │
              │            ▼            │
              │       Submit Form       │
              │            │            │
              │            ▼            │
              │       PostgreSQL        │
              │                         │
              └─────────────────────────┘


                         ADMIN
                           │
                           ▼
                         Login
                           │
                           ▼
                       Dashboard
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
    Applicants          Divisions          Prodi
        │
        ▼
    Applicant Detail
        │
    ┌───┴────┐
    ▼        ▼
   CV     Selection
              │
              ▼
        PENDING / ACCEPTED / REJECTED
```

---

# 26. Frontend Definition of Done

Frontend MVP dianggap selesai apabila:

* [ ] Semua 10 halaman tersedia.
* [ ] Public landing page responsive.
* [ ] Registration form berfungsi.
* [ ] Form memiliki validasi.
* [ ] CV dapat dipilih dan diupload.
* [ ] Division 2 bersifat conditional.
* [ ] Registration period ditampilkan.
* [ ] Result checking berfungsi.
* [ ] Admin login berfungsi.
* [ ] Protected admin routes berfungsi.
* [ ] Dashboard menampilkan statistik.
* [ ] Applicant table berfungsi.
* [ ] Search berfungsi.
* [ ] Filter berfungsi.
* [ ] Pagination berfungsi.
* [ ] Applicant detail berfungsi.
* [ ] CV dapat dibuka.
* [ ] Selection status dapat diubah.
* [ ] Division CRUD berfungsi.
* [ ] Program Study CRUD berfungsi.
* [ ] Registration Period CRUD berfungsi.
* [ ] Loading state tersedia.
* [ ] Error state tersedia.
* [ ] Empty state tersedia.
* [ ] Toast feedback tersedia.
* [ ] Mobile responsive.
* [ ] Desktop responsive.
* [ ] Tidak ada public access ke halaman admin.
* [ ] API client terpusat.
* [ ] TypeScript type digunakan untuk request/response.
