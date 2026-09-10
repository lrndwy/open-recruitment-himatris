-- Portfolio becomes an uploaded file instead of a URL
ALTER TYPE file_type ADD VALUE IF NOT EXISTS 'PORTFOLIO';

ALTER TABLE applicants DROP COLUMN IF EXISTS portfolio_url;
