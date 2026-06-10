import { parseJsonCompletion } from './json-completion.js'
import { hasMeaningfulCvContent } from './pdf-generator.js'
import { normalizeUserDeclarations } from './result-phase2.js'

export const MATCHING_WEIGHT_CONFIG = Object.freeze({
  must_have: 3,
  nice_to_have: 1,
  title_seniority: 2,
})

const VALID_REQUIREMENT_TYPES = new Set(['must_have', 'nice_to_have'])
const VALID_CATEGORIES = new Set(['experience', 'hard_skill', 'soft_skill', 'education', 'language', 'title_seniority', 'logistics'])
const VALID_STATUSES = new Set(['match', 'partial', 'gap'])
const STATUS_VALUE = { gap: 0, partial: 0.5, match: 1 }
const STATUS_RANK = { gap: 0, partial: 1, match: 2 }
const RANK_STATUS = ['gap', 'partial', 'match']
const ANCHOR_CATEGORIES = new Set(['hard_skill', 'language', 'education', 'logistics', 'title_seniority'])
const ANCHOR_STOPWORDS = new Set([
  'experience', 'hands', 'hand', 'using', 'with', 'ability', 'advanced', 'required', 'client', 'calls',
  'years', 'year', 'plus', 'strong', 'knowledge', 'skills', 'skill', 'methodology', 'methodologies',
  'experiencia', 'con', 'para', 'avanzado', 'avanzada', 'requerido', 'requerida', 'habilidad', 'uso',
])
const ANCHOR_EQUIVALENTS = {
  english: ['english', 'ingles', 'inglés'],
  agile: ['agile', 'agil', 'ágil', 'agiles', 'ágiles'],
  scrum: ['scrum'],
  jira: ['jira'],
  asana: ['asana'],
}
const REQUIRED_CV_SECTION_KEYS = ['summary', 'experience']
const MIN_GENERATED_CV_TEXT_LENGTH = 180

function stripAccents(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normalizeText(value) {
  return stripAccents(value).toLowerCase().replace(/\s+/g, ' ').trim()
}

function compactString(value, fallback = '') {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  return text || fallback
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function cvToText(cv) {
  if (typeof cv === 'string') return cv
  if (!cv || typeof cv !== 'object') return ''
  const parts = []
  const push = (value) => {
    if (!value) return
    if (Array.isArray(value)) value.forEach(push)
    else if (typeof value === 'object') Object.values(value).forEach(push)
    else parts.push(String(value))
  }
  push(cv.candidateName)
  push(cv.targetTitle)
  push(cv.headline)
  push(cv.summary)
  push(cv.coreCompetencies)
  push(cv.technicalSkills)
  push(cv.skills)
  push(cv.tools)
  push(cv.experience)
  push(cv.featuredProjects || cv.projects)
  push(cv.education)
  push(cv.certifications)
  push(cv.languages)
  return parts.join('\n')
}

export function containsEvidenceQuote(sourceText, evidence) {
  const haystack = normalizeText(sourceText)
  const needle = normalizeText(evidence)
  if (!needle) return false
  return haystack.includes(needle)
}

function tokenize(text) {
  return normalizeText(text).split(/[^a-z0-9]+/).filter(Boolean)
}

function requirementAnchorTokens(requirement) {
  const tokens = tokenize(requirement?.text || '')
    .filter((token) => token.length >= 3 && !ANCHOR_STOPWORDS.has(token) && !/^\d+$/.test(token))
  return [...new Set(tokens)]
}

function evidenceSatisfiesRequirementAnchors(requirement, evidence) {
  if (!ANCHOR_CATEGORIES.has(requirement?.category)) return true
  const anchors = requirementAnchorTokens(requirement)
  if (!anchors.length) return true
  const evidenceText = normalizeText(evidence)
  return anchors.some((anchor) => {
    const equivalents = ANCHOR_EQUIVALENTS[anchor] || [anchor]
    return equivalents.some((term) => evidenceText.includes(normalizeText(term)))
  })
}

export function normalizeRequirementWeights(requirements, config = MATCHING_WEIGHT_CONFIG) {
  return asArray(requirements).map((requirement, index) => {
    const type = VALID_REQUIREMENT_TYPES.has(requirement?.type) ? requirement.type : 'nice_to_have'
    const category = VALID_CATEGORIES.has(requirement?.category) ? requirement.category : 'experience'
    const configuredWeight = category === 'title_seniority'
      ? config.title_seniority
      : type === 'must_have'
        ? config.must_have
        : config.nice_to_have
    const numericWeight = Number(requirement?.weight)
    return {
      id: compactString(requirement?.id, `r${index + 1}`),
      text: compactString(requirement?.text, `Requirement ${index + 1}`),
      type,
      category,
      weight: Number.isFinite(numericWeight) && numericWeight > 0 ? numericWeight : configuredWeight,
    }
  })
}

function normalizeMatch(match, requirement) {
  const status = VALID_STATUSES.has(match?.status) ? match.status : 'gap'
  const evidence = match?.evidence == null ? null : compactString(match.evidence)
  const evidenceSource = 'cv'
  return {
    requirement_id: compactString(match?.requirement_id, requirement?.id),
    status,
    evidence: evidence || null,
    evidence_source: evidenceSource,
    note: compactString(match?.note),
  }
}

function gapMatch(requirement, language = 'spanish') {
  const note = language === 'spanish'
    ? 'El CV no muestra evidencia de este requisito.'
    : 'No valid CV evidence found for this requirement.'
  return {
    requirement_id: requirement.id,
    status: 'gap',
    evidence: null,
    evidence_source: 'cv',
    note,
  }
}

function validateMatches(matches, requirements, sourceText, outputLanguage = 'spanish') {
  const incomingById = new Map(asArray(matches).map((match) => [String(match?.requirement_id || ''), match]))
  const normalized = []
  const invalidRequirementIds = []

  for (const requirement of requirements) {
    const match = normalizeMatch(incomingById.get(requirement.id), requirement)
    match.requirement_id = requirement.id

    if (match.status === 'match' || match.status === 'partial') {
      if (!match.evidence || (match.evidence_source === 'cv' && !containsEvidenceQuote(sourceText, match.evidence)) || !evidenceSatisfiesRequirementAnchors(requirement, match.evidence)) {
        invalidRequirementIds.push(requirement.id)
        normalized.push({ ...match, invalidEvidence: true })
        continue
      }
    }
    if (match.status === 'gap') {
      match.evidence = null
    }
    normalized.push(match)
  }

  return { matches: normalized, invalidRequirementIds }
}

function removeInvalidMarker(match) {
  const { invalidEvidence, ...clean } = match
  return clean
}

function mergeRetryMatches(firstPass, retryPass, invalidRequirementIds, requirements, sourceText, outputLanguage = 'spanish') {
  const retryById = new Map(retryPass.map((match) => [match.requirement_id, match]))
  return firstPass.map((match) => {
    if (!invalidRequirementIds.includes(match.requirement_id)) return removeInvalidMarker(match)
    const requirement = requirements.find((item) => item.id === match.requirement_id)
    const retry = retryById.get(match.requirement_id)
    if (retry && (retry.status === 'gap' || (retry.evidence && containsEvidenceQuote(sourceText, retry.evidence) && evidenceSatisfiesRequirementAnchors(requirement, retry.evidence)))) {
      return removeInvalidMarker(retry)
    }
    return gapMatch(requirement, outputLanguage)
  })
}

export function buildRequirementExtractionPrompt(outputLanguage = 'spanish') {
  const languageName = outputLanguage === 'spanish' ? 'Spanish' : 'English'
  return `You extract job vacancy requirements for RevisaMiCV. Return ${languageName} notes only when needed, but keep requirement text faithful to the vacancy.

Return ONLY valid JSON with this exact shape:
{
  "vacancy_title": "string",
  "requirements": [
    {
      "id": "r1",
      "text": "requirement from the job post",
      "type": "must_have" | "nice_to_have",
      "category": "experience" | "hard_skill" | "soft_skill" | "education" | "language" | "title_seniority" | "logistics",
      "weight": number
    }
  ]
}

Rules:
- must_have = explicitly required, mandatory, minimum, disqualifying, required language level, degree, years of experience, location/work mode, work authorization, or clearly needed seniority.
- Everything else is nice_to_have.
- Default weights: must_have=3, nice_to_have=1, title_seniority=2. Use these unless the vacancy strongly emphasizes a requirement.
- Split bundled requirements into separate rows when they can be evaluated separately.
- Use stable ids r1, r2, r3 in priority order.
- Do not invent requirements not present in the vacancy.`
}

export function buildEvidenceMatchingPrompt(outputLanguage = 'spanish') {
  const languageName = outputLanguage === 'spanish' ? 'Spanish' : 'English'
  return `You match a CV against a frozen requirements table for RevisaMiCV.

Return ONLY valid JSON with this exact shape:
{
  "matches": [
    {
      "requirement_id": "r1",
      "status": "match" | "partial" | "gap",
      "evidence": "exact quote from the CV text, or null",
      "evidence_source": "cv",
      "note": "short explanation in ${languageName}"
    }
  ]
}

Hard rules:
- Return one match for EVERY requirement id.
- status=match or status=partial REQUIRES an exact quote copied from the CV text in evidence.
- Do not paraphrase evidence. Copy the shortest exact CV span that proves the status.
- status=gap must have evidence=null.
- Before declaring gap, explicitly search ES↔EN equivalents, word variants, and common synonyms (e.g. "gestión de proyectos" ↔ "project management").
- evidence_source must be "cv" in this phase. "user_declared" is reserved for later user gap-recovery.
- Write notes in ${languageName} using document-centric framing: refer to "the CV" (not "your experience" / "tu experiencia" / "su experiencia"). The note describes what the document shows or does not show.
- Never invent experience, employers, titles, tools, education, languages, metrics, or certifications.`
}

export async function extractStructuredRequirements({ jobDescription, outputLanguage, createJsonCompletion, weightConfig = MATCHING_WEIGHT_CONFIG }) {
  const completion = await createJsonCompletion(
    buildRequirementExtractionPrompt(outputLanguage),
    `Target job vacancy:\n\n${String(jobDescription || '').slice(0, 9000)}`,
    { task: 'requirements_extraction', temperature: 0.2, maxTokens: 3500 }
  )
  const parsed = parseJsonCompletion(completion.text || '{}')
  return {
    requirements: normalizeRequirementWeights(parsed.requirements, weightConfig),
    vacancy_title: typeof parsed.vacancy_title === 'string' ? parsed.vacancy_title.trim() : '',
    llm_model: completion.model,
  }
}

export async function runEvidenceMatchingWithValidation({ cvText, requirements, outputLanguage, createJsonCompletion }) {
  const normalizedRequirements = normalizeRequirementWeights(requirements)
  const buildUserPrompt = (onlyIds = null) => {
    const reqs = onlyIds ? normalizedRequirements.filter((req) => onlyIds.includes(req.id)) : normalizedRequirements
    return JSON.stringify({
      cvText: String(cvText || '').slice(0, 14000),
      requirements: reqs,
    })
  }

  const firstCompletion = await createJsonCompletion(
    buildEvidenceMatchingPrompt(outputLanguage),
    buildUserPrompt(),
    { task: 'evidence_matching', temperature: 0.2, maxTokens: 4500 }
  )
  const firstParsed = parseJsonCompletion(firstCompletion.text || '{}')
  const first = validateMatches(firstParsed.matches, normalizedRequirements, cvText, outputLanguage)

  if (!first.invalidRequirementIds.length) {
    return { matches: first.matches.map(removeInvalidMarker), llm_model: firstCompletion.model }
  }

  const retryCompletion = await createJsonCompletion(
    `${buildEvidenceMatchingPrompt(outputLanguage)}\n\nYou are correcting invalid evidence. For match/partial, evidence MUST be an exact substring from the CV. If no exact quote exists, return gap.`,
    buildUserPrompt(first.invalidRequirementIds),
    { task: 'evidence_matching', temperature: 0.1, maxTokens: 2200 }
  )
  const retryParsed = parseJsonCompletion(retryCompletion.text || '{}')
  const retryRequirements = normalizedRequirements.filter((req) => first.invalidRequirementIds.includes(req.id))
  const retry = validateMatches(retryParsed.matches, retryRequirements, cvText, outputLanguage)

  return {
    matches: mergeRetryMatches(first.matches, retry.matches, first.invalidRequirementIds, normalizedRequirements, cvText, outputLanguage),
    llm_model: retryCompletion.model || firstCompletion.model,
  }
}

export function computeDeterministicScore(requirements, matches) {
  const normalizedRequirements = normalizeRequirementWeights(requirements)
  const matchById = new Map(asArray(matches).map((match) => [match.requirement_id, match]))

  const computeFor = (filterFn) => {
    const filtered = normalizedRequirements.filter(filterFn)
    const denominator = filtered.reduce((sum, req) => sum + Number(req.weight || 0), 0)
    if (!denominator) return null
    const numerator = filtered.reduce((sum, req) => {
      const status = matchById.get(req.id)?.status || 'gap'
      return sum + req.weight * (STATUS_VALUE[status] ?? 0)
    }, 0)
    return Math.round((100 * numerator) / denominator)
  }

  const score = computeFor(() => true) ?? 0
  return {
    score,
    score_breakdown: {
      must_haves: computeFor((req) => req.type === 'must_have'),
      hard_skills: computeFor((req) => req.category === 'hard_skill'),
      soft_skills: computeFor((req) => req.category === 'soft_skill'),
      title_seniority: computeFor((req) => req.category === 'title_seniority'),
      other: computeFor((req) => !['hard_skill', 'soft_skill', 'title_seniority'].includes(req.category) && req.type !== 'must_have'),
    },
  }
}

export function applyStatusFloor(originalMatches, adaptedMatches, options = {}) {
  const originalCvText = options?.originalCvText || ''
  const adaptedById = new Map(asArray(adaptedMatches).map((match) => [match.requirement_id, match]))
  return asArray(originalMatches).map((original) => {
    const adapted = adaptedById.get(original.requirement_id) || original
    const originalRank = STATUS_RANK[original.status] ?? 0
    const adaptedRank = STATUS_RANK[adapted.status] ?? 0

    // Safety guard: Phase 1 has no user-declared gap recovery yet. If the
    // original CV had a true gap, the generated CV cannot upgrade it using a
    // newly invented phrase. Upgrades from gap are allowed only when the adapted
    // evidence is also grounded in the original CV text; Phase 2 can later allow
    // evidence_source='user_declared'.
    if (originalRank === 0 && adaptedRank > 0 && originalCvText && !containsEvidenceQuote(originalCvText, adapted.evidence)) {
      return {
        ...original,
        status: 'gap',
        evidence: null,
        evidence_source: 'cv',
        note: original.note || 'No se encontró evidencia en el CV original para subir este requisito.',
      }
    }

    if (adaptedRank >= originalRank) return adapted
    return { ...original, note: original.note || adapted.note || '' }
  }).map((match) => ({ ...match, status: RANK_STATUS[STATUS_RANK[match.status] ?? 0] }))
}

export function validateOptimizedCvOutput(cv) {
  if (!hasMeaningfulCvContent(cv)) {
    return { valid: false, reason: 'empty_or_not_meaningful' }
  }
  const text = cvToText(cv)
  if (normalizeText(text).length < MIN_GENERATED_CV_TEXT_LENGTH) {
    return { valid: false, reason: 'below_min_length' }
  }
  if (typeof cv === 'string') return { valid: normalizeText(cv).length >= MIN_GENERATED_CV_TEXT_LENGTH, reason: 'plain_text' }

  const hasSummary = typeof cv?.summary === 'string' && normalizeText(cv.summary).length >= 40
  const hasExperience = asArray(cv?.experience).some((role) => normalizeText(`${role?.title || ''} ${role?.company || ''} ${asArray(role?.bullets).join(' ')}`).length >= 40)
  const hasSkills = asArray(cv?.coreCompetencies).length || asArray(cv?.skills).length || asArray(cv?.technicalSkills).length
  const hasIdentity = Boolean(compactString(cv?.candidateName || cv?.targetTitle || cv?.headline))
  const missing = []
  if (!hasIdentity) missing.push('identity')
  if (!hasSummary) missing.push(REQUIRED_CV_SECTION_KEYS[0])
  if (!hasExperience) missing.push(REQUIRED_CV_SECTION_KEYS[1])
  if (!hasSkills) missing.push('skills')

  return missing.length ? { valid: false, reason: `missing_sections:${missing.join(',')}` } : { valid: true, reason: 'ok' }
}

export function applyUserDeclaredEvidenceUpgrades(requirements, matches, declarations) {
  const normalizedRequirements = normalizeRequirementWeights(requirements)
  const declarationById = new Map(normalizeUserDeclarations(declarations).map((item) => [item.requirement_id, item]))
  const originalById = new Map(asArray(matches).map((match) => [String(match?.requirement_id || ''), match]))

  return {
    declarations: Array.from(declarationById.values()),
    matches: normalizedRequirements.map((requirement) => {
      const original = normalizeMatch(originalById.get(requirement.id), requirement)
      original.requirement_id = requirement.id
      const declaration = declarationById.get(requirement.id)
      if (!declaration) return original

      const currentRank = STATUS_RANK[original.status] ?? 0
      const declaredRank = /^\s*s[ií]/i.test(declaration.option || '') ? 2 : 1
      const upgradedRank = Math.max(currentRank, declaredRank)
      return {
        ...original,
        status: RANK_STATUS[upgradedRank],
        evidence: declaration.detail,
        evidence_source: 'user_declared',
        note: 'Experiencia declarada por la persona usuaria en el paso Tu experiencia.',
      }
    }),
  }
}

export function buildUserDeclaredRevisionInstruction(declarations = []) {
  const normalized = normalizeUserDeclarations(declarations)
  if (!normalized.length) return ''
  const lines = normalized.map((item, index) => (
    `${index + 1}. Requirement: ${item.requirement_text || item.requirement_id}\nUser-declared evidence: ${item.detail}`
  ))
  return `Use this user-declared evidence to revise the CV for the target vacancy. It was declared by the person after seeing gaps in the document. Add it only as supported experience, keep it truthful, and do not add employers, dates, certifications, metrics, or tools that are not stated. Write all framing as document evidence: "tu CV no muestra" / "el CV puede agregar", never "no cumples" or "no tienes".\n\n${lines.join('\n\n')}`
}

export async function generateValidatedOptimizedCv({ cvText, jobDescription, outputLanguage, createJsonCompletion, buildOptimizerSystemPrompt, parseGeneratedJson = parseJsonCompletion }) {
  const userPrompt = `Real CV text:\n\n${String(cvText || '').substring(0, 10000)}\n\n---\n\nTarget job vacancy:\n\n${String(jobDescription || '').substring(0, 6000)}\n\n---\n\nSelected final CV language: ${outputLanguage}`
  let lastParsed = null
  let lastModel = ''

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const completion = await createJsonCompletion(
      buildOptimizerSystemPrompt(outputLanguage),
      attempt === 1 ? userPrompt : `${userPrompt}\n\nPrevious attempt returned an empty or incomplete CV. Regenerate a complete ATS CV JSON with all supported sections.`,
      { task: 'cv_generation', temperature: 0.25, maxTokens: 6000 }
    )
    lastModel = completion.model || lastModel
    lastParsed = parseGeneratedJson(completion.text || '{}')
    const optimizedCV = lastParsed.optimizedCV || lastParsed
    const validation = validateOptimizedCvOutput(optimizedCV)
    if (validation.valid) {
      return { parsed: lastParsed, optimizedCV, llm_model: lastModel, attempts: attempt }
    }
  }

  const error = new Error('generated_cv_invalid')
  error.code = 'generated_cv_invalid'
  error.parsed = lastParsed
  error.llm_model = lastModel
  throw error
}

export async function runMatchingEngineV2({ cvText, jobDescription, outputLanguage, createJsonCompletion, buildOptimizerSystemPrompt }) {
  const { requirements, vacancy_title, llm_model: requirementsModel } = await extractStructuredRequirements({ jobDescription, outputLanguage, createJsonCompletion })
  const originalMatch = await runEvidenceMatchingWithValidation({ cvText, requirements, outputLanguage, createJsonCompletion })
  const originalScore = computeDeterministicScore(requirements, originalMatch.matches)
  const generated = await generateValidatedOptimizedCv({ cvText, jobDescription, outputLanguage, createJsonCompletion, buildOptimizerSystemPrompt })
  const adaptedCvText = cvToText(generated.optimizedCV)
  const adaptedMatchRaw = await runEvidenceMatchingWithValidation({ cvText: adaptedCvText, requirements, outputLanguage, createJsonCompletion })
  const adaptedMatches = applyStatusFloor(originalMatch.matches, adaptedMatchRaw.matches, { originalCvText: cvText })
  const adaptedScore = computeDeterministicScore(requirements, adaptedMatches)

  return {
    ...generated.parsed,
    optimizedCV: generated.optimizedCV,
    vacancy_title,
    compatibilityScore: adaptedScore.score,
    original_score: originalScore.score,
    adapted_score: adaptedScore.score,
    score_breakdown: adaptedScore.score_breakdown,
    original_score_breakdown: originalScore.score_breakdown,
    requirements_table: requirements,
    original_match_results: originalMatch.matches,
    adapted_match_results: adaptedMatches,
    llm_model: [requirementsModel, originalMatch.llm_model, generated.llm_model, adaptedMatchRaw.llm_model].filter(Boolean).join(' | '),
  }
}
