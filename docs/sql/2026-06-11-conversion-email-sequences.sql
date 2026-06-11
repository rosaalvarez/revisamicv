-- Conversion micro-interactions: email sequence support.
-- Preview branch migration; run in Supabase before enabling scheduled dispatch in production.

ALTER TABLE public.cv_history ADD COLUMN IF NOT EXISTS vacancy_title TEXT;

CREATE TABLE IF NOT EXISTS public.analysis_email_sequences (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  analysis_id BIGINT,
  vacancy_title TEXT,
  original_score INTEGER,
  adapted_score INTEGER,
  output_language TEXT NOT NULL DEFAULT 'spanish',
  status TEXT NOT NULL DEFAULT 'active',
  day0_sent_at TIMESTAMPTZ,
  day2_due_at TIMESTAMPTZ,
  day2_sent_at TIMESTAMPTZ,
  day6_due_at TIMESTAMPTZ,
  day6_sent_at TIMESTAMPTZ,
  suppressed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analysis_email_sequences_email_status_idx
  ON public.analysis_email_sequences (email, status);

CREATE INDEX IF NOT EXISTS analysis_email_sequences_due_idx
  ON public.analysis_email_sequences (status, day2_due_at, day6_due_at);

COMMENT ON TABLE public.analysis_email_sequences IS 'One active post-analysis email sequence per user; followups suppress when a newer analysis exists.';
COMMENT ON COLUMN public.analysis_email_sequences.status IS 'active, completed, suppressed, unsubscribed';
