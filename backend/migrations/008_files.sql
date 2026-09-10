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
