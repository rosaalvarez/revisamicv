# Open Source Resume Tools Research

**Goal:** Identify reusable ideas from ResumeSkills, ResumeLM, OpenResume, and agentic resume-tailoring repos for RevisaMiCV without creating licensing risk.

## Bottom line

RevisaMiCV should not copy code from AGPL/GPL/no-license repos. It can safely learn product patterns and reimplement them from scratch. The best source for direct adaptation is `Paramchoudhary/ResumeSkills` because it is MIT and contains workflows/prompts/checklists, not a full SaaS codebase.

## Repos reviewed

### Paramchoudhary/ResumeSkills

- URL: https://github.com/Paramchoudhary/ResumeSkills
- License: MIT
- Stars observed: ~653
- Type: Markdown skills/workflows for AI agents.
- Best ideas:
  - job description analyzer
  - weighted match score
  - ATS optimizer checklist
  - resume tailoring workflow
  - bullet improvement frameworks: STAR, CAR, X-Y-Z
  - quantified achievement discovery questions
  - red flags in job postings
  - interview preparation generator

### olyaiy/resume-lm

- URL: https://github.com/olyaiy/resume-lm
- License: AGPL-3.0
- Type: full open-source AI resume builder SaaS.
- Best ideas:
  - base resume + tailored resume versions
  - dashboard/history per vacancy
  - score breakdown by completeness, impact, role match, keyword match
  - missing keywords and improvement suggestions
  - multi-model provider support
- Do not copy code or prompts due to AGPL.

### xitanggg/open-resume

- URL: https://github.com/xitanggg/open-resume
- License: AGPL-3.0
- Type: resume parser + builder + PDF preview.
- Best ideas:
  - simple builder/editor with live preview
  - local PDF parsing when possible
  - clean ATS template
  - parser heuristics for sections
- Do not copy code/templates/parser due to AGPL.

### CrewAI / agentic tailoring repos

Most useful conceptual reference:

- `tonykipkemboi/resume-optimization-crew`
  - No clear license found.
  - Agents: job analyzer, resume analyzer, company researcher, resume writer, report generator.
  - Scoring idea: technical skills, soft skills, experience, education, industry/context.

Other relevant sources:

- `unikill066/smart-agentic-ats-resume` — MIT, useful guardrail idea: profile/source-of-truth.
- `KaushalprajapatiKP/ATS-Checker-Resume-using-CrewAI-MCP` — MIT, useful modular SaaS architecture idea.
- GPL/no-license repos should be inspiration only.

## What RevisaMiCV should build next

### 1. Match report by category

Current score should become more granular:

- Overall match
- Required skills match
- Preferred skills match
- Keyword match
- Experience alignment
- Education/certification alignment
- ATS formatting risk
- Honesty/risk score

### 2. Evidence-backed tailoring

For each generated claim or bullet, track:

- source: original CV, vacancy, user-confirmed input
- change type: preserved, rewritten, reordered, suggested, blocked
- risk: safe, needs confirmation, blocked

### 3. Red flags in job posting

Especially valuable for LATAM:

- “ponerse la camiseta”
- “familia”
- “disponibilidad 24/7”
- “sueldo competitivo” without range
- commission-only disguised as full-time
- age/photo/presentation requirements
- unclear contract type

### 4. Bullet improver

Detect weak bullets and rewrite them safely:

- responsibility → action/result
- vague → role-specific
- no metrics → ask user to confirm possible metrics
- never invent numbers

### 5. Interview prep upsell

After CV optimization, generate:

- likely interview questions
- STAR story bank
- 2-minute pitch
- how to explain gaps honestly
- questions to ask recruiter/hiring manager

## Recommended implementation approach

Use a typed sequential pipeline, not CrewAI dependency:

1. Parse CV.
2. Parse job description.
3. Extract requirements/keywords.
4. Score match by category.
5. Generate tailoring plan.
6. Optimize CV JSON.
7. Verify claims against evidence.
8. Let user edit/confirm.
9. Export PDF/DOCX/TXT.
10. Optional interview prep.

## License guidance

- MIT: can adapt with attribution if copying substantial text/code, but better to rewrite.
- AGPL/GPL: do not copy code, templates, parser logic, or prompts into RevisaMiCV SaaS.
- No license: treat as all-rights-reserved; use only as conceptual inspiration.

## Priority recommendation

Implement next:

1. Match report breakdown.
2. Evidence-backed change log.
3. Job red flags LATAM.
4. Bullet improver with confirmation prompts.
5. Interview prep as premium feature.
