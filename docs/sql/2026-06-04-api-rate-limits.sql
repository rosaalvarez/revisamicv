-- RevisaMiCV API rate limits for email/AI/checkout abuse control.
-- The app calls public.check_rate_limit from trusted Next.js API routes using service_role.

BEGIN;

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  scope TEXT NOT NULL,
  identifier TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1 CHECK (request_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(scope, identifier, window_start)
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_updated_at
  ON public.api_rate_limits(updated_at);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.api_rate_limits FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_rate_limits TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

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

COMMIT;

-- Optional cleanup, run periodically if table grows:
-- DELETE FROM public.api_rate_limits WHERE updated_at < now() - interval '7 days';
