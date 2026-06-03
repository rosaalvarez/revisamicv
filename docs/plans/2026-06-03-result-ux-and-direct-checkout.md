# RevisaMiCV Result UX + Direct Checkout Implementation Plan

> **For Hermes:** Implement in small, verified commits. Do not touch Stripe prices/secrets. Keep Spanish LATAM copy. Do not invent experience or add judgmental language.

**Goal:** Convert the CV result experience from a long report into a short, guided, actionable flow, and make paid pack selection go directly to Stripe checkout.

**Architecture:** Keep the current Next.js app and existing API endpoints. Refactor `src/app/signup/page.tsx` into clearer result sections using progressive disclosure, add a visible "Qué cambió" summary after AI revision, soften blocked-change copy, and update landing pricing links to a checkout intent route that starts Stripe as directly as possible.

**Tech Stack:** Next.js App Router, React client components, existing Stripe checkout API, existing CV revision API.

---

## UX Principles to Apply

1. **One-screen answer first:** score, verdict, 3 priority actions, primary CTA.
2. **Progressive disclosure:** collapse long diagnostic sections by default.
3. **Show changes, not only final CV:** before/after, what changed, why it changed.
4. **Guardrails without judgment:** replace "no puedo / no se puede" with "para proteger tu credibilidad, propongo...".
5. **Clarify before risky edits:** show a modal with contextual options when the request is ambiguous or unsupported.
6. **Buying means paying:** if a user clicks a $5/$12/$19 pack, take them toward Stripe, not a generic dashboard.

---

## Current Root Causes

- `src/app/signup/page.tsx` renders too many full sections in one long vertical page.
- The clarification modal exists, but it only opens when the first analysis returns `clarificationQuestions`; manual revision requests like "forzar" do not reliably trigger a pre-revision clarification step.
- `revisionNotes` and `blockedChanges` are displayed with judgmental/negative framing: "Cambios no aplicados por seguridad".
- The user sees the final optimized CV but not a clear before/after diff of what the AI changed.
- Landing pricing links go to `/dashboard?pack=...`, which feels like "consultar créditos" instead of checkout intent.

---

## Task 1: Rename the top result into a short executive summary

**Objective:** Make the first result screen answer: score, what it means, next action.

**Files:**
- Modify: `src/app/signup/page.tsx`

**Steps:**
1. Keep the score card at the top.
2. Add a compact "Prioridad ahora" block with max 3 actions:
   - Use `gaps?.slice(0, 2)` plus one keyword/action item.
   - If `applicationDecision === 'not_recommended'`, phrase as "Vacante poco alineada; prueba una vacante más cercana".
3. Add CTA buttons:
   - Primary: `Mejorar con IA`
   - Secondary: `Ver análisis completo`
   - Download CTA remains visible but lower priority until after review.
4. Verify mobile: top area must fit without requiring a giant scroll.

**Acceptance:** User understands result in 10 seconds.

---

## Task 2: Convert long result sections into collapsible cards

**Objective:** Reduce the scroll length and cognitive load.

**Files:**
- Modify: `src/app/signup/page.tsx`

**Steps:**
1. Create local component `ResultAccordion({ title, summary, defaultOpen, children })`.
2. Wrap these sections:
   - Brechas principales
   - Palabras clave
   - Advertencias / cuidado de credibilidad
   - CV optimizado completo
   - Carta / contenido adicional if present
3. Default open:
   - Summary/score open
   - "Qué cambiar primero" open
   - CV completo closed
   - Detailed warnings closed unless critical
4. Add sticky mini-nav on desktop or compact action row on mobile if quick.

**Acceptance:** The page no longer feels like infinite scroll; user can open only what she needs.

---

## Task 3: Add "Qué cambió en tu CV" after AI revision

**Objective:** Show what the AI actually implemented.

**Files:**
- Modify: `src/app/signup/page.tsx`

**Steps:**
1. Reuse `getAddedSkills(beforeCv, data.optimizedCV)` for skill additions.
2. Add a helper `summarizeCvChanges(beforeCv, afterCv)` with simple section-level comparison:
   - headline changed
   - summary changed
   - core competencies/tools added
   - experience bullets changed count
   - target title changed
3. Render a card after revision:
   - "Qué cambió"
   - tags: `Perfil reescrito`, `Keywords añadidas`, `Experiencia ajustada`, etc.
   - "Por qué ayuda" using `revisionScoreExplanation` if present.
4. Keep it simple; no complex diff library for MVP.

**Acceptance:** After clicking "Aplicar cambio con IA", user sees a concrete list of changes.

---

## Task 4: Change blocked-change copy from judgment to coaching

**Objective:** Avoid the feeling that the app is judging the user.

**Files:**
- Modify: `src/app/signup/page.tsx`
- Modify: `src/lib/cv-rules.js`

**Copy replacements:**
- From: `Cambios no aplicados por seguridad`
- To: `Para cuidar tu credibilidad, esto lo dejamos como recomendación`

- From: `No se puede agregar experiencia...`
- To: `No agregué experiencia que no aparezca respaldada en tu CV. Sí puedo ayudarte a describir mejor experiencia real relacionada.`

**Prompt instruction:**
Add to revision prompt:
- Avoid moralizing language.
- Use supportive coaching.
- Always include a safe alternative.

**Acceptance:** The blocked area feels like guidance, not punishment.

---

## Task 5: Trigger clarification modal for risky manual revision requests

**Objective:** If user asks to "forzar", "hacer parecer", "agregar experiencia", or similar, ask 3 helpful options before calling the revision API.

**Files:**
- Modify: `src/app/signup/page.tsx`

**Steps:**
1. Add helper `detectRiskyRevisionInstruction(instruction: string)`.
2. Match Spanish/English terms:
   - `forzar`, `hazlo parecer`, `invent`, `agrega experiencia`, `sube el score`, `figma`, `ux/ui`, `certificación`, `años de experiencia` when not present.
3. If risky and not already coming from clarification:
   - Set modal prompts manually.
   - Do not call `/api/revise-cv` yet.
4. Modal options should be contextual:
   - `Reformular solo experiencia real que ya está en mi CV`
   - `Quiero agregar contexto real que puedo respaldar`
   - `Muéstrame una alternativa más segura para esta vacante`
   - Free text.
5. Submit builds a clarification instruction and then calls revision.

**Acceptance:** Manual "forzar" opens a helpful choice modal before applying.

---

## Task 6: Direct checkout when selecting a price from landing

**Objective:** Clicking `$5` should feel like buying `$5`, not consulting dashboard.

**Files:**
- Modify: `src/app/page.tsx`
- Modify/Create: possible `src/app/checkout/page.tsx` or reuse `/dashboard?pack=...&intent=checkout`

**Preferred minimal implementation:**
1. Change landing pricing link text to `Comprar {plan.name}` / `Comprar {plan.price}`.
2. Link to `/dashboard?intent=checkout&pack=${plan.key}`.
3. In dashboard, if `intent=checkout&pack=...`:
   - Hide generic dashboard language or show a focused top card:
     `Estás comprando Pack Básico — $5 USD`
   - If email exists in query/localStorage, auto-start checkout after short confirmation OR show single primary button `Ir a pagar ahora`.
   - If email missing, show only email field + pack summary + `Continuar a pago`.
4. Do not show the full dashboard above the checkout intent.

**Better later:** Dedicated `/checkout?pack=basic` page.

**Acceptance:** From pricing click, user sees a focused purchase flow and can reach Stripe with one clear action.

---

## Task 7: Verify

**Commands:**
```bash
npm test
npm run build
```

**Manual checks:**
1. Run analysis with mismatched CV/vacancy.
2. Ask to "forzar" UX/UI.
3. Confirm modal appears before revision.
4. Apply revision.
5. Confirm revised score + "Qué cambió" appears.
6. Confirm result page is shorter with collapsed sections.
7. Click Basic `$5` from landing.
8. Confirm purchase intent is direct and Stripe opens.

---

## Implementation Priority

### P0 — Do first
- Task 4: tone guardrails
- Task 5: clarification modal for risky manual revisions
- Task 6: direct checkout intent

### P1 — Do next
- Task 1: executive summary
- Task 2: collapsible sections
- Task 3: what changed

### P2 — Later polish
- Fancy visual diff
- Sticky desktop sidebar
- Post-payment continuation back to exact analysis
