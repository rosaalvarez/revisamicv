import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createAnalysisDraftKey,
  getEvidenceStepState,
  getEvidenceThermometer,
  getResultWizardSteps,
  shouldShowEvidenceQuestions,
} from '../src/lib/analysis-flow.js'

test('createAnalysisDraftKey normalizes email for stable refresh recovery', () => {
  assert.equal(createAnalysisDraftKey(' Rosita@Example.COM '), 'revisamicv:analysis-draft:rosita@example.com')
  assert.equal(createAnalysisDraftKey(''), 'revisamicv:analysis-draft:anonymous')
})

test('shouldShowEvidenceQuestions returns true only when evidence questions can help', () => {
  assert.equal(shouldShowEvidenceQuestions({ applicationDecision: 'optimize', clarificationQuestions: [{ question: 'x' }] }), false)
  assert.equal(shouldShowEvidenceQuestions({ applicationDecision: 'needs_clarification', clarificationQuestions: [{ question: 'x' }] }), true)
  assert.equal(shouldShowEvidenceQuestions({ applicationDecision: 'optimize_with_caution', clarificationQuestions: ['x'] }), true)
  assert.equal(shouldShowEvidenceQuestions({ compatibilityScore: 32, clarificationQuestions: [] }), true)
})

test('getEvidenceThermometer returns all non-judgmental visual bands with active band', () => {
  const thermometer = getEvidenceThermometer({ compatibilityScore: 37 })
  assert.equal(thermometer.score, 37)
  assert.equal(thermometer.activeLevel, 'weak')
  assert.deepEqual(thermometer.bands.map((band) => band.label), [
    'Evidencia insuficiente con lo visible',
    'Evidencia débil',
    'Falta contexto',
    'Evidencia útil',
    'Evidencia fuerte',
  ])
  assert.equal(thermometer.bands.find((band) => band.active)?.level, 'weak')
  assert.match(thermometer.explainer, /no mide tu valor profesional/i)
})

test('getResultWizardSteps routes low evidence through context before CV', () => {
  const steps = getResultWizardSteps({ compatibilityScore: 42, applicationDecision: 'needs_clarification', clarificationQuestions: ['Pregunta'] }, { canDownloadCv: true })
  assert.deepEqual(steps.map((step) => step.id), ['evidence', 'context', 'cv'])
  assert.equal(steps.find((step) => step.id === 'context')?.status, 'current')
  assert.equal(steps.find((step) => step.id === 'cv')?.disabled, true)
})

test('getResultWizardSteps sends strong evidence directly to CV step', () => {
  const steps = getResultWizardSteps({ compatibilityScore: 88, applicationDecision: 'optimize' }, { canDownloadCv: true })
  assert.deepEqual(steps.map((step) => step.id), ['evidence', 'cv'])
  assert.equal(steps.find((step) => step.id === 'evidence')?.status, 'completed')
  assert.equal(steps.find((step) => step.id === 'cv')?.status, 'current')
})

test('getEvidenceStepState uses hopeful non-judgmental states by score', () => {
  assert.deepEqual(getEvidenceStepState({ compatibilityScore: 86 }), {
    level: 'strong',
    title: 'Tu CV ya muestra buena evidencia para esta vacante.',
    needsQuestions: false,
  })
  assert.deepEqual(getEvidenceStepState({ compatibilityScore: 55, clarificationQuestions: ['Pregunta'] }), {
    level: 'incomplete',
    title: 'Hay señales útiles, pero falta contexto.',
    needsQuestions: true,
  })
  assert.deepEqual(getEvidenceStepState({ compatibilityScore: 12 }), {
    level: 'thin',
    title: 'Esta vacante parece lejana a lo que tu CV muestra hoy.',
    needsQuestions: true,
  })
})
