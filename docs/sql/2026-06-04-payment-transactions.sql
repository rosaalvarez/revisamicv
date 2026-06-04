-- RevisaMiCV payment ledger: one Stripe Checkout Session can credit tokens only once.
-- Run after the public Supabase access hardening migration.

BEGIN;

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

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_transactions_session
  ON public.payment_transactions(stripe_session_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user
  ON public.payment_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_email
  ON public.payment_transactions(email);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_transactions service role access" ON public.payment_transactions;

REVOKE ALL ON public.payment_transactions FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_transactions TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

CREATE POLICY "payment_transactions service role access"
ON public.payment_transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMIT;

-- Verification after running:
-- 1) Direct anon-key select on public.payment_transactions should fail.
-- 2) Stripe webhook and /api/stripe/recover should credit a Checkout Session only once.
