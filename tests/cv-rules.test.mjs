import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getCompatibilityBand,
  normalizeOutputLanguage,
  buildOptimizerSystemPrompt,
} from '../src/lib/cv-rules.js'

test('normalizeOutputLanguage supports English and Spanish with safe default', () => {
  assert.equal(normalizeOutputLanguage('english'), 'english')
  assert.equal(normalizeOutputLanguage('en'), 'english')
  assert.equal(normalizeOutputLanguage('spanish'), 'spanish')
  assert.equal(normalizeOutputLanguage('es'), 'spanish')
  assert.equal(normalizeOutputLanguage(''), 'english')
  assert.equal(normalizeOutputLanguage(undefined), 'english')
})

test('getCompatibilityBand maps scores to business verdicts', () => {
  assert.deepEqual(getCompatibilityBand(91), {
    label: 'strong_fit',
    headline: 'Alta compatibilidad',
    recommendation: 'Aplicar con CV adaptado.',
  })
  assert.deepEqual(getCompatibilityBand(73), {
    label: 'adjacent_fit',
    headline: 'Buena compatibilidad adyacente',
    recommendation: 'Aplicar si el CV se reposiciona bien.',
  })
  assert.deepEqual(getCompatibilityBand(62), {
    label: 'stretch_fit',
    headline: 'Compatibilidad media',
    recommendation: 'Aplicar como apuesta, entendiendo las brechas.',
  })
  assert.deepEqual(getCompatibilityBand(45), {
    label: 'weak_fit',
    headline: 'Compatibilidad baja',
    recommendation: 'Generar CV solo con advertencias claras.',
  })
  assert.deepEqual(getCompatibilityBand(20), {
    label: 'not_recommended',
    headline: 'No recomendado',
    recommendation: 'No inventar experiencia; aplicar solo si hay contexto adicional.',
  })
})

test('buildOptimizerSystemPrompt includes selected output language and anti-invention rules', () => {
  const prompt = buildOptimizerSystemPrompt('spanish')
  assert.match(prompt, /final CV must be written in Spanish/i)
  assert.match(prompt, /Do not invent employers/i)
  assert.match(prompt, /compatibilityScore/i)
  assert.match(prompt, /matchBreakdown/i)
  assert.match(prompt, /requiredSkills/i)
  assert.match(prompt, /honestyRisk/i)
  assert.match(prompt, /ONE coherent target identity/i)
  assert.match(prompt, /ONE language throughout/i)
  assert.match(prompt, /Detect visible date gaps/i)
  assert.match(prompt, /Still generate and allow download/i)
  assert.match(prompt, /truthful functional skills/i)
  assert.match(prompt, /administered platforms/i)
  assert.match(prompt, /obscure internal\/project names/i)
})

test('buildOptimizerSystemPrompt requires an ATS resume schema with contact and skills sections', () => {
  const prompt = buildOptimizerSystemPrompt('english')

  assert.match(prompt, /"contact"/)
  assert.match(prompt, /"coreCompetencies"/)
  assert.match(prompt, /"technicalSkills"/)
  assert.match(prompt, /standard ATS section order/i)
  assert.match(prompt, /If unavailable, return empty strings/i)
})

test('buildOptimizerSystemPrompt requires preserving self-owned projects with public traction', () => {
  const prompt = buildOptimizerSystemPrompt('english')

  assert.match(prompt, /Featured Projects/i)
  assert.match(prompt, /"featuredProjects"/)
  assert.match(prompt, /GitHub stars/i)
  assert.match(prompt, /Product Hunt/i)
  assert.match(prompt, /seed capital/i)
  assert.match(prompt, /Do not discard/i)
})

test('buildOptimizerSystemPrompt uses role-agnostic evidence policy with limited clarification questions', () => {
  const prompt = buildOptimizerSystemPrompt('spanish')

  assert.match(prompt, /role-agnostic evidence policy/i)
  assert.match(prompt, /Do not create special-case rules for UX, tech, admin, design, marketing/i)
  assert.match(prompt, /ask up to 3 critical clarification questions/i)
  assert.match(prompt, /Never ask endless questions/i)
  assert.match(prompt, /"applicationDecision"/)
  assert.match(prompt, /"clarificationQuestions"/)
})

test('buildRevisionSystemPrompt permits user corrections but blocks invented experience', async () => {
  const { buildRevisionSystemPrompt } = await import('../src/lib/cv-rules.js')
  const prompt = buildRevisionSystemPrompt('spanish')

  assert.match(prompt, /Spanish/)
  assert.match(prompt, /contact data corrections/i)
  assert.match(prompt, /truthful functional skills/i)
  assert.match(prompt, /Normalize date formatting/i)
  assert.match(prompt, /Do not invent employers/i)
  assert.match(prompt, /blockedChanges/i)
  assert.match(prompt, /not already present in the current CV JSON/i)
  assert.match(prompt, /Return ONLY valid JSON/i)
  assert.match(prompt, /"optimizedCV"/)
})
