CREATE INDEX applicants_nim_idx
ON applicants (nim);

CREATE INDEX applicants_period_idx
ON applicants (registration_period_id);

CREATE INDEX applicants_program_study_idx
ON applicants (program_study_id);

CREATE INDEX applicants_division_1_idx
ON applicants (division_1_id);

CREATE INDEX applicants_division_2_idx
ON applicants (division_2_id);

CREATE INDEX applicants_selection_status_idx
ON applicants (selection_status);

CREATE INDEX applicants_created_at_idx
ON applicants (created_at DESC);

CREATE INDEX applicants_name_trgm_idx
ON applicants
USING GIN (name gin_trgm_ops);

CREATE INDEX registration_periods_start_at_idx
ON registration_periods (start_at);

CREATE INDEX registration_periods_end_at_idx
ON registration_periods (end_at);

CREATE INDEX program_studies_active_idx
ON program_studies (is_active)
WHERE deleted_at IS NULL;

CREATE INDEX divisions_active_idx
ON divisions (is_active)
WHERE deleted_at IS NULL;
