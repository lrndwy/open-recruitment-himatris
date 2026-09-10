-- Remove unique constraint on files table to allow multiple files per applicant
ALTER TABLE files DROP CONSTRAINT IF EXISTS files_applicant_unique;

-- Add file_type column to distinguish CV vs Poster
DO $$ BEGIN
    CREATE TYPE file_type AS ENUM ('CV', 'POSTER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE files ADD COLUMN IF NOT EXISTS file_type file_type NOT NULL DEFAULT 'CV';

-- Add unique constraint per file type
ALTER TABLE files ADD CONSTRAINT files_applicant_type_unique UNIQUE (applicant_id, file_type);

-- Add poster_id to applicants table
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS poster_id UUID;

ALTER TABLE applicants ADD CONSTRAINT applicants_poster_fk
    FOREIGN KEY (poster_id)
    REFERENCES files(id)
    ON DELETE SET NULL;
