-- Matching Engine v2 persistence fields for RevisaMiCV Phase 1
-- Run in Supabase SQL editor before relying on Stage A/B/C debugging data.

ALTER TABLE public.cv_history ADD COLUMN IF NOT EXISTS requirements_table JSONB;
ALTER TABLE public.cv_history ADD COLUMN IF NOT EXISTS original_match_results JSONB;
ALTER TABLE public.cv_history ADD COLUMN IF NOT EXISTS adapted_match_results JSONB;
ALTER TABLE public.cv_history ADD COLUMN IF NOT EXISTS original_score INTEGER;
ALTER TABLE public.cv_history ADD COLUMN IF NOT EXISTS adapted_score INTEGER;
ALTER TABLE public.cv_history ADD COLUMN IF NOT EXISTS score_breakdown JSONB;
ALTER TABLE public.cv_history ADD COLUMN IF NOT EXISTS llm_model TEXT;

COMMENT ON COLUMN public.cv_history.requirements_table IS 'Frozen Stage A vacancy requirements table for Matching Engine v2.';
COMMENT ON COLUMN public.cv_history.original_match_results IS 'Stage B evidence matches against the original CV.';
COMMENT ON COLUMN public.cv_history.adapted_match_results IS 'Stage B evidence matches against the adapted CV after status floor.';
COMMENT ON COLUMN public.cv_history.original_score IS 'Deterministic Stage C score for the original CV.';
COMMENT ON COLUMN public.cv_history.adapted_score IS 'Deterministic Stage C score for the adapted CV.';
COMMENT ON COLUMN public.cv_history.score_breakdown IS 'Deterministic Stage C category sub-scores.';
COMMENT ON COLUMN public.cv_history.llm_model IS 'LLM model trace used by Stage A/B/generation calls.';
