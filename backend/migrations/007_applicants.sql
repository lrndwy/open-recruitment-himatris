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
