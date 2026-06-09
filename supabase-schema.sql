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
  requirements_table JSONB,
  original_match_results JSONB,
  adapted_match_results JSONB,
  original_score INTEGER,
  adapted_score INTEGER,
  score_breakdown JSONB,
  llm_model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stripe_session_id TEXT UNIQUE NOT NULL,
  user_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  pack TEXT NOT NULL,
  tokens_added INTEGER NOT NULL CHECK (tokens_added > 0),
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  scope TEXT NOT NULL,
  identifier TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1 CHECK (request_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(scope, identifier, window_start)
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
ALTER TABLE public.cv_history ADD COLUMN IF NOT EXISTS requirements_table JSONB;
ALTER TABLE public.cv_history ADD COLUMN IF NOT EXISTS original_match_results JSONB;
ALTER TABLE public.cv_history ADD COLUMN IF NOT EXISTS adapted_match_results JSONB;
ALTER TABLE public.cv_history ADD COLUMN IF NOT EXISTS original_score INTEGER;
ALTER TABLE public.cv_history ADD COLUMN IF NOT EXISTS adapted_score INTEGER;
ALTER TABLE public.cv_history ADD COLUMN IF NOT EXISTS score_breakdown JSONB;
ALTER TABLE public.cv_history ADD COLUMN IF NOT EXISTS llm_model TEXT;

-- ═══════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON public.users (lower(email));
CREATE INDEX IF NOT EXISTS idx_cv_history_user ON public.cv_history(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_history_created_at ON public.cv_history(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_transactions_session ON public.payment_transactions(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_email ON public.payment_transactions(email);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_updated_at ON public.api_rate_limits(updated_at);

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
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Critical for Next.js backend using SUPABASE_SERVICE_ROLE_KEY.
-- Browser clients must not access sensitive tables directly with the anon key.
-- All user/history operations go through Next.js API routes that use service_role.
DROP POLICY IF EXISTS "Allow all on users" ON public.users;
DROP POLICY IF EXISTS "Allow all on cv_history" ON public.cv_history;
DROP POLICY IF EXISTS "MVP users access" ON public.users;
DROP POLICY IF EXISTS "MVP cv_history access" ON public.cv_history;
DROP POLICY IF EXISTS "payment_transactions service role access" ON public.payment_transactions;

REVOKE ALL ON public.users FROM anon, authenticated;
REVOKE ALL ON public.cv_history FROM anon, authenticated;
REVOKE ALL ON public.payment_transactions FROM anon, authenticated;
REVOKE ALL ON public.api_rate_limits FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cv_history TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_transactions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_rate_limits TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

CREATE POLICY "payment_transactions service role access"
ON public.payment_transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_scope TEXT,
  p_identifier TEXT,
  p_max_requests INTEGER,
  p_window_seconds INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count INTEGER;
  v_reset_seconds INTEGER;
BEGIN
  IF p_max_requests <= 0 OR p_window_seconds <= 0 THEN
    RAISE EXCEPTION 'Invalid rate limit configuration';
  END IF;

  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO public.api_rate_limits(scope, identifier, window_start, request_count, updated_at)
  VALUES (p_scope, lower(trim(p_identifier)), v_window_start, 1, now())
  ON CONFLICT (scope, identifier, window_start)
  DO UPDATE SET
    request_count = public.api_rate_limits.request_count + 1,
    updated_at = now()
  RETURNING request_count INTO v_count;

  v_reset_seconds := greatest(
    0,
    ceil(extract(epoch from (v_window_start + make_interval(secs => p_window_seconds) - now())))::INTEGER
  );

  RETURN jsonb_build_object(
    'allowed', v_count <= p_max_requests,
    'remaining', greatest(0, p_max_requests - v_count),
    'reset_seconds', v_reset_seconds,
    'count', v_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO service_role;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SMOKE TESTS TO RUN AFTER MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════════

-- SELECT email, tokens, free_used FROM public.users LIMIT 5;
-- INSERT INTO public.users (email, tokens, free_used)
-- VALUES ('migration-test@example.com', 0, false)
-- ON CONFLICT (email) DO UPDATE SET tokens = public.users.tokens
-- RETURNING email, tokens, free_used;
