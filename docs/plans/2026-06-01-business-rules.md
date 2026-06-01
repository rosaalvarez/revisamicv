# RevisaMiCV Business Rules

## Product Vision

RevisaMiCV helps a professional compare their real CV against a specific job vacancy and generate a tailored CV for that vacancy in minutes.

The product is not a generic CV translator. It is a decision and adaptation tool:

1. Does this vacancy make sense for me?
2. How compatible is my real experience with it?
3. Which parts of my experience should be highlighted?
4. Which gaps should I be aware of?
5. Can I generate a tailored CV in English or Spanish without inventing experience?

## Core User Loop

1. User uploads or pastes CV.
2. User pastes one vacancy.
3. User chooses output language: English or Spanish.
4. App calculates compatibility percentage.
5. App explains strengths, gaps, and risk level.
6. App generates tailored CV.
7. User downloads PDF.
8. User repeats with another vacancy.
9. Token model monetizes repeated evaluations.

This creates a healthy dependency loop: users want to test multiple vacancies before applying.

## Compatibility Score

The compatibility score is not a promise of getting hired. It is an estimate of how well the CV can be positioned for the vacancy.

Score bands:

- 85–100: Strong fit. User should apply with a tailored CV.
- 70–84: Good adjacent fit. User can apply if the CV is repositioned well.
- 55–69: Stretch fit. User may apply, but should expect lower response rate.
- 40–54: Weak fit. App can generate a CV, but must warn that gaps are significant.
- 0–39: Not recommended. App can still generate a CV, but should clearly warn not to invent experience.

## Adjacent Role Logic

People are not one job title. The app must identify transferable skills.

Examples of valid adjacent adaptations:

- Systems Engineer → Product Manager / Project Manager / Product Owner / Scrum Master / UX Researcher / AI Specialist.
- UX Researcher → Product Manager / Product Designer / Product Owner.
- Backend Developer → Fullstack Developer / Technical Product Manager / Solutions Engineer.
- Marketing Specialist → Growth Manager / Content Strategist / Performance Marketer.
- Customer Support Lead → Customer Success Manager / Operations Manager / CX Manager.

Examples of invalid or high-risk adaptations:

- Engineer → Doctor.
- Administrative Assistant → Senior Machine Learning Engineer.
- Designer → Certified Lawyer.
- Junior profile → Director role without leadership evidence.

## Anti-Invention Rules

The app must never invent:

- employers
- degrees
- certifications
- seniority
- years of experience
- tools not present or clearly inferable
- metrics not supported by the CV
- regulated/licensed credentials

Allowed transformations:

- Translate experience to the selected language.
- Reorder sections.
- Reframe responsibilities as achievements when supported.
- Surface transferable skills.
- Use vacancy keywords when truthful.
- Convert vague phrases into clearer professional wording.

Risky transformations requiring warnings:

- Implied experience in payments, payouts, KYB, SQL, or sales if not present.
- Strong spoken English if CV states limited level.
- Leadership claims if no people/project ownership evidence exists.

## Output Requirements

Every generation should include:

1. Compatibility percentage.
2. Fit verdict.
3. Best positioning angle.
4. Strengths to emphasize.
5. Gaps or risks.
6. Keywords to include.
7. Tailored CV in selected language.
8. Optional cover letter.
9. PDF download.

## Language Rule

The user chooses final CV language:

- English: for global, US, Canada, remote, or English-language vacancies.
- Spanish: for Spain, LATAM, Spanish-language vacancies, or users who prefer Spanish.

The score and explanations should be displayed in the UI language used by the product, currently Spanish, but the CV itself must follow the selected output language.

## Monetization Rule

Each vacancy evaluation + tailored CV generation consumes one token.

Free tier:

- One free generation per email.

Paid tiers:

- Basic: 5 CVs.
- Pro: 15 CVs.
- Premium: 30 CVs.

The product should encourage repeated use:

- “Prueba otra vacante”
- “Compara esta vacante contra otra”
- “Compra más tokens para evaluar más oportunidades”

## MVP Scope This Week

Must have:

- Email field.
- Output language switch.
- CV upload/paste.
- Vacancy paste.
- Compatibility score.
- Strengths/gaps.
- Tailored CV in English or Spanish.
- No-invention guardrails.
- PDF download.
- Token/payment enforcement.

Can wait:

- User accounts/passwords.
- Full history dashboard.
- Advanced analytics.
- Multiple CV templates.
- Cover letter as separate paid product.
