-- Add birth date and portfolio link to applicants; drop division reasons
ALTER TABLE applicants ADD COLUMN birth_date DATE;

ALTER TABLE applicants ADD COLUMN portfolio_url TEXT;

ALTER TABLE applicants DROP COLUMN IF EXISTS division_1_reason;
ALTER TABLE applicants DROP COLUMN IF EXISTS division_2_reason;

ALTER TABLE applicants DROP CONSTRAINT IF EXISTS applicants_division_2_reason_required;
