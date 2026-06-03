const RISKY_REVISION_TERMS = [
  'forzar',
  'fuerza',
  'subirlo a',
  'sube el score',
  'subir el score',
  '75%',
  '80%',
  '90%',
  'hazlo parecer',
  'hacer parecer',
  'agrega experiencia',
  'añade experiencia',
  'invent',
  'certificación',
  'certificacion',
  'años de experiencia',
  'ux/ui',
  'ux ui',
]

export function buildRiskyRevisionPrompt(instruction = '') {
  const normalized = String(instruction || '').toLowerCase()
  const isRisky = RISKY_REVISION_TERMS.some((term) => normalized.includes(term))
  if (!isRisky) return null

  return {
    question: 'Para ayudarte sin convertir esto en un dolor de cabeza: ¿cómo quieres que ajustemos esta parte?',
    options: [
      'Reformular solo experiencia real que ya está en mi CV',
      'Quiero agregar contexto real que puedo respaldar',
      'Muéstrame una alternativa más segura para esta vacante',
    ],
    freeTextLabel: 'Si tienes contexto real adicional, escríbelo aquí. Ej: proyecto, curso, herramienta, logro o evidencia concreta.',
  }
}

export function coachBlockedChange(message = '') {
  const raw = String(message || '').trim()
  if (!raw) {
    return 'Para cuidar tu credibilidad, no agregué información que no esté respaldada. Sí puedo ayudarte a presentar mejor tu experiencia real.'
  }

  return `Para cuidar tu credibilidad, dejé esta parte como recomendación en vez de agregarla al CV: ${raw
    .replace(/no puedo/gi, 'no agregué')
    .replace(/no se puede/gi, 'no agregué')
    .replace(/inventar/gi, 'sumar información no respaldada')}. Sí puedo ayudarte a reforzar experiencia real relacionada.`
}

function textValue(value) {
  if (Array.isArray(value)) return value.map(textValue).join(' ')
  if (value && typeof value === 'object') return Object.values(value).map(textValue).join(' ')
  return String(value || '').trim()
}

function normalizeList(value) {
  return Array.from(new Set((Array.isArray(value) ? value : [])
    .map((item) => String(item || '').trim())
    .filter(Boolean)))
}

function collectSkills(cv = {}) {
  return normalizeList([
    ...(cv.coreCompetencies || []),
    ...(cv.skills || []),
    ...(cv.technicalSkills || []),
    ...(cv.tools || []),
  ])
}

function bulletCount(cv = {}) {
  const experience = Array.isArray(cv.experience) ? cv.experience : []
  return experience.reduce((total, item) => total + (Array.isArray(item?.bullets) ? item.bullets.length : 0), 0)
}

export function summarizeCvChanges(beforeCv = {}, afterCv = {}) {
  const changes = []

  const beforeTitle = textValue(beforeCv.targetTitle || beforeCv.headline)
  const afterTitle = textValue(afterCv.targetTitle || afterCv.headline)
  if (beforeTitle && afterTitle && beforeTitle !== afterTitle) {
    changes.push({ label: 'Título objetivo ajustado', detail: `Ahora apunta a: ${afterTitle}` })
  }

  const beforeSummary = textValue(beforeCv.summary || beforeCv.profile)
  const afterSummary = textValue(afterCv.summary || afterCv.profile)
  if (beforeSummary && afterSummary && beforeSummary !== afterSummary) {
    changes.push({ label: 'Perfil profesional reescrito', detail: 'Se alineó el resumen con la vacante sin agregar experiencia no respaldada.' })
  }

  const beforeSkills = new Set(collectSkills(beforeCv).map((skill) => skill.toLowerCase()))
  const addedSkills = collectSkills(afterCv).filter((skill) => !beforeSkills.has(skill.toLowerCase()))
  if (addedSkills.length) {
    changes.push({ label: 'Keywords añadidas', detail: addedSkills.slice(0, 6).join(', ') })
  }

  if (bulletCount(afterCv) > bulletCount(beforeCv) || textValue(beforeCv.experience) !== textValue(afterCv.experience)) {
    changes.push({ label: 'Experiencia reforzada', detail: 'Se ajustaron bullets para conectar mejor tu experiencia real con la vacante.' })
  }

  return changes.slice(0, 6)
}
