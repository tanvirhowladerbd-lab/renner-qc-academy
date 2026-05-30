-- Drop existing daily_tips table if exists to update its schema and columns
DROP TABLE IF EXISTS daily_tips CASCADE;

CREATE TABLE daily_tips (
  id BIGSERIAL PRIMARY KEY,
  tip_number INTEGER UNIQUE NOT NULL,
  inspection_step TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  tip_title TEXT NOT NULL,
  tip_english TEXT NOT NULL,
  tip_bangla TEXT NOT NULL,
  source TEXT,
  priority INTEGER NOT NULL, -- 1=Critical, 2=Major, 3=Standard
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table for tracking inspectors
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  employee_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- Create quiz_results table for logging quiz history
CREATE TABLE IF NOT EXISTS quiz_results (
  id BIGSERIAL PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  question_id INTEGER,
  is_correct BOOLEAN,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  topic TEXT,
  difficulty TEXT
);

-- Pre-load inspector accounts
INSERT INTO users (employee_id, name) VALUES
  ('10197','MD. Tuhin Sheikh'),
  ('10199','Md. Rabiul Islam'),
  ('10195','Md. Zahangir Alam'),
  ('10198','Md. Abul Kalam Azad'),
  ('10196','Md. Ruhul Amin'),
  ('10200','Md. Borkat Ullah'),
  ('10194','Md. Jahidul Karim'),
  ('10201','Ashik Ahmad')
ON CONFLICT (employee_id) DO NOTHING;
