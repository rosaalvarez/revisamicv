-- RevisaMiCV privacy hardening: block direct browser/anon access to sensitive tables.
-- Run this in Supabase SQL Editor after confirming the app backend uses SUPABASE_SERVICE_ROLE_KEY.
-- Expected result: Next.js API routes keep working; direct anon-key reads/writes fail.

BEGIN;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on users" ON public.users;
DROP POLICY IF EXISTS "Allow all on cv_history" ON public.cv_history;
DROP POLICY IF EXISTS "MVP users access" ON public.users;
DROP POLICY IF EXISTS "MVP cv_history access" ON public.cv_history;

REVOKE ALL ON public.users FROM anon, authenticated;
REVOKE ALL ON public.cv_history FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cv_history TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

COMMIT;

-- Verification after running:
-- 1) Direct anon-key selects on public.users/public.cv_history should fail with permission/RLS error.
-- 2) Server-side API routes using SUPABASE_SERVICE_ROLE_KEY should continue to work.
