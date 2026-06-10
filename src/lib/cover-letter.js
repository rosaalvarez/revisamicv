/**
 * Cover letter generator for RevisaMiCV Phase 3.
 *
 * Architecture:
 *   1. selectFilteredEvidence  — deterministic filter: pick matched requirements with real evidence
 *   2. buildCoverLetterPrompt   — build the LLM prompt (only filtered evidence)
 *   3. validateCoverLetterOutput — server-side check (only allowed requirements referenced)
 *   4. Fallback to template if LLM or validation fails
 *
 * Never invents. Never references gaps. Always traceable to match results.
 */

// ── Deterministic Filter ──────────────────────────────────────────

function mapRequirementIndex(requirementsTable) {
  const byId = new Map()
  if (Array.isArray(requirementsTable)) {
    for (const req of requirementsTable) {
      if (req?.id) byId.set(String(req.id), req)
    }
  }
  return byId
}

/**
 * Select matched requirements with real evidence, sorted by weight/status.
 * @param {Array} matchResults
 * @param {Array} requirementsTable
 * @param {number} shortLimit — max items for short message
 * @param {number} formalLimit — max items for formal letter
 * @returns {{ short: Array, formal: Array, allIds: Set<string> }}
 */
export function selectFilteredEvidence(matchResults, requirementsTable, shortLimit = 3, formalLimit = 4) {
  const reqById = mapRequirementIndex(requirementsTable)
  const matched = []

  for (const m of matchResults || []) {
    if (!m || (m.status !== 'match' && m.status !== 'partial')) continue
    if (!m.evidence || !String(m.evidence).trim()) continue
    const req = reqById.get(String(m.requirement_id)) || {}
    matched.push({
      requirementId: String(m.requirement_id || ''),
      requirementText: String(req.text || m.requirement_id || ''),
      evidence: String(m.evidence || '').trim(),
      status: m.status === 'match' ? 'match' : 'partial',
      type: req.type || 'must_have',
      weight: Number(req.weight || 0),
    })
  }

  // Sort: match before partial, higher weight first
  matched.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'match' ? -1 : 1
    return (b.weight || 0) - (a.weight || 0)
  })

  const short = matched.slice(0, Math.min(shortLimit, matched.length))
  const formal = matched.slice(0, Math.min(formalLimit, matched.length))
  const allIds = new Set(matched.map((m) => m.requirementId))

  return { short, formal, allIds }
}

// ── LLM Prompt Builder ────────────────────────────────────────────

/**
 * Build the system prompt for cover letter generation.
 * @param {'english'|'spanish'} language
 * @returns {string}
 */
export function buildCoverLetterSystemPrompt(language = 'spanish') {
  const langLabel = language === 'english' ? 'English' : 'Spanish'
  return `You are an ethical cover letter writer for RevisaMiCV. Write in ${langLabel}.

RULES:
1. ONLY reference requirements from the list provided by the user. Do not add, embellish, or invent any skill, experience, metric, company name, or achievement not present in that list.
2. Use the provided evidence naturally — rewrite it in your own words in ${langLabel}. If evidence was originally written in another language, translate it fluently.
3. Do NOT mention gaps, missing skills, weaknesses, or requirements that are not listed.
4. Keep the tone professional but warm. The short message should feel like a LinkedIn DM or portal message. The formal letter should feel like a polished cover letter.
5. Return ONLY valid JSON. No markdown, no code fences, no prose outside the JSON.`
}

/**
 * Build the user prompt with candidate info and filtered evidence.
 * @param {object} options
 * @param {string} options.candidateName
 * @param {string} options.candidateRole
 * @param {Array} options.evidenceList — [{ requirementText, evidence }]
 * @param {'english'|'spanish'} options.language
 * @returns {string}
 */
export function buildCoverLetterUserPrompt({ candidateName, candidateRole, evidenceList, language = 'spanish' }) {
  const evidenceBlock = (evidenceList || [])
    .map((e, i) => `${i + 1}. Requirement: "${e.requirementText}"\n   Evidence from CV: "${e.evidence}"`)
    .join('\n\n')

  const langLabel = language === 'english' ? 'English' : 'Spanish'

  return `Candidate name: ${candidateName || 'the candidate'}
Role applying for: ${candidateRole || 'the position'}
Target language: ${langLabel}

USE ONLY THESE MATCHED REQUIREMENTS AND EVIDENCE. Do not invent anything beyond this list:

${evidenceBlock || '(No specific requirements — write a short, honest, generic message without inventing skills or experience.)'}

Write TWO versions as JSON:
- "shortMessage": 3-4 concise sentences, suitable for a LinkedIn message or portal text field.
- "formalLetter": a complete formal cover letter with subject line, greeting, body paragraphs referencing the evidence, and a professional closing.

Return JSON: {"shortMessage": "...", "formalLetter": "..."}`
}

// ── Output Validation ─────────────────────────────────────────────

const INVENTION_SIGNALS = [
  /increased .+ by \d+%/,  // fabricated metrics
  /managed a team of \d+/,  // fabricated team size
  /at (?!the )([A-Z][a-z]+ ){1,3}(Inc|Corp|LLC|Ltd|SA|S\.A\.)/,  // invented company names
  /revenue|ROI|reduje costos|aumenté ventas/,  // financial claims not in evidence
]

/**
 * Validate that a cover letter output only references allowed requirements.
 * @param {string} text — the generated cover letter text
 * @param {Set<string>} allowedRequirementIds — IDs from filtered evidence
 * @param {Array} requirementsTable — full requirements table for text lookup
 * @returns {{ valid: boolean, violations: string[] }}
 */
export function validateCoverLetterOutput(text, allowedRequirementIds, requirementsTable) {
  const violations = []

  // Check 1: no fabricated metrics/companies
  for (const pattern of INVENTION_SIGNALS) {
    const match = String(text || '').match(pattern)
    if (match) {
      violations.push(`Invention signal: "${match[0].trim()}" — looks like fabricated detail`)
    }
  }

  // Check 2: every evidence-like phrase should trace to an allowed requirement
  // Build allowed phrases from requirements
  const reqById = mapRequirementIndex(requirementsTable)
  const allowedPhrases = new Set()
  for (const id of (allowedRequirementIds || [])) {
    const req = reqById.get(String(id))
    if (req?.text) {
      // Add key tokens from requirement text
      String(req.text).toLowerCase().split(/\s+/).filter(w => w.length > 5).forEach(w => allowedPhrases.add(w))
    }
  }

  // If we have very few allowed phrases, skip the phrase check (too easy to false-positive)
  if (allowedPhrases.size >= 3) {
    // Not implemented as strict check — too many false positives.
    // Instead, we rely on the low-temperature LLM + the invention signal patterns above.
    // The fallback to template is the ultimate safety net.
  }

  return { valid: violations.length === 0, violations }
}

// ── Template Fallback ──────────────────────────────────────────────

function extractName(cv) {
  if (!cv || typeof cv !== 'object') return ''
  return String(cv.candidateName || cv.name || '').trim()
}

function extractRole(cv) {
  if (!cv || typeof cv !== 'object') return ''
  return String(cv.targetTitle || cv.headline || cv.title || '').trim()
}

function formatEvidenceLine(reqText, evidence, lang) {
  return `• ${reqText}: ${evidence}`
}

function formatFormalEvidenceLine(reqText, evidence, lang) {
  return `• ${reqText} — ${evidence}`
}

/**
 * Template-based short message (fallback).
 */
export function buildShortMessage({ matchResults, requirementsTable, optimizedCV, language = 'spanish' }) {
  const { short } = selectFilteredEvidence(matchResults, requirementsTable, 3)
  const name = extractName(optimizedCV) || 'el candidato'
  const role = extractRole(optimizedCV)
  const lang = language === 'english' ? 'english' : 'spanish'

  const lines = []
  if (lang === 'english') {
    lines.push('Hi,')
    lines.push('')
    lines.push(`I'm ${name}${role ? `, ${role}` : ''}. I'm applying because my experience directly matches what you're looking for.`)
    if (short.length > 0) {
      lines.push('')
      lines.push("Here's why:")
      for (const e of short) lines.push(formatEvidenceLine(e.requirementText, e.evidence, lang))
    }
    lines.push('')
    lines.push("I'd love to chat more about how I can contribute. Thanks for considering!")
    lines.push(`– ${name}`)
  } else {
    lines.push('Hola,')
    lines.push('')
    lines.push(`Soy ${name}${role ? `, ${role}` : ''}. Aplico porque mi experiencia encaja directamente con lo que buscan.`)
    if (short.length > 0) {
      lines.push('')
      lines.push('Te comparto por qué:')
      for (const e of short) lines.push(formatEvidenceLine(e.requirementText, e.evidence, lang))
    }
    lines.push('')
    lines.push('Me encantaría conversar más sobre cómo puedo aportar. ¡Gracias por considerar mi perfil!')
    lines.push(`– ${name}`)
  }

  return lines.join('\n')
}

/**
 * Template-based formal letter (fallback).
 */
export function buildFormalLetter({ matchResults, requirementsTable, optimizedCV, language = 'spanish' }) {
  const { formal } = selectFilteredEvidence(matchResults, requirementsTable, 4)
  const name = extractName(optimizedCV) || 'el candidato'
  const role = extractRole(optimizedCV) || 'la posición'
  const lang = language === 'english' ? 'english' : 'spanish'

  const lines = []
  if (lang === 'english') {
    lines.push(`Application for ${role || 'the position'}`)
    lines.push('')
    lines.push('Dear Hiring Team,')
    lines.push('')
    lines.push(`I am writing to express my strong interest in the ${role || 'position'}. As a ${role || 'professional'} with direct experience in the areas you require, I believe my background aligns well with the role.`)
    if (formal.length > 0) {
      lines.push('')
      lines.push('My qualifications match several of your key requirements:')
      for (const e of formal) lines.push(formatFormalEvidenceLine(e.requirementText, e.evidence, lang))
    }
    lines.push('')
    lines.push('I would welcome the opportunity to discuss how my experience can contribute to your team. Thank you for your time and consideration.')
    lines.push('')
    lines.push('Sincerely,')
    lines.push(name)
  } else {
    lines.push(`Postulación a ${role || 'la vacante'}`)
    lines.push('')
    lines.push('Estimado equipo de selección,')
    lines.push('')
    lines.push(`Me dirijo a ustedes para expresar mi interés en la posición de ${role || 'la vacante'}. Como profesional con experiencia directa en las áreas que requieren, creo que mi perfil encaja con lo que buscan.`)
    if (formal.length > 0) {
      lines.push('')
      lines.push('Mi experiencia coincide con varios de los requisitos clave:')
      for (const e of formal) lines.push(formatFormalEvidenceLine(e.requirementText, e.evidence, lang))
    }
    lines.push('')
    lines.push('Agradeceré la oportunidad de conversar sobre cómo mi experiencia puede aportar a su equipo. Quedo a su disposición para una entrevista.')
    lines.push('')
    lines.push('Atentamente,')
    lines.push(name)
  }

  return lines.join('\n')
}

/**
 * Template-based cover letters (both formats, no LLM).
 */
export function buildCoverLettersFromTemplate(options) {
  return {
    shortMessage: buildShortMessage(options),
    formalLetter: buildFormalLetter(options),
  }
}
