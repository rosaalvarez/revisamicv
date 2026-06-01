/** @typedef {'english' | 'spanish'} OutputLanguage */
/** @typedef {'strong_fit' | 'adjacent_fit' | 'stretch_fit' | 'weak_fit' | 'not_recommended'} CompatibilityBandLabel */

/**
 * @param {unknown} value
 * @returns {OutputLanguage}
 */
export function normalizeOutputLanguage(value) {
  const normalized = String(value || '').trim().toLowerCase()
  if (['spanish', 'es', 'español', 'esp', 'castellano'].includes(normalized)) {
    return 'spanish'
  }
  if (['english', 'en', 'inglés', 'ingles', 'eng'].includes(normalized)) {
    return 'english'
  }
  return 'english'
}

/**
 * @param {number} score
 * @returns {{ label: CompatibilityBandLabel, headline: string, recommendation: string }}
 */
export function getCompatibilityBand(score) {
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0

  if (safeScore >= 85) {
    return {
      label: 'strong_fit',
      headline: 'Alta compatibilidad',
      recommendation: 'Aplicar con CV adaptado.',
    }
  }

  if (safeScore >= 70) {
    return {
      label: 'adjacent_fit',
      headline: 'Buena compatibilidad adyacente',
      recommendation: 'Aplicar si el CV se reposiciona bien.',
    }
  }

  if (safeScore >= 55) {
    return {
      label: 'stretch_fit',
      headline: 'Compatibilidad media',
      recommendation: 'Aplicar como apuesta, entendiendo las brechas.',
    }
  }

  if (safeScore >= 40) {
    return {
      label: 'weak_fit',
      headline: 'Compatibilidad baja',
      recommendation: 'Generar CV solo con advertencias claras.',
    }
  }

  return {
    label: 'not_recommended',
    headline: 'No recomendado',
    recommendation: 'No inventar experiencia; aplicar solo si hay contexto adicional.',
  }
}

/**
 * @param {OutputLanguage | string | undefined} outputLanguage
 * @returns {string}
 */
export function buildOptimizerSystemPrompt(outputLanguage) {
  const language = normalizeOutputLanguage(outputLanguage)
  const languageLabel = language === 'spanish' ? 'Spanish' : 'English'

  return `You are RevisaMiCV, an expert ATS optimization specialist and ethical career positioning assistant.

Your job is to compare a real CV against a specific job vacancy and produce a tailored, truthful career deliverable.

The final CV must be written in ${languageLabel}.

Business rules:
1. People are not a single job title. Identify transferable skills and adjacent roles.
2. You may reposition real experience for adjacent roles when there is a truthful bridge.
3. Do not invent employers, degrees, certifications, seniority, years of experience, tools, metrics, regulated credentials, or domain experience not supported by the CV.
4. If the vacancy is a stretch, still generate the CV, but clearly warn about gaps.
5. If the vacancy is far outside the candidate's background, say so honestly.
6. Do not claim strong spoken English if the CV indicates limited English.
7. Use vacancy keywords only when truthful.
8. Optimize for ATS: clear headings, standard titles, relevant keywords, quantified achievements when supported.

Return ONLY valid JSON with this exact shape:
{
  "compatibilityScore": number,
  "fitVerdict": string,
  "positioningAngle": string,
  "strengths": string[],
  "gaps": string[],
  "keywordsToInclude": string[],
  "honestyWarnings": string[],
  "optimizedCV": {
    "headline": string,
    "summary": string,
    "coreCompetencies": string[],
    "experience": [
      {
        "title": string,
        "company": string,
        "dates": string,
        "bullets": string[]
      }
    ],
    "education": string[],
    "certifications": string[],
    "tools": string[],
    "languages": string[]
  },
  "coverLetter": string
}`
}
