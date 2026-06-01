# RevisaMiCV.lat Launch Week Product Completion Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Convert RevisaMiCV from a basic text optimizer into a complete job-application tool: user uploads/pastes CV + pastes vacancy, receives an adapted professional CV in English with downloadable PDF, match analysis, and token/payment control.

**Architecture:** Keep current Next.js App Router + Supabase + Stripe + OpenAI stack. Add structured AI output, document parsing, PDF generation, result persistence, and a stronger UX around one concrete job application.

**Tech Stack:** Next.js 16, React 19, Supabase, Stripe, OpenAI, server-side PDF generation.

---

## Product Positioning

RevisaMiCV is not a generic CV reviewer. It is a fast application assistant for LATAM professionals applying to better jobs, remote jobs, bilingual jobs, or roles outside their country.

Core promise:

> Paste your vacancy. Upload your CV. In minutes, get a tailored CV in English, adapted to the role, with the right keywords, a match score, and a PDF ready to apply.

Allowed adaptation:
- UX Designer → Product Designer / Product Manager / UX Research / Project/Product-adjacent roles.
- Developer → Software Engineer / Frontend / Fullstack / Technical PM if experience supports it.
- Marketing → Growth / Content / Performance roles.

Not allowed:
- Inventing credentials.
- Turning unrelated careers into false profiles, e.g. engineer → doctor.
- Fake metrics, fake employers, fake degrees.

---

## Current Critical Gaps

1. `/signup` advertises PDF/Word/TXT, but backend only reliably reads plain text. PDF/DOCX parsing is missing.
2. `/signup` does not send `email` in FormData, while `/api/process-cv` requires email. This can break processing.
3. Result is only text on screen. No downloadable PDF.
4. AI output is a single markdown blob, not a productized deliverable.
5. No structured match report: missing keywords, transferable skills, role fit, warnings.
6. Token/payment flow exists but Supabase RLS and `free_used` migration must be fixed.
7. Webhook secret must be configured in Vercel.
8. No history: user cannot return later and download previous CV.

---

## MVP Launch Definition

A launchable version this week must do this reliably:

1. User enters email.
2. User chooses output language: English or Spanish.
3. User uploads CV as PDF, DOCX, or TXT, or pastes text manually.
4. User pastes the job/vacancy description.
5. Backend extracts CV text.
6. AI returns structured JSON in the selected language:
   - match score
   - target role
   - top improvements
   - missing keywords
   - transferable skills
   - honesty warnings
   - optimized CV sections
   - optional short cover letter
7. UI shows a clean result, not a raw text blob.
8. User downloads a polished PDF in the selected language.
9. User can buy more tokens.
10. Stripe webhook credits tokens.
11. Backend blocks after free use + no tokens.

---

## Phase 1 — Make Current Flow Not Broken

**Objective:** Make the existing app usable end-to-end before adding advanced features.

**Files:**
- Modify: `src/app/signup/page.tsx`
- Modify: `src/app/api/process-cv/route.ts`
- Modify: `supabase-schema.sql`

Tasks:
1. Add email field to `/signup` and include `email` in FormData.
2. Add language switch: `Español` / `English`, default based on vacancy language or user selection.
3. Include `outputLanguage` in FormData and API request.
4. Make `jobDescription` required in frontend before submit.
5. Fix copy: do not promise PDF/Word if backend cannot parse yet, unless Phase 2 is done immediately.
6. Return friendly Spanish errors for 400/402.
7. Run `npm run build`.
8. Deploy.

Verification:
- Submit TXT CV + vacancy + email.
- Confirm result returns.
- Confirm no-email error is gone.

---

## Phase 2 — Real Document Input

**Objective:** Accept real files users have: PDF and DOCX.

**Files:**
- Modify: `package.json`
- Create: `src/lib/extract-cv-text.ts`
- Modify: `src/app/api/process-cv/route.ts`

Tasks:
1. Add PDF extraction dependency.
2. Add DOCX extraction dependency.
3. Create `extractCvText(file)` utility.
4. Enforce file size limit.
5. Add clear fallback: if extraction fails, ask user to paste CV text.
6. Test with TXT, PDF, DOCX.

Verification:
- Upload a normal PDF CV.
- Upload a DOCX CV.
- Confirm backend extracts enough text.

---

## Phase 3 — Better AI Product Output

**Objective:** Stop returning mediocre generic text. Return a productized career deliverable.

**Files:**
- Create: `src/lib/cv-optimizer.ts`
- Modify: `src/app/api/process-cv/route.ts`
- Modify: `src/app/signup/page.tsx`

Tasks:
1. Replace single markdown prompt with structured JSON schema.
2. Add strict honesty rules: adapt only adjacent roles, do not invent.
3. Add transferable-skills reasoning.
4. Add vacancy keyword extraction.
5. Add ATS score and explanation.
6. Add improved CV sections.
7. Add optional cover letter.
8. Render result as sections/cards, not raw monospaced blob.

Verification:
- Test UX CV → Product Manager vacancy.
- Confirm result adapts language without inventing experience.
- Confirm score + keywords are displayed.

---

## Phase 4 — PDF Download

**Objective:** Deliver the thing users expect: a file ready to send.

**Files:**
- Create: `src/app/api/export-pdf/route.ts`
- Create: `src/lib/render-cv-html.ts`
- Modify: `src/app/signup/page.tsx`

Tasks:
1. Convert structured CV result to clean ATS-safe HTML.
2. Generate PDF server-side.
3. Add `Download PDF` button.
4. Ensure PDF has professional spacing, headings, and one/two page layout.
5. Include no branding inside the CV PDF.

Verification:
- Generate result.
- Download PDF.
- Open PDF and inspect visual quality.

---

## Phase 5 — Payments/Tokens Production Lock

**Objective:** Make paid flow trustworthy.

**Files:**
- Modify: `supabase-schema.sql`
- Verify: `src/app/api/stripe/webhook/route.ts`
- Verify: `src/app/api/user/route.ts`

Tasks:
1. Run Supabase SQL migration for grants and `free_used`.
2. Configure `STRIPE_WEBHOOK_SECRET` in Vercel.
3. Verify checkout success URL.
4. Verify webhook credits tokens.
5. Verify free CV only once.
6. Verify 402 when user has no tokens.

Verification:
- Use Stripe test payment.
- Confirm tokens increase.
- Confirm token decreases after generation.

---

## Phase 6 — Launch Polish

**Objective:** Make it sellable this week.

Tasks:
1. Add sample vacancy placeholder.
2. Add before/after sample PDF preview.
3. Add FAQ: does it invent? does it work for PDF? can I adapt to adjacent roles?
4. Add clear promise: "CV adaptado a una vacante específica".
5. Test mobile flow.
6. Add simple analytics/events if available.

---

## What Rosita Must Provide

Only one thing at a time.

First required item:
- A real CV sample and a real vacancy sample for testing. It can be anonymized.

Later required items:
- Supabase SQL execution confirmation.
- Stripe webhook secret configuration confirmation.
- Final pricing decision if changing token packs.

---

## Launch Week Priority Order

1. Fix broken form/email + current flow.
2. Add PDF/DOCX parsing.
3. Improve AI output quality.
4. Add PDF download.
5. Lock payments/tokens.
6. Polish landing and launch.
