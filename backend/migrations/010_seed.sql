-- Seed data untuk development. Password admin: admin123 (bcrypt hash).
INSERT INTO admins (username, email, password_hash)
VALUES ('admin', 'admin@himatris.local',
    '$2a$10$m.jM2cyHVZOwYNiUUHgr.e2onU1ufRPynzlSRvLmHHJQAMe9flAjq')
ON CONFLICT (username) DO NOTHING;

INSERT INTO program_studies (name, code) VALUES
    ('Teknik Informatika', 'TI'),
    ('Sistem Informasi', 'SI'),
    ('Rekayasa Perangkat Lunak', 'RPL')
ON CONFLICT DO NOTHING;

INSERT INTO divisions (name, description) VALUES
    ('Kajian Strategis', 'Divisi Kajian Strategis'),
    ('PSDM', 'Pengembangan Sumber Daya Manusia'),
    ('Humas', 'Hubungan Masyarakat'),
    ('Minat dan Bakat', 'Divisi Minat dan Bakat'),
    ('Kewirausahaan', 'Divisi Kewirausahaan')
ON CONFLICT DO NOTHING;

INSERT INTO registration_periods (name, start_at, end_at)
VALUES ('OPREC HIMATRIS 2026', '2026-09-01T00:00:00+07:00', '2026-12-31T23:59:00+07:00');
