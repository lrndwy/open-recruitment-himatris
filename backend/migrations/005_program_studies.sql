CREATE TABLE program_studies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL,
    code VARCHAR(30),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    deleted_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX program_studies_name_unique
ON program_studies (LOWER(name))
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX program_studies_code_unique
ON program_studies (LOWER(code))
WHERE code IS NOT NULL
AND deleted_at IS NULL;
