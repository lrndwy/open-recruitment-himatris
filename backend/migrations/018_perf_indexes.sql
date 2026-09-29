-- Index tambahan untuk trafik ramai (semua idempotent, aman dijalankan ulang).
--
-- 1. applicants.accepted_division_id: kolom foreign key tanpa index, dipakai
--    saat memuat/menyaring pendaftar yang diterima di divisi tertentu.
-- 2. applicants.nim: pencarian daftar memakai ILIKE '%nim%' yang tidak bisa
--    memakai btree, dan unique constraint yang ada berawalan registration_period_id
--    sehingga pencarian NIM saja tidak terlayani.
CREATE INDEX IF NOT EXISTS applicants_accepted_division_idx
ON applicants (accepted_division_id);

CREATE INDEX IF NOT EXISTS applicants_nim_trgm_idx
ON applicants
USING GIN (nim gin_trgm_ops);

-- 3. Kombinasi filter + urutan yang paling sering dipakai halaman pendaftar:
--    saring status lalu urutkan terbaru, dan saring periode lalu urutkan terbaru.
CREATE INDEX IF NOT EXISTS applicants_status_created_idx
ON applicants (selection_status, created_at DESC);

CREATE INDEX IF NOT EXISTS applicants_period_created_idx
ON applicants (registration_period_id, created_at DESC);

-- 4. Pencarian hasil seleksi publik (WHERE nim = ...) sudah dilayani
--    applicants_nim_idx dari migrasi 009; trgm di atas melengkapi versi ILIKE.
