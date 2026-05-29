-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new

CREATE TABLE IF NOT EXISTS users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  tokens INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cv_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  original_text TEXT,
  job_description TEXT,
  optimized_cv TEXT,
  tokens_used INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_cv_history_user ON cv_history(user_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_history ENABLE ROW LEVEL SECURITY;

-- Allow public access for MVP (you can tighten later)
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all on cv_history" ON cv_history FOR ALL USING (true);
