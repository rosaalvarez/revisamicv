# STOP — Conversion micro-interactions review fixes

Branch: `preview/conversion-micro-interactions`
PR: https://github.com/rosaalvarez/revisamicv/pull/4
Production: **not deployed**
Merge: **not merged**

## Fixes completed

1. `RECOMENDADO PARA TI` badge fixed:
   - one line
   - centered
   - pill style matching `MÁS ELEGIDO`
   - no edge overlap/clipping

2. Day-0 email copy fixed:
   - removed `Delta real: 54 → 81`
   - now says: `Tu CV pasó de 54 a 81 para esta vacante.`
   - no internal jargon.

3. Dashboard history date fixed:
   - now uses Spanish `dd/mm/yyyy` format, e.g. `11/06/2026`.

4. Dashboard nav credit context fixed:
   - lone `0` replaced with `Créditos: 0`.

5. Trigger 1/2 CTA moved below adapted-CV preview:
   - user gets the adapted CV preview first
   - next-vacancy CTA appears after delivery.

6. Day-6 email render re-sent and committed as evidence:
   - includes visible subject/body + CTA.
   - I also removed `delta real` wording from Day-6 body during polish.

7. General polish pass:
   - cobalt/primary buttons use white text
   - badge/content boxes have enough width/padding
   - fixed states visually re-reviewed.

## Fixed-state paired screenshots only

Directory:
`.hermes_handoff/screenshots/conversion-fixes/pairs/`

Pairs:
- `fix-1-cta-below-preview-pair.png`
- `fix-2-post-download-below-preview-pair.png`
- `fix-3-badge-nowrap-pair.png`
- `fix-4-history-date-nav-pair.png`
- `fix-5-day0-email-copy-pair.png`
- `fix-6-day6-email-render-pair.png`

Updated raw after screenshots are also in:
- `.hermes_handoff/screenshots/conversion-fixes/after/`
- `.hermes_handoff/screenshots/conversion-triggers/`

## Verification run

Commands passed:

```bash
npm test
npx tsc --noEmit
NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co' \
SUPABASE_SERVICE_ROLE_KEY='dummy-service-role-key' \
NEXT_PUBLIC_SUPABASE_ANON_KEY='dummy-anon-key' \
NEXT_PUBLIC_APP_URL='http://localhost:3000' \
RESEND_API_KEY='***' \
STRIPE_SECRET_KEY='***' \
STRIPE_WEBHOOK_SECRET='***' \
npm run build
git diff --check
node .hermes_handoff/scripts/capture-conversion-triggers.mjs
```

Results:
- `npm test`: **98 pass / 0 fail**
- `npx tsc --noEmit`: **OK**
- `npm run build`: **OK** with dummy non-secret env values
- Static pages generated: **37/37**
- `git diff --check`: **OK**
- capture script regenerated screenshots successfully

## STOP

Ready for Rosita's second review.

Do **not** merge.
Do **not** production deploy.
