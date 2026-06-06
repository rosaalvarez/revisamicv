const EVIDENCE_BANDS = [
  {
    level: 'thin',
    min: 0,
    max: 19,
    label: 'Evidencia insuficiente con lo visible',
    shortLabel: 'Insuficiente',
    title: 'Esta vacante parece lejana a lo que tu CV muestra hoy.',
    description: 'Necesitamos más contexto real antes de adaptar sin inventar.',
    color: 'bg-red-500',
  },
  {
    level: 'weak',
    min: 20,
    max: 39,
    label: 'Evidencia débil',
    shortLabel: 'Débil',
    title: 'Tu CV todavía no muestra suficiente evidencia para esta vacante.',
    description: 'Puede haber experiencia transferible, pero todavía no se ve clara.',
    color: 'bg-orange-500',
  },
  {
    level: 'incomplete',
    min: 40,
    max: 59,
    label: 'Falta contexto',
    shortLabel: 'Contexto',
    title: 'Hay señales útiles, pero falta contexto.',
    description: 'Tu CV muestra parte del encaje; unas respuestas pueden mejorar mucho la adaptación.',
    color: 'bg-amber-400',
  },
  {
    level: 'useful',
    min: 60,
    max: 79,
    label: 'Evidencia útil',
    shortLabel: 'Útil',
    title: 'Hay buen potencial, pero tu CV puede contar mejor tu experiencia.',
    description: 'La base existe; el trabajo es enfocar keywords, logros y lenguaje.',
    color: 'bg-[var(--color-secondary)]',
  },
  {
    level: 'strong',
    min: 80,
    max: 100,
    label: 'Evidencia fuerte',
    shortLabel: 'Fuerte',
    title: 'Tu CV ya muestra buena evidencia para esta vacante.',
    description: 'El CV tiene buena base; ahora lo hacemos más claro y alineado.',
    color: 'bg-[var(--color-secondary-deep)]',
  },
]

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
    .slice(0, 4)
}

function scoreOf(result) {
  const score = Number(result?.revisedCompatibilityScore ?? result?.compatibilityScore)
  if (!Number.isFinite(score)) return 0
  return Math.max(0, Math.min(100, Math.round(score)))
}

export function createAnalysisDraftKey(email) {
  return `revisamicv:analysis-draft:${normalizeEmail(email) || 'anonymous'}`
}

export function getEvidenceThermometer(result) {
  const score = scoreOf(result)
  const activeBand = EVIDENCE_BANDS.find((band) => score >= band.min && score <= band.max) || EVIDENCE_BANDS[0]
  return {
    score,
    activeLevel: activeBand.level,
    title: activeBand.title,
    description: activeBand.description,
    explainer: 'Este score no mide tu valor profesional. Mide qué tan bien tu CV actual demuestra evidencia para esta vacante específica.',
    bands: EVIDENCE_BANDS.map((band) => ({ ...band, active: band.level === activeBand.level })),
  }
}

export function shouldShowEvidenceQuestions(result) {
  const questions = normalizeQuestions(result?.clarificationQuestions)
  const decision = result?.applicationDecision
  if (questions.length && QUESTION_DECISIONS.has(decision)) return true
  return scoreOf(result) < 60 && decision !== 'optimize'
}

export function getResultWizardSteps(result, options = {}) {
  const score = scoreOf(result)
  const needsContext = shouldShowEvidenceQuestions(result)
  const canDownloadCv = Boolean(options.canDownloadCv)
  const contextComplete = Boolean(options.contextComplete) || !needsContext || score >= 80
  return [
    {
      id: 'evidence',
      number: 1,
      label: 'Compatibilidad',
      title: 'Tu encaje',
      status: 'completed',
      disabled: false,
    },
    {
      id: 'context',
      number: 2,
      label: 'Tu experiencia',
      title: score >= 80 ? 'Opcional' : 'Afina evidencia',
      status: needsContext && !contextComplete ? 'current' : score >= 80 ? 'optional' : 'completed',
      disabled: false,
      optional: score >= 80,
    },
    {
      id: 'cv',
      number: 3,
      label: 'Revisar y descargar',
      title: 'Tu CV',
      status: canDownloadCv && contextComplete ? 'current' : 'pending',
      disabled: !canDownloadCv || !contextComplete,
    },
  ]
}

export function getInitialResultStep(result, options = {}) {
  const score = scoreOf(result)
  const canDownloadCv = Boolean(options.canDownloadCv)
  if (score >= 80 && canDownloadCv) return 'cv'
  return 'evidence'
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
