# RevisaMiCV Security Hardening Before Marketing

> **For Hermes:** Implement from most critical to least critical. Do not start marketing until Block 1 is verified in production.

**Goal:** Close the real launch blockers found in the audit without turning the project into endless cleanup.

**Architecture:** RevisaMiCV currently uses Next.js API routes as the trusted backend and Supabase `service_role` server-side. Browser users do not use Supabase Auth directly, so sensitive tables must deny `anon`/`authenticated` direct access and only allow backend/service_role access. Payment fulfillment must use a transaction ledger keyed by Stripe Checkout Session ID.

**Tech Stack:** Next.js 16 App Router, Supabase/Postgres, Stripe Checkout/Webhooks, Resend, OpenAI/Anthropic, Node test runner.

---

## Block 0 — Damage-control explanation and scope

**Decision:** We only fix items that can expose user data, break paid credits, cause abuse/costs, or block user trust.

**Not in scope before marketing:** blog polish, filters, testimonials, advanced queues, disposable email blocking, broad refactors.

---

## Block 1 — Critical privacy: close Supabase direct public access

**Objective:** Browser/public anon key cannot read or write `users` or `cv_history` directly. Next.js API routes continue to work with `SUPABASE_SERVICE_ROLE_KEY`.

**Files:**
- Modify: `supabase-schema.sql`
- Create: `docs/sql/2026-06-04-lock-public-supabase-access.sql`

**Steps:**
1. Backup/check current tables in Supabase dashboard.
2. Run SQL to drop permissive MVP policies.
3. Revoke table/sequence permissions from `anon` and `authenticated`.
4. Keep service_role grants.
5. Verify anon key direct selects fail.
6. Verify production app routes still work.

**SQL shape:**
```sql
DROP POLICY IF EXISTS "MVP users access" ON public.users;
DROP POLICY IF EXISTS "MVP cv_history access" ON public.cv_history;
DROP POLICY IF EXISTS "Allow all on users" ON public.users;
DROP POLICY IF EXISTS "Allow all on cv_history" ON public.cv_history;

REVOKE ALL ON public.users FROM anon, authenticated;
REVOKE ALL ON public.cv_history FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cv_history TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
```

**Verification:**
- With anon key: `users` and `cv_history` direct select should fail.
- In app: `/api/user`, dashboard/history, process-cv, checkout recovery should still work.

---

## Block 2 — Critical secrets: rotate exposed keys

**Objective:** Any key pasted in an audit/chat becomes invalid.

**User dashboard actions required:**
1. Stripe: roll secret key and webhook secret.
2. OpenAI: revoke/create API key.
3. Anthropic: revoke/create API key.
4. Supabase: rotate service_role key after Block 1 is ready.
5. Update Vercel environment variables.
6. Update local `.env.local` only on Rosita's machine.

**Important:** `.env.local` is ignored by Git and not currently tracked, but the audit pasted full keys, so rotation is still required.

**Verification:**
- `npm test`
- `npm run build`
- production smoke after Vercel redeploy
- Stripe checkout/recovery test

---

## Block 3 — High: payment transaction ledger for idempotency

**Objective:** Each Stripe Checkout Session credits tokens at most once, even with webhook retries or recovery.

**Files:**
- Create SQL: `docs/sql/2026-06-04-payment-transactions.sql`
- Modify: `src/lib/stripe-token-credit.ts`
- Add tests: `tests/stripe-token-credit.test.mjs` or extend existing payment tests.

**Implementation:**
- Create `payment_transactions` table with `stripe_session_id TEXT UNIQUE`.
- In `creditTokensForPaidCheckoutSession`, insert transaction before crediting.
- If unique violation, return `alreadyCredited: true`.
- Add tests for duplicate session and multiple different sessions for same email.

**Verification:**
- Duplicate same session does not double-credit.
- Two different sessions for same user both credit correctly.

---

## Block 4 — High: rate limit expensive/abusable endpoints

**Objective:** Prevent email bombing and uncontrolled AI/API cost.

**Endpoints:**
- `/api/auth/magic-link`: 3/email/hour and 10/IP/hour.
- `/api/process-cv`: reasonable per email/IP limit.
- `/api/revise-cv`: reasonable per email/IP limit.
- `/api/stripe/checkout`: reasonable per IP/email limit.

**Preferred MVP approach:** Use Supabase table-backed rate limits if no Redis/Upstash exists, because it avoids adding a paid dependency immediately.

**Verification:**
- 4th magic-link request for same email returns 429.
- Friendly user message.
- No email sent after limit.

---

## Block 5 — Medium: Stripe recover hardening

**Objective:** Avoid weak `session_id` validation and ancient recovery sessions.

**Files:**
- Modify: `src/app/api/stripe/recover/route.ts`

**Changes:**
- Regex: `/^cs_(test|live)_[a-zA-Z0-9]{20,}$/`
- Reject sessions older than 30 days with 410 and support copy.

---

## Block 6 — Medium: AI quality debt that can wait until security is stable

**Items:**
- Rename/clarify `honestyRisk` semantics.
- Avoid silent truncation or show clear copy when CV/vacancy is very long.
- Add API integration tests.
- Run mobile/user smoke.

---

## Launch gate

Marketing can restart only after:
- Supabase anon direct access is blocked.
- Exposed keys are rotated.
- App works in production after redeploy.
- Payment crediting has ledger or, at minimum, the owner accepts the risk for tiny private testing.
- Magic link has rate limit before public traffic.
