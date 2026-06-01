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
})

test('buildOptimizerSystemPrompt requires an ATS resume schema with contact and skills sections', () => {
  const prompt = buildOptimizerSystemPrompt('english')
  assert.match(prompt, /candidateName/i)
  assert.match(prompt, /contact/i)
  assert.match(prompt, /targetTitle/i)
  assert.match(prompt, /technicalSkills/i)
  assert.match(prompt, /tools/i)
  assert.match(prompt, /languages/i)
  assert.match(prompt, /standard ATS section order/i)
  assert.match(prompt, /If unavailable, return empty strings/i)
})
