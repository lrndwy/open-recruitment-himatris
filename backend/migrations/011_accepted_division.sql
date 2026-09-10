-- Add accepted division: admin can choose which division an applicant is accepted into
ALTER TABLE applicants ADD COLUMN accepted_division_id UUID REFERENCES divisions(id);
