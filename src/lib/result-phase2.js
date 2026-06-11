const SCORE_LABELS = {
  must_haves: 'Requisitos obligatorios',
  hard_skills: 'Skills técnicas / herramientas',
  soft_skills: 'Skills blandas',
  title_seniority: 'Título y seniority',
  other: 'Otros requisitos',
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function normalizeStatus(status) {
  return ['match', 'partial', 'gap'].includes(status) ? status : 'gap'
}

const STATUS_VALUE = { gap: 0, partial: 0.5, match: 1 }
const DEFAULT_WEIGHT_BY_TYPE = { must_have: 3, nice_to_have: 1 }
const DEFAULT_WEIGHT_BY_CATEGORY = { title_seniority: 2 }

function getRequirementWeight(requirement = {}) {
  const numeric = Number(requirement?.weight)
  if (Number.isFinite(numeric) && numeric > 0) return numeric
  if (DEFAULT_WEIGHT_BY_CATEGORY[requirement?.category]) return DEFAULT_WEIGHT_BY_CATEGORY[requirement.category]
  return DEFAULT_WEIGHT_BY_TYPE[requirement?.type] || DEFAULT_WEIGHT_BY_TYPE.nice_to_have
}

function computeProjectedScore(requirements = [], matches = [], flippedRequirementId = '') {
  const normalizedRequirements = Array.isArray(requirements) ? requirements : []
  const matchById = new Map((Array.isArray(matches) ? matches : []).map((match) => [String(match?.requirement_id || ''), match]))
  const denominator = normalizedRequirements.reduce((sum, requirement) => sum + getRequirementWeight(requirement), 0)
  if (!denominator) return undefined
  const numerator = normalizedRequirements.reduce((sum, requirement) => {
    const id = String(requirement?.id || '')
    const weight = getRequirementWeight(requirement)
    const currentStatus = normalizeStatus(matchById.get(id)?.status)
    const projectedStatus = id === String(flippedRequirementId || '') ? 'match' : currentStatus
    return sum + weight * (STATUS_VALUE[projectedStatus] ?? 0)
  }, 0)
  return Math.max(0, Math.min(100, Math.round((100 * numerator) / denominator)))
}

function getTone(score) {
  if (score >= 85) return 'strong'
  if (score >= 70) return 'good'
  if (score >= 55) return 'medium'
  return 'weak'
}

export function sanitizeDocumentFraming(copy = '') {
  return cleanText(copy)
    .replace(/\bno cumples\b/gi, 'tu CV no muestra')
    .replace(/\bno tienes\b/gi, 'tu CV no muestra')
    .replace(/\bte falta\b/gi, 'tu CV no muestra')
    .replace(/\bcareces de\b/gi, 'tu CV no muestra')
}

export function buildScoreBreakdownRows(scoreBreakdown = {}) {
  if (!scoreBreakdown || typeof scoreBreakdown !== 'object') return []
  return Object.entries(scoreBreakdown)
    .map(([key, value]) => {
      if (value === null || value === undefined || value === '') return null
      const numeric = typeof value === 'number' ? value : Number(value)
      if (!Number.isFinite(numeric)) return null
      const score = Math.max(0, Math.min(100, Math.round(numeric)))
      return {
        key,
        label: SCORE_LABELS[key] || key.replace(/_/g, ' '),
        score,
        tone: getTone(score),
      }
    })
    .filter(Boolean)
}

function indexMatches(matches = []) {
  return new Map((Array.isArray(matches) ? matches : []).map((match) => [String(match?.requirement_id || ''), match]))
}

function quoteEvidence(evidence) {
  const clean = cleanText(evidence)
  return clean ? `“${clean}”` : ''
}

function statusCopy(status, source = 'cv') {
  const normalized = normalizeStatus(status)
  if (source === 'user_declared' && normalized !== 'gap') return 'Lo agregaste como experiencia real declarada.'
  if (normalized === 'match') return 'Tu CV muestra esto.'
  if (normalized === 'partial') return 'Tu CV muestra esto parcialmente.'
  return 'Tu CV no muestra esto todavía.'
}

export function buildKeyRequirementRows(requirements = [], matches = [], limit = 8) {
  const byId = indexMatches(matches)
  return (Array.isArray(requirements) ? requirements : [])
    .map((requirement) => {
      const match = byId.get(String(requirement?.id || '')) || {}
      const status = normalizeStatus(match.status)
      return {
        id: String(requirement?.id || match.requirement_id || ''),
        requirement: cleanText(requirement?.text || 'Requisito de la vacante'),
        type: requirement?.type === 'must_have' ? 'must_have' : 'nice_to_have',
        type_label: requirement?.type === 'must_have' ? 'Obligatorio' : 'Deseable',
        category: cleanText(requirement?.category || 'other'),
        status,
        evidence_source: match.evidence_source === 'user_declared' ? 'user_declared' : 'cv',
        quote: quoteEvidence(match.evidence),
        copy: statusCopy(status, match.evidence_source),
        note: sanitizeDocumentFraming(match.note || ''),
      }
    })
    .sort((a, b) => {
      const typeOrder = { must_have: 0, nice_to_have: 1 }
      return (typeOrder[a.type] - typeOrder[b.type])
    })
    .slice(0, limit)
}

function isNegativeAnswer(value = '') {
  return /^\s*(no|no tengo|no aplica|ninguno|ninguna|n\/a)\b/i.test(String(value || ''))
}

export function getQuestionProjectedLift(requirements = [], matches = [], requirementId = '') {
  return computeProjectedScore(requirements, matches, requirementId)
}

export function buildGapRecoveryQuestions(requirements = [], matches = [], limit = 5) {
  const rows = buildKeyRequirementRows(requirements, matches, Number.MAX_SAFE_INTEGER)
  return rows
    .filter((row) => row.status === 'gap' || row.status === 'partial')
    .slice(0, limit)
    .map((row) => ({
      requirement_id: row.id,
      requirement_text: row.requirement,
      question: `La vacante pide ${row.requirement}. ¿Tienes experiencia real con esto?`,
      options: ['Sí, la tengo', 'Tengo algo básico', 'No'],
      freeTextLabel: 'Agrega una línea opcional: proyecto, herramienta, curso, responsabilidad, tiempo, resultado o contexto verificable.',
      current_status: row.status,
      projected_lift: computeProjectedScore(requirements, matches, row.id),
    }))
}

export function normalizeUserDeclarations(answers = []) {
  return (Array.isArray(answers) ? answers : [])
    .map((answer) => ({
      requirement_id: cleanText(answer?.requirement_id),
      requirement_text: cleanText(answer?.requirement_text),
      option: cleanText(answer?.option),
      detail: cleanText(answer?.detail),
    }))
    .filter((answer) => answer.requirement_id && answer.detail.length >= 20 && !isNegativeAnswer(answer.option) && !isNegativeAnswer(answer.detail))
}
