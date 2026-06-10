/**
 * Cover letter generator for RevisaMiCV Phase 3.
 * Builds a short LinkedIn/portal message and a formal cover letter
 * from real matching evidence — never invents.
 */

/**
 * @param {Array} matchResults - adapted match results with status/evidence/note
 * @returns {Array} matched items sorted by weight then status
 */
function pickTopMatches(matchResults, requirementsTable, limit = 3) {
  const reqById = new Map()
  if (Array.isArray(requirementsTable)) {
    for (const req of requirementsTable) {
      if (req?.id) reqById.set(String(req.id), req)
    }
  }

  const matched = []
  for (const m of matchResults || []) {
    if (!m || (m.status !== 'match' && m.status !== 'partial')) continue
    if (!m.evidence || !String(m.evidence).trim()) continue
    const req = reqById.get(String(m.requirement_id)) || {}
    matched.push({
      requirementText: String(req.text || m.requirement_id || ''),
      evidence: String(m.evidence || '').trim(),
      status: m.status === 'match' ? 'match' : 'partial',
      type: req.type || 'must_have',
      weight: Number(req.weight || 0),
      evidenceSource: m.evidence_source === 'user_declared' ? 'user_declared' : 'cv',
    })
  }

  // Sort: match before partial, higher weight first
  matched.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'match' ? -1 : 1
    return (b.weight || 0) - (a.weight || 0)
  })

  return matched.slice(0, limit)
}

/**
 * Extract candidate name from optimized CV.
 * @param {object} cv
 * @returns {string}
 */
function candidateName(cv) {
  if (!cv || typeof cv !== 'object') return ''
  return String(cv.candidateName || cv.name || '').trim()
}

/**
 * Extract candidate target title or headline from CV.
 * @param {object} cv
 * @returns {string}
 */
function candidateRole(cv) {
  if (!cv || typeof cv !== 'object') return ''
  return String(cv.targetTitle || cv.headline || cv.title || '').trim()
}

const LABELS = {
  short: {
    subjectLine: { english: "Quick application", spanish: "Aplicación rápida" },
    greeting: { english: "Hi,", spanish: "Hola," },
    intro: {
      english: (name, role) => `I'm ${name}${role ? `, ${role}` : ''}. I'm applying because my experience directly matches what you're looking for.`,
      spanish: (name, role) => `Soy ${name}${role ? `, ${role}` : ''}. Aplico porque mi experiencia encaja directamente con lo que buscan.`,
    },
    evidencePrefix: {
      english: "Here's why:",
      spanish: "Te comparto por qué:",
    },
    evidenceBullet: {
      english: (req, evidence) => `• ${req}: ${evidence}`,
      spanish: (req, evidence) => `• ${req}: ${evidence}`,
    },
    closing: {
      english: "I'd love to chat more about how I can contribute. Thanks for considering!",
      spanish: "Me encantaría conversar más sobre cómo puedo aportar. ¡Gracias por considerar mi perfil!",
    },
    signoff: {
      english: (name) => `– ${name}`,
      spanish: (name) => `– ${name}`,
    },
  },
  formal: {
    subjectLine: {
      english: (role) => `Application for ${role || 'the position'}`,
      spanish: (role) => `Postulación a ${role || 'la vacante'}`,
    },
    greeting: {
      english: "Dear Hiring Team,",
      spanish: "Estimado equipo de selección,",
    },
    intro: {
      english: (name, role) => `I am writing to express my strong interest in the ${role || 'position'}. As a ${role || 'professional'} with direct experience in the areas you require, I believe my background aligns well with the role.`,
      spanish: (name, role) => `Me dirijo a ustedes para expresar mi interés en la posición de ${role || 'la vacante'}. Como profesional con experiencia directa en las áreas que requieren, creo que mi perfil encaja con lo que buscan.`,
    },
    evidenceIntro: {
      english: "My qualifications match several of your key requirements:",
      spanish: "Mi experiencia coincide con varios de los requisitos clave:",
    },
    evidenceParagraph: {
      english: (req, evidence) => `• ${req} — ${evidence}`,
      spanish: (req, evidence) => `• ${req} — ${evidence}`,
    },
    closing: {
      english: "I would welcome the opportunity to discuss how my experience can contribute to your team. Thank you for your time and consideration.",
      spanish: "Agradeceré la oportunidad de conversar sobre cómo mi experiencia puede aportar a su equipo. Quedo a su disposición para una entrevista.",
    },
    signoff: {
      english: (name) => `Sincerely,\n${name}`,
      spanish: (name) => `Atentamente,\n${name}`,
    },
  },
}

/**
 * Build a short application message (LinkedIn / portal style).
 * @param {object} options
 * @param {Array} options.matchResults
 * @param {Array} options.requirementsTable
 * @param {object} options.optimizedCV
 * @param {'english'|'spanish'} [options.language='spanish']
 * @returns {string}
 */
export function buildShortMessage({ matchResults, requirementsTable, optimizedCV, language = 'spanish' }) {
  const top = pickTopMatches(matchResults, requirementsTable, 3)
  const name = candidateName(optimizedCV) || 'el candidato'
  const role = candidateRole(optimizedCV)
  const lang = language === 'english' ? 'english' : 'spanish'
  const L = LABELS.short

  const lines = []
  lines.push(L.greeting[lang])
  lines.push('')
  lines.push(L.intro[lang](name, role))

  if (top.length > 0) {
    lines.push('')
    lines.push(L.evidencePrefix[lang])
    for (const t of top) {
      lines.push(L.evidenceBullet[lang](t.requirementText, t.evidence))
    }
  }

  lines.push('')
  lines.push(L.closing[lang])
  lines.push(L.signoff[lang](name))

  return lines.join('\n')
}

/**
 * Build a formal cover letter.
 * @param {object} options
 * @param {Array} options.matchResults
 * @param {Array} options.requirementsTable
 * @param {object} options.optimizedCV
 * @param {'english'|'spanish'} [options.language='spanish']
 * @returns {string}
 */
export function buildFormalLetter({ matchResults, requirementsTable, optimizedCV, language = 'spanish' }) {
  const top = pickTopMatches(matchResults, requirementsTable, 4)
  const name = candidateName(optimizedCV) || 'el candidato'
  const role = candidateRole(optimizedCV) || 'la posición'
  const lang = language === 'english' ? 'english' : 'spanish'
  const L = LABELS.formal

  const lines = []
  lines.push(L.subjectLine[lang](role))
  lines.push('')
  lines.push(L.greeting[lang])
  lines.push('')
  lines.push(L.intro[lang](name, role))

  if (top.length > 0) {
    lines.push('')
    lines.push(L.evidenceIntro[lang])
    for (const t of top) {
      lines.push(L.evidenceParagraph[lang](t.requirementText, t.evidence))
    }
  }

  lines.push('')
  lines.push(L.closing[lang])
  lines.push('')
  lines.push(L.signoff[lang](name))

  return lines.join('\n')
}

/**
 * Main entry point: build both cover letter formats.
 * @param {object} options
 * @returns {{ shortMessage: string, formalLetter: string }}
 */
export function buildCoverLetters(options) {
  return {
    shortMessage: buildShortMessage(options),
    formalLetter: buildFormalLetter(options),
  }
}
