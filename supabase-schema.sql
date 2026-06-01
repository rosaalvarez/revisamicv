-- Supabase Schema for RevisaMiCV.lat
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  tokens INTEGER NOT NULL DEFAULT 0 CHECK (tokens >= 0),
  free_used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cv_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
  original_text TEXT,
  job_description TEXT,
  optimized_cv JSONB,
  compatibility_score INTEGER,
  output_language TEXT CHECK (output_language IN ('english', 'spanish')),
  tokens_used INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safe migrations for older schemas
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tokens INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS free_used BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_tokens_nonnegative'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_tokens_nonnegative CHECK (tokens >= 0) NOT VALID;
  END IF;
END;
$$;
ALTER TABLE public.users VALIDATE CONSTRAINT users_tokens_nonnegative;

ALTER TABLE public.cv_history ADD COLUMN IF NOT EXISTS optimized_cv JSONB;
ALTER TABLE public.cv_history ADD COLUMN IF NOT EXISTS compatibility_score INTEGER;
ALTER TABLE public.cv_history ADD COLUMN IF NOT EXISTS output_language TEXT;

-- ═══════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON public.users (lower(email));
CREATE INDEX IF NOT EXISTS idx_cv_history_user ON public.cv_history(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_history_created_at ON public.cv_history(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- UPDATED_AT TRIGGER
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════════
-- PERMISSIONS / RLS
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_history ENABLE ROW LEVEL SECURITY;

-- Critical for Next.js backend using SUPABASE_SERVICE_ROLE_KEY.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.cv_history TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- MVP policies. The app backend uses service_role. Public policies are intentionally
-- permissive for launch speed, but all browser operations still go through our APIs.
DROP POLICY IF EXISTS "Allow all on users" ON public.users;
DROP POLICY IF EXISTS "Allow all on cv_history" ON public.cv_history;
DROP POLICY IF EXISTS "MVP users access" ON public.users;
DROP POLICY IF EXISTS "MVP cv_history access" ON public.cv_history;

CREATE POLICY "MVP users access"
ON public.users
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "MVP cv_history access"
ON public.cv_history
FOR ALL
USING (true)
WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SMOKE TESTS TO RUN AFTER MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════════

-- SELECT email, tokens, free_used FROM public.users LIMIT 5;
-- INSERT INTO public.users (email, tokens, free_used)
-- VALUES ('migration-test@example.com', 0, false)
-- ON CONFLICT (email) DO UPDATE SET tokens = public.users.tokens
-- RETURNING email, tokens, free_used;
