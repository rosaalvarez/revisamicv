export function clampScore(value) {
  if (value === null || value === undefined || value === '') return null
  const score = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(score)) return null
  return Math.max(0, Math.min(100, Math.round(score)))
}

export function getSmartPackDefault(lifetimeAnalyses = 0) {
  return Number(lifetimeAnalyses || 0) >= 5 ? 'pro' : 'basic'
}

export function shouldShowLastCreditNotice({ credits, moment }) {
  return moment === 'analysis_start' && Number(credits) === 1
}

export function buildDashboardDeltaLabel(item = {}) {
  const original = clampScore(item.original_score)
  const adapted = clampScore(item.adapted_score ?? item.compatibility_score)
  if (original !== null && adapted !== null) return `${original} → ${adapted}`
  if (adapted !== null) return String(adapted)
  if (original !== null) return String(original)
  return '—'
}

export function stripJobMarkdown(value = '') {
  return String(value || '')
    .replace(/\*\*/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/[`_>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function getAnalysisTitleFromPreview(jobPreview = '') {
  const clean = stripJobMarkdown(jobPreview)
  if (!clean) return 'Vacante analizada'
  const firstPart = clean.split(/\s{2,}|\s[-–—]\s|\s\|\s/)[0]?.trim() || clean
  const companyRole = firstPart.match(/^([^:]{2,60}):\s*(.{2,80})$/)
  if (companyRole) return `${companyRole[2].trim()} · ${companyRole[1].trim()}`.slice(0, 92)
  return clean
    .replace(/\b(Location|Ubicación|Commitment|Tipo|Full-time|Part-time|Remote|Remoto):?.*$/i, '')
    .trim()
    .slice(0, 92) || 'Vacante analizada'
}

export function getVacancyTitle(item = {}) {
  const explicit = String(item.vacancy_title || item.vacancyTitle || '').trim()
  if (explicit) return explicit.slice(0, 92)
  const cv = item.optimized_cv || item.optimizedCV || {}
  const target = String(cv?.targetTitle || cv?.headline || '').trim()
  if (target) return target.slice(0, 92)
  return getAnalysisTitleFromPreview(item.job_preview || item.jobDescription || item.job_description || '')
}

export function shouldSuppressFollowupSequence(sequence = {}, analyses = []) {
  const sequenceAnalysisId = String(sequence.analysis_id || '')
  const createdAt = Date.parse(sequence.created_at || sequence.analysis_created_at || '') || 0
  return analyses.some((analysis) => {
    if (sequenceAnalysisId && String(analysis.id || '') === sequenceAnalysisId) return false
    const analysisTime = Date.parse(analysis.created_at || '') || 0
    return analysisTime > createdAt
  })
}

export function getStoredAnalysisCount(storage) {
  if (!storage) return 0
  const value = Number(storage.getItem('revisamicv_lifetime_analyses') || 0)
  return Number.isFinite(value) ? Math.max(0, value) : 0
}

export function incrementStoredAnalysisCount(storage) {
  if (!storage) return 0
  const next = getStoredAnalysisCount(storage) + 1
  storage.setItem('revisamicv_lifetime_analyses', String(next))
  return next
}
