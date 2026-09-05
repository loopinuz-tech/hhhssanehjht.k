ALTER TABLE profiles
ADD COLUMN target_subject TEXT,
ADD COLUMN cert_type TEXT CHECK (cert_type IN ('milliy', 'xalqaro', 'none')),
ADD COLUMN national_cert_level TEXT CHECK (national_cert_level IN ('C', 'C+', 'B', 'B+', 'A', 'A+')),
ADD COLUMN international_cert_type TEXT CHECK (international_cert_type IN ('SAT', 'IELTS')),
ADD COLUMN sat_score NUMERIC,
ADD COLUMN ielts_score NUMERIC,
ADD COLUMN attestation_category TEXT,
ADD COLUMN target_date DATE;
