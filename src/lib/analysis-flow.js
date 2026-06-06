const QUESTION_DECISIONS = new Set(['needs_clarification', 'optimize_with_caution', 'not_recommended'])

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function normalizeQuestions(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim()
      if (item && typeof item === 'object') return String(item.question || '').trim()
      return ''
    })
    .filter(Boolean)
    .slice(0, 3)
}

function scoreOf(result) {
  const score = Number(result?.revisedCompatibilityScore ?? result?.compatibilityScore)
  if (!Number.isFinite(score)) return 0
  return Math.max(0, Math.min(100, Math.round(score)))
}

export function createAnalysisDraftKey(email) {
  return `revisamicv:analysis-draft:${normalizeEmail(email) || 'anonymous'}`
}

export function shouldShowEvidenceQuestions(result) {
  const questions = normalizeQuestions(result?.clarificationQuestions)
  const decision = result?.applicationDecision
  if (questions.length && QUESTION_DECISIONS.has(decision)) return true
  return scoreOf(result) < 60 && decision !== 'optimize'
}

export function getEvidenceStepState(result) {
  const score = scoreOf(result)
  const needsQuestions = shouldShowEvidenceQuestions(result)
  if (score >= 80) {
    return {
      level: 'strong',
      title: 'Tu CV ya muestra buena evidencia para esta vacante.',
      needsQuestions: false,
    }
  }
  if (score >= 60) {
    return {
      level: 'useful',
      title: 'Hay buen potencial, pero tu CV puede contar mejor tu experiencia.',
      needsQuestions,
    }
  }
  if (score >= 40) {
    return {
      level: 'incomplete',
      title: 'Hay señales útiles, pero falta contexto.',
      needsQuestions: true,
    }
  }
  if (score >= 20) {
    return {
      level: 'weak',
      title: 'Tu CV todavía no muestra suficiente evidencia para esta vacante.',
      needsQuestions: true,
    }
  }
  return {
    level: 'thin',
    title: 'Esta vacante parece lejana a lo que tu CV muestra hoy.',
    needsQuestions: true,
  }
}
