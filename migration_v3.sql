-- Alter users table to add mobile_number and is_approved
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;

-- Ensure pre-loaded inspectors are approved by default
UPDATE users SET is_approved = TRUE WHERE employee_id IN ('10197','10199','10195','10198','10196','10200','10194','10201');
