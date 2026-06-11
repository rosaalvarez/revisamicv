# STOP — RevisaMiCV Conversion Micro-interactions

Branch: `preview/conversion-micro-interactions`
Scope: copy + lightweight UI triggers + email sequence.
Production: **not deployed**.
Merge: **not merged**.

## Executive status

Implemented all 6 conversion triggers on the preview branch only. No pricing changes, no new pages, no landing restructure, no countdowns, no fake scarcity, no deadline discounts.

Core principle preserved: **the consumption unit is the vacancy, not the CV**. Copy reinforces that each new vacancy needs its own analysis.

## Evidence screenshots

Screenshot directory: `.hermes_handoff/screenshots/conversion-triggers/`

### Trigger 1 — Post-result CTA
Evidence:
- `.hermes_handoff/screenshots/conversion-triggers/trigger-1-post-result-cta.png`

Verified visible copy:
- `Este análisis es para esta vacante. ¿A cuántas más estás aplicando esta semana?`
- Button: `Analizar otra vacante →`

### Trigger 2 — Post-download friction reducer + saved CV reuse
Evidence pair:
- Post-download state: `.hermes_handoff/screenshots/conversion-triggers/trigger-2-post-download-state.png`
- Returning user saved-CV reuse: `.hermes_handoff/screenshots/conversion-triggers/trigger-2-returning-use-saved-cv.png`

Verified visible copy/state:
- `Tu CV quedó adaptado para Especialista en Marketing Digital. Tu CV base ya está guardado — el próximo análisis toma 2 minutos.`
- Button: `Analizar otra vacante →`
- Returning user sees `Usar mi CV guardado` and still has the upload-new drop zone available.

### Trigger 3 — Credit counter as event
Evidence pair:
- Credits = 1 notice: `.hermes_handoff/screenshots/conversion-triggers/trigger-3-credits-1-notice.png`
- Credits = 0 purchase view / smart default: `.hermes_handoff/screenshots/conversion-triggers/trigger-3-credits-0-purchase-pro-selected.png`

Verified visible copy/state:
- Credits = 1 notice: `Este es tu último análisis disponible.`
- Purchase copy: `Cada análisis es una vacante distinta. Tus créditos no vencen.`
- Smart default rule implemented: lifetime analyses >= 5 highlights `Pro`; otherwise `Básico`.
- Screenshot uses lifetime analyses >= 5, so `Pro` is preselected/highlighted.

### Trigger 4 — Honest market-stat line
Evidence:
- `.hermes_handoff/screenshots/conversion-triggers/trigger-4-step-2-market-stat-line.png`

Verified visible copy under vacancy paste field:
- `Una vacante puede recibir cientos de CVs. El tuyo tiene segundos para decir lo correcto.`

No per-vacancy numbers or invented claims were added.

### Trigger 5 — Real delta in dashboard history
Evidence:
- `.hermes_handoff/screenshots/conversion-triggers/trigger-5-dashboard-real-delta.png`

Verified visible state:
- Dashboard history entry shows vacancy title: `Especialista en Marketing Digital`
- Real delta shown: `54 → 81`

Implementation uses stored Engine v2 fields:
- `original_score`
- `adapted_score`

No old fabricated estimation is used for this label.

### Trigger 6 — Email sequence renders
Evidence set:
- Day 0 render: `.hermes_handoff/screenshots/conversion-triggers/trigger-6-day0-email-render.png`
- Day 0 HTML: `.hermes_handoff/screenshots/conversion-triggers/trigger-6-day0-email.html`
- Day 2 render: `.hermes_handoff/screenshots/conversion-triggers/trigger-6-day2-email-render.png`
- Day 2 HTML: `.hermes_handoff/screenshots/conversion-triggers/trigger-6-day2-email.html`
- Day 6 render: `.hermes_handoff/screenshots/conversion-triggers/trigger-6-day6-email-render.png`
- Day 6 HTML: `.hermes_handoff/screenshots/conversion-triggers/trigger-6-day6-email.html`

Verified visible email states:
- Day 0: result summary + real delta `54 → 81` + dashboard CTA + unsubscribe.
- Day 2: `¿Ya aplicaste con tu CV adaptado?` + reminder that the next vacancy asks for different things + CTA `Analizar mi próxima vacante` + unsubscribe.
- Day 6: `Tu CV pasó de 54 a 81 para esa vacante` + real delta + “Haz lo mismo con la siguiente” framing + CTA + unsubscribe.

Suppression logic implemented:
- Purchases do **not** suppress.
- Day 2 and Day 6 suppress if the user already ran a newer analysis after the analysis that started the sequence.
- Max one active sequence per user.

## Verification run

Commands run successfully:

```bash
npm test
npx tsc --noEmit
NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co' \
SUPABASE_SERVICE_ROLE_KEY='dummy-service-role-key' \
NEXT_PUBLIC_SUPABASE_ANON_KEY='dummy-anon-key' \
NEXT_PUBLIC_APP_URL='http://localhost:3000' \
RESEND_API_KEY='***' \
STRIPE_SECRET_KEY='dummy-...cret' \
STRIPE_WEBHOOK_SECRET='dummy-...cret' \
npm run build
git diff --check
```

Results:
- `npm test`: **98 pass / 0 fail**.
- `npx tsc --noEmit`: **OK**.
- `npm run build` with dummy non-secret env values: **OK**.
- Static pages generated: **37/37**.
- `git diff --check`: **OK**.

Forbidden-list scan:
- Searched for countdown/scarcity/deadline/discount/cupos/timer/left/quedan/vence terms.
- No new countdown timers, fake scarcity, deadline discounts, pack price changes, or landing restructure were added.
- Existing legitimate `vence en 7 días` belongs to magic-link security copy, not credits.
- Existing/new `créditos no vencen` copy is consistent with the spec.

## Files changed

Main implementation:
- `src/app/analizar/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/api/process-cv/route.ts`
- `src/app/api/history/route.ts`
- `src/app/api/email/unsubscribe/route.ts`
- `src/app/api/email-sequence/dispatch/route.ts`
- `src/lib/history-service.ts`
- `src/lib/conversion-triggers.js`
- `src/lib/analysis-email-sequence.js`
- `src/lib/analysis-email-sequence-service.ts`
- `vercel.json`

Database migration:
- `docs/sql/2026-06-11-conversion-email-sequences.sql`

Tests and evidence:
- `tests/conversion-triggers.test.mjs`
- `.hermes_handoff/scripts/capture-conversion-triggers.mjs`
- `.hermes_handoff/screenshots/conversion-triggers/*`

## Question A — SQL migration requirement before deploy

Yes: `docs/sql/2026-06-11-conversion-email-sequences.sql` **must run in Supabase before this branch ever deploys to production**.

Why:
- The branch writes/reads `cv_history.vacancy_title`.
- The email sequence needs the new `public.analysis_email_sequences` table.
- Without the migration, production can fail when saving history or starting/sending email sequences.

Exact Supabase steps, same protocol as Engine v2 migration:

1. Open Supabase dashboard for the RevisaMiCV project.
2. Go to **SQL Editor**.
3. Click **New query**.
4. Open this repo file:
   - `docs/sql/2026-06-11-conversion-email-sequences.sql`
5. Copy the full SQL content.
6. Paste it into Supabase SQL Editor.
7. Click **Run**.
8. Confirm the query finishes without errors.
9. Verify with this read-only check in SQL Editor:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'cv_history'
  AND column_name = 'vacancy_title';

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'analysis_email_sequences';
```

Expected:
- First query returns `vacancy_title`.
- Second query returns `analysis_email_sequences`.

Only after that should this branch be approved for production deployment.

## Question B — How Day 2 / Day 6 emails get triggered

Implemented endpoint:
- `GET /api/email-sequence/dispatch`
- `POST /api/email-sequence/dispatch`

What it does:
- Looks for active sequences due for Day 2 or Day 6.
- Sends due emails through Resend.
- Suppresses followups if the user ran another analysis after the original one.
- Marks sequences completed/suppressed/unsubscribed as appropriate.

Important: **without a scheduled job calling this endpoint, Day 2 and Day 6 emails will never send**.

Configured in this branch:
- Added `vercel.json` with Vercel Cron:

```json
{
  "crons": [
    {
      "path": "/api/email-sequence/dispatch",
      "schedule": "0 14 * * *"
    }
  ]
}
```

Meaning:
- Vercel calls `/api/email-sequence/dispatch` once daily at 14:00 UTC.
- The endpoint sends anything due at that moment.
- This is enough for Day 2 / Day 6 followups; they may send on the next daily cron run after they become due.

Security note:
- The route accepts Vercel Cron via `x-vercel-cron: 1`.
- It also supports manual/external triggering with `Authorization: Bearer [CRON_SECRET]` if `CRON_SECRET` is configured.

Before production deploy, confirm in Vercel:
1. Project is on a plan/config that supports Vercel Cron.
2. `vercel.json` is included in the deployed branch.
3. Env vars exist in Production:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `NEXT_PUBLIC_APP_URL`
   - Optional but recommended for manual calls: `CRON_SECRET`
4. After deploy, verify Vercel shows the cron job for `/api/email-sequence/dispatch`.
5. Do not rely on Day 2/Day 6 sending until that cron is visible/active in Vercel.

## STOP

Ready for Rosita review on preview branch.

Do **not** merge.
Do **not** production deploy.
Run the Supabase migration first before any future production deploy approval.
