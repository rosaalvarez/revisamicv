# Editable Application Kit + DOCX Export Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Let users correct specific personal/contact fields and request small changes before downloading, then export the final CV as PDF, TXT ATS, and DOCX.

**Architecture:** Do not build a full Enhancv-style drag-and-drop editor yet. Add a lightweight “review and edit” layer after AI generation: contact/profile fields, editable summary/skills/experience text fields, and a freeform instruction box. The edited JSON becomes the source of truth for downloads. Add DOCX/TXT routes that reuse the same normalized CV structure.

**Tech Stack:** Next.js App Router, React state, existing OpenAI JSON output, pdfkit, `docx` npm package, Supabase history.

---

## Product decision

We are aligned: RevisaMiCV should not copy Enhancv as a visual builder. It should take the most useful functionality for people applying today:

1. Upload old CV.
2. AI extracts/adapts it.
3. User fixes stale data: email, phone, city, LinkedIn, portfolio, target title.
4. User optionally says: “cambia esto / agrega esto si está en mi CV / quita esto”.
5. User downloads PDF/DOCX/TXT.

This avoids the double work problem where the PDF is correct but not editable.

---

## MVP scope

### Include now

- Editable contact block:
  - candidateName
  - email
  - phone
  - location/city
  - LinkedIn
  - portfolio/website
  - targetTitle
- Editable sections:
  - summary
  - coreCompetencies as comma/newline text
  - technicalSkills as comma/newline text
  - tools as comma/newline text
  - languages as lines
  - education as lines
  - certifications as lines
  - experience bullets as editable textareas per role
- Freeform modification instruction box:
  - “¿Qué quieres corregir o ajustar antes de descargar?”
- Download buttons:
  - PDF
  - DOCX
  - TXT ATS
- Copy-to-clipboard buttons:
  - CV text
  - cover letter

### Exclude now

- Drag-and-drop sections.
- Full visual template builder.
- 100 templates.
- Rich text formatting.
- Inline AI per bullet.
- Account/auth refactor.

---

## Data model

Use current `optimizedCV` JSON as base.

Expected shape:

```ts
type OptimizedCV = {
  candidateName?: string
  contact?: {
    email?: string
    phone?: string
    location?: string
    linkedin?: string
    portfolio?: string
  }
  targetTitle?: string
  summary?: string
  coreCompetencies?: string[]
  technicalSkills?: string[]
  tools?: string[]
  experience?: Array<{
    title?: string
    company?: string
    location?: string
    dates?: string
    bullets?: string[]
  }>
  education?: string[]
  certifications?: string[]
  languages?: string[]
  additionalInformation?: string[]
}
```

---

## Task 1: Add DOCX dependency

**Objective:** Install a library to generate Word documents.

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Steps:**

1. Install:

```bash
npm install docx
```

2. Verify:

```bash
npm test
npm run build
```

3. Commit:

```bash
git add package.json package-lock.json
git commit -m "chore: add docx export dependency"
```

---

## Task 2: Create shared CV text normalizer

**Objective:** Build a single function that turns optimized CV JSON into plain ATS text used by TXT, clipboard, tests, and possibly DOCX.

**Files:**
- Create: `src/lib/cv-formatters.js`
- Create/modify: `tests/cv-formatters.test.mjs`

**Implementation notes:**

Export:

```js
export function optimizedCvToPlainText(cv, language = 'english')
export function normalizeStringArray(value)
export function splitEditableList(value)
```

Plain text should include:

- Name
- Contact line
- Target title
- Summary
- Skills
- Technical skills
- Experience
- Education
- Certifications
- Tools
- Languages

**Verification:**

```bash
npm test
```

---

## Task 3: Add TXT export endpoint

**Objective:** Let users download an ATS-safe `.txt` version.

**Files:**
- Create: `src/app/api/generate-txt/route.ts`
- Test: add route-level smoke or unit helper test if route testing exists.

**Behavior:**

POST JSON:

```json
{
  "optimizedCV": {},
  "outputLanguage": "english"
}
```

Returns:

- `Content-Type: text/plain; charset=utf-8`
- `Content-Disposition: attachment; filename="cv-revisamicv.txt"`

**Verification:**

```bash
curl -X POST http://localhost:3100/api/generate-txt \
  -H 'content-type: application/json' \
  -d '{"optimizedCV":{"candidateName":"Test User","summary":"Hello"}}'
```

---

## Task 4: Add DOCX generator

**Objective:** Generate a clean editable Word CV from the same optimizedCV JSON.

**Files:**
- Create: `src/lib/docx-generator.js`
- Create: `src/app/api/generate-docx/route.ts`
- Create/modify: `tests/docx-generator.test.mjs`

**Implementation notes:**

Use `docx` package:

- `Document`
- `Packer`
- `Paragraph`
- `TextRun`
- `HeadingLevel`

Use simple ATS-friendly styling:

- No columns.
- No images.
- Standard headings.
- Bullet paragraphs.
- Contact line near top.

**Verification:**

```bash
npm test
npm run build
```

---

## Task 5: Add editable CV form component

**Objective:** After generation, show editable fields before download.

**Files:**
- Create: `src/components/EditableCvForm.tsx`
- Modify: `src/app/signup/page.tsx`

**UI sections:**

1. “Revisa tus datos antes de descargar”
2. Contact fields:
   - Nombre
   - Email
   - Teléfono
   - Ciudad/País
   - LinkedIn
   - Portfolio
   - Cargo objetivo
3. “Ajustes rápidos” textarea:
   - placeholder: `Ej: cambia mi ciudad a Bogotá, actualiza mi email, quita esta certificación, agrega que manejo HubSpot si aparece en mi CV...`
4. Editable sections:
   - Summary textarea
   - Skills textarea
   - Experience role cards

**Important:** First version edits locally in React state. No AI regeneration yet.

---

## Task 6: Wire downloads to edited CV state

**Objective:** Ensure PDF/DOCX/TXT downloads use the edited version, not the original AI result.

**Files:**
- Modify: `src/app/signup/page.tsx`

**Implementation:**

- Add state:

```ts
const [editableCv, setEditableCv] = useState<any | null>(null)
```

- When `setResult(data)`, also:

```ts
setEditableCv(data.optimizedCV || null)
```

- PDF download body uses `editableCv`.
- DOCX download body uses `editableCv`.
- TXT download body uses `editableCv`.

---

## Task 7: Add optional “apply my requested changes” AI endpoint

**Objective:** Let user type a natural-language correction and have AI update the CV JSON while respecting anti-invention rules.

**Files:**
- Create: `src/app/api/revise-cv/route.ts`
- Modify: `src/lib/cv-rules.js`
- Modify: `src/app/signup/page.tsx`

**Behavior:**

Input:

```json
{
  "optimizedCV": {},
  "revisionInstruction": "Actualiza mi ciudad a Bogotá y cambia email a...",
  "outputLanguage": "spanish"
}
```

Rules:

- Allowed: contact data corrections, removing info, rewording, adding user-provided factual details.
- Not allowed: inventing jobs, degrees, certifications, metrics.
- Return same CV JSON shape.

**Note:** This endpoint should not consume a full paid token in MVP. It is part of the same generated result. Later it can be limited.

---

## Task 8: Persist edited downloads/history

**Objective:** If the user edits fields, the dashboard should redownload the edited/latest version.

**Files:**
- Modify: `src/lib/history-service.ts`
- Modify: `src/app/api/history/route.ts` if needed
- Modify: `supabase-schema.sql` if adding fields

**MVP approach:** Save edited CV only when generating from signup result if already available. If not, leave dashboard for generated AI version and add this later.

**Preferred approach:** Add endpoint:

```txt
/api/history/update-cv
```

that updates `optimized_cv` for a history item owned by email.

Because auth is not yet real, be careful with security. If unsure, defer dashboard edits until Supabase Auth is implemented.

---

## Task 9: Update smoke test

**Objective:** Validate all download formats.

**Files:**
- Modify: `scripts/smoke-test.mjs`

**Checks:**

- `/api/generate-pdf` returns PDF.
- `/api/generate-docx` returns DOCX.
- `/api/generate-txt` returns text.
- Full `/api/process-cv` still passes.

---

## Task 10: Final verification

Run:

```bash
npm test
npm run build
APP_URL=http://localhost:3100 npm run smoke -- --skip-paid-apis
```

Then after deploy:

```bash
APP_URL=https://revisamicv.lat npm run smoke -- --skip-paid-apis
```

Manual QA:

1. Generate CV.
2. Edit email/city/phone.
3. Download PDF and verify changes appear.
4. Download DOCX and open/edit.
5. Download TXT and verify ATS text.
6. Confirm old dashboard behavior still works.

---

## Recommended first implementation order

1. TXT export.
2. Editable contact/profile fields.
3. PDF uses edited state.
4. DOCX export.
5. Copy buttons.
6. Freeform AI revision.
7. Dashboard persistence.

This gives value fast without building a full resume editor.
