# RevisaMiCV — SPEC Flow v4 + Design System v2
**Status: FROZEN — approved by Rosita 2026-06-12 against interactive prototype flow-v4-simulador.html**
This document is the single source of truth for the new analysis flow. Handoffs to Athena are cut from this spec one phase at a time. Nothing outside this spec is in scope.

---

## 1. Frozen product principles (non-negotiable)

1. **Deliver first.** The machine works alone after input. The user never works before receiving value. The adapted CV analysis arrives done.
2. **Ask before sentencing.** The system NEVER declares a gap unfixable without asking the user first. Even visa status is a question. "This cannot be fixed in a CV" copy may only appear AFTER the user answers "no".
3. **Specificity without typing.** All answers are taps: concrete activities derived from the vacancy, source, duration, level. The CV line is composed word-by-word from the user's taps. The user never types free text in the question flow.
4. **Lower score → more questions.** Recoverable points scale with distance. Bands: score ≥60 → 2–3 questions; 40–59 → 3–4; <40 → 5–6. Total points in play shown as a pill ("Hasta +32 en juego").
5. **Honesty is protected, never punished.** Judging the document, never the person. Declining or answering "no" produces warm, factual copy. Nothing is invented. "Tu crédito rinde más en vacantes más cercanas" remains the kind exit.

## 2. The two-beat flow

```
INPUT (CV saved + vacancy paste)
  → WORKING (narrated progress, ~3s perceived)
  → TIEMPO 1: analysis delivered
      - gauge hero with live score
      - 2-line verdict
      - N questions (tap-only), score rises LIVE in gauge + sticky bar
      - sticky bottom bar: score · answered count · [Generar mi CV →] · [Saltar preguntas]
  → GENERATING interstitial ("Escribiendo tu CV con todo lo que confirmaste")
  → TIEMPO 2: celebration delivery
      - "Tu CV quedó listo."
      - giant delta De X a Y (gradient numeral)
      - chips of confirmed reinforcements
      - PRIMARY: Descargar PDF (the reward) + DOCX/TXT/Editar
      - full CV preview with highlighted new lines
      - cover letter block: toggle [Mensaje corto | Carta formal] + Copiar + Descargar TXT
      - next-step block (per case) + trust line
```

Key consequences for the engine:
- Question answers feed CV generation BEFORE the final document is written. The CV is generated once, with everything.
- Download CTA exists ONLY in Tiempo 2. No download UI in Tiempo 1.
- "Saltar preguntas" always available; skipping generates the CV with base reinforcements only.

## 3. Screens

### 3.1 Input
- CV chip: "Tu CV base ya está guardado" + filename + Cambiar. (Reuse saved CV feature.)
- Vacancy textarea ("La vacante real").
- CTA: "✦ Analizar mi CV →".
- Trust line: "No inventamos experiencia. Solo mejoramos cómo se muestra la tuya."
- Existing wizard step-2 validation rules unchanged (file OR ≥120 chars → warning; less → error).

### 3.2 Working (narrated)
Steps, checked progressively (~0.9s apart):
1. "Leyendo la vacante real"
2. "Detectamos {n} requisitos — sabemos cuáles pesan más" (real count injected)
3. "Cruzando con tu experiencia real — sin inventar"
Footer: "Tu análisis estará listo en un momento."

### 3.3 Tiempo 1 — analysis + questions
- **Gauge hero**: SVG circle r=82, stroke 13, gradient stroke (cobalt→cobalt-2), animated dashoffset; score numeral 58px weight 900 inside; sub "/100 ENCAJE". Below: "Empezaste en {from}" (strikethrough) + green pill "+{n} con tu verdad" (appears only when n>0).
- **Title/sub per case band** (see §6 copy).
- **Verdict**: white card, 2–3 lines max, bold key phrases. No walls of text.
- **Questions header**: "{N} preguntas rápidas" + pill "Hasta +{total} en juego" + progress bar (resolved/total).
- **Question cards** (see §4).
- **Sticky action bar** (fixed bottom, blur): gradient score numeral · "{x} de {N} respondidas" · link "Saltar preguntas" · primary "Generar mi CV →".

### 3.4 Generating interstitial
Spinner + "Escribiendo tu CV con todo lo que confirmaste." + "Cada línea nueva sale de tus taps — nada más." Min 1.5s perceived, real generation time covers it.

### 3.5 Tiempo 2 — celebration delivery
- Green gradient check medallion.
- H2 "Tu CV quedó listo." + sub "Adaptado a esta vacante, con tu experiencia real — nada inventado."
- Delta hero: from (34px strikethrough) → arrow → to (clamp 72–96px, weight 900, green gradient text). Label "puntos de encaje con esta vacante". Count-up animation.
- Summary chips: one per confirmed question (name + check). If none confirmed: single chip "Reforzado con tu experiencia real del CV".
- Download hero: primary green "↓ Descargar mi CV en PDF" + secondary DOCX / TXT / "Editar antes de descargar".
- CV preview card: highlighted (`hl`) matched keywords; new lines from taps get `new-line` treatment (green tint row). English line updated in place when level question confirmed.
- Cover letter card (existing feature, relocated here): header "Inclúyela con tu CV", segmented toggle Mensaje corto | Carta formal, body, actions Copiar al portapapeles + Descargar TXT, hint "Ideal para LinkedIn, chat o portales con campo de texto corto."
- Next block per case (§6). Trust footer: "No inventamos empleadores, cargos ni métricas. Tú tienes la última palabra antes de enviar."

## 4. Question system

### 4.1 Card anatomy (all types)
- Top row: name (left) + cobalt pill "+{lift} pts" (right).
- Question line + inline "¿Qué cuenta?" link → expandable helper box (tint background).
- First-response chips (per type).
- Progressive steps separated by dashed dividers.
- Confirm step: line preview ("ASÍ QUEDARÍA EN TU CV" label, green left border) + green button "Sumar a mi CV · +{lift}" + amber hint when incomplete + "Empezar de nuevo" link.
- Done state: green tint card, "Sumado — construido con tus taps", final line, "Quitar" (full undo: score, CV line, state).
- Noted state (binary "no"): amber tint card, honest note, "Cambiar mi respuesta".

### 4.2 Types
| type | first chips | steps | line template |
|---|---|---|---|
| `acts` | Sí, lo viví · Tengo algo básico · No aplica | multi-select activities → source (5 options) | "{Source frag}: {acts joined}." |
| `acts+dur` | same | activities → duration (radio: <1 año / 1–3 / 3+) → source | "{Source frag}, {dur frag}: {acts joined}." |
| `level` | Actualizar mi nivel · Sigue igual | level radio (B1 igual/B2/C1) → backing (Con certificado / Autoevaluado — honesto) | replaces Idiomas line: "Inglés — {lvl} ({cert})" |
| `binary` | Sí, la tengo · No la tengo | none (Sí → straight to confirm) | fixed line (e.g. "Autorización de trabajo: visa de EE. UU. vigente.") |

### 4.3 Behavior rules (bugs already paid for — do not regress)
- Multiple question cards can be open and in-progress SIMULTANEOUSLY. Opening one never collapses or clears another.
- Preview + confirm button appear as soon as ≥1 activity selected. Button disabled (45% opacity) with explicit hint until required steps complete. Never a dead end.
- `level` with "B1 (igual que hoy)": preview shows "Tu CV ya dice B1 — no hay nada que cambiar, y dejarlo honesto también te protege." Add button stays disabled. No lift.
- Undo restores everything: score, gauge, sticky bar, CV line, progress count.
- "No aplica" hides the card, counts as resolved in progress, toast "Listo — eso se queda por fuera. Nada se inventa."
- Binary "No" → noted state with `noNote` copy. Counts as resolved. Reversible.
- Dates and all numerals rendered in Spanish locale.

### 4.4 Question generation rules (engine)
- Activities MUST be derived from the actual vacancy requirements (concrete, recognizable actions), never generic.
- Each question carries an honest lift estimate from the matching engine; sum exposed as "Hasta +X en juego".
- Question count by score band per §1.4. Never emit meta-questions or zero-lift questions (the 21→21 bug class). If a candidate question has lift 0, drop it.
- Requirement classes mapping: legal/binary (visa, licencias) → `binary`; declarable level (idiomas) → `level`; experience duration requirements → `acts+dur`; everything else → `acts`.

## 5. Design System v2 (token delta — same brand, more character)

**Unchanged (still locked):** Cobalt #2D6BE0 as brand accent · Figtree · Lucide icons · light background · copy evaluates the document never the person.

**New/updated tokens:**
```css
--cobalt:#2D6BE0; --cobalt-2:#5B8DF0; --cobalt-deep:#1E4FC2;
--grad: linear-gradient(135deg,#2D6BE0 0%,#5B8DF0 100%);        /* primary CTAs, logo, score */
--green:#149563; --green-2:#2FBF8A;
--grad-green: linear-gradient(135deg,#149563 0%,#2FBF8A 100%);  /* success: points, download, confirmations */
--ink:#0F1830;            /* darker text ink (was #16203A) */
--muted:#5B6478; --faint:#8A93A8;
--bg:#F5F8FE;
--r:16px; --r-lg:24px;    /* cards up to 28px on hero cards */
--sh-sm:0 1px 2px rgba(15,24,48,.05), 0 4px 14px rgba(15,24,48,.05);
--sh-md:0 2px 4px rgba(15,24,48,.04), 0 14px 40px rgba(15,24,48,.09);
--sh-glow:0 18px 50px rgba(45,107,224,.18);                      /* hover on key cards */
/* CTA shadows: 0 10px 26px rgba(brand,.35) */
```
**Typography scale:** H1 clamp(30–42px) w900 ls-.025em · H2 clamp(23–30px) w900 · section H3 16.5–18px w800/900 · body 15–16px w400/600 · buttons w800 · score numerals w900 tabular-nums with gradient text (`background-clip:text`).
**Background:** subtle fixed radial tints (cobalt at ~8–10% alpha, top center + side).
**Motion:** fade/rise on entry (0.35–0.4s), pop on previews/chips, count-up numerals (~40ms steps), gauge dashoffset 0.5s cubic-bezier(.4,0,.2,1). Respect `prefers-reduced-motion` everywhere.
**Buttons:** pill radius, gradient fill for primary (cobalt) and success (green), soft glow shadow, hover brightness 1.05, active scale .97.

### 5.1 Coherence rollout (rest of product)
- **Fase A (with the new flow):** all new flow screens ship on v2 tokens.
- **Fase B:** landing + nav + pricing + dashboard re-tokened: heading weights → 800/900, ink → #0F1830, primary CTAs → gradient + glow, score displays → gradient numerals, card radii/shadows → v2. No layout changes, token swap only.
- **Fase C:** transactional emails re-skinned to v2 (incl. the off-brand payment email — currently dark green/orange).
- Fase B and C are separate handoffs. Never bundle with Fase A.

## 6. Copy (verbatim, Spanish)

**Working:** see §3.2.
**Tiempo 1 titles by band:**
- near: "Tu CV ya conecta con esta vacante." / sub "Lo principal está. Estas preguntas pueden subirlo más — todas opcionales."
- mid: "Hay base real. Y margen para subir." / sub "Tus skills blandas pesan a tu favor. Estas {N} preguntas pueden cambiar el número."
- far: "Hay distancia con esta vacante. Preguntemos antes de sentenciar." / sub "Reforzamos todo lo real. Y estas {N} preguntas pueden cambiar el número — hasta +{total}."
**Questions sub:** "Respondes con taps — nunca escribes. Cada una dice cuántos puntos vale. Solo lo que confirmes entra a tu CV." Footer: "Nada de lo que no confirmes se inventa."
**Visa noNote (after "No"):** "Gracias por la honestidad. Esta vacante lo exige por ley — ningún CV lo arregla, y no es un defecto tuyo. Tu crédito rinde más en vacantes sin este requisito."
**Tiempo 2:** "Tu CV quedó listo." / "Adaptado a esta vacante, con tu experiencia real — nada inventado." / far next-block: "Este resultado queda guardado en tu panel. Cuando encuentres una vacante más cercana, tu CV base ya está listo — el análisis toma 2 minutos." + CTA "Buscar mejor encaje · Analizar otra vacante →".
**Toasts:** confirm "Subiste a {score} — cada palabra salió de tus taps." · undo "Quitado. Nada queda sin tu permiso." · dismiss "Listo — eso se queda por fuera. Nada se inventa." · binary-no "Anotado con honestidad — nada se inventa."
Voice: always "nosotros" ("Recuperamos", "Detectamos"). All UI Spanish.

## 7. Out of scope / guardrails for implementation handoffs
- NO changes outside the files each handoff lists. NO other bugs. NO refactors.
- Credits/payment flow untouched (inline purchase block from PR #5 stays as is).
- Independent hotfixes tracked separately (NOT part of this spec): post-payment header still shows "CRÉDITOS AGOTADOS" / purchased credits not displayed; payment email re-skin (folded into Fase C); contrast fix on letter card.
- Reference implementation: `flow-v4-simulador.html` (772 lines) — visual and behavioral ground truth. When in doubt, match the prototype.

## 8. Acceptance bar (applied by Rosita + Claude on paired screenshots before merge)
1. Does every gap ASK before sentencing? 2. Is there ever a dead end or an orphan CTA? 3. Is every CV line traceable to user taps? 4. Does download appear only in Tiempo 2? 5. Does it look like the prototype (gauge, gradients, weights) — not a paler cousin?
