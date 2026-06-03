import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildRiskyRevisionPrompt,
  buildLowScoreCoachingPrompt,
  summarizeCvChanges,
  coachBlockedChange,
} from '../src/lib/result-ux.js'

test('buildRiskyRevisionPrompt detects forceful UX/UI repositioning requests and returns friendly options', () => {
  const prompt = buildRiskyRevisionPrompt('Forzar mi perfil industrial a UX/UI y subirlo a 75%')

  assert.ok(prompt)
  assert.match(prompt.question, /cómo quieres/i)
  assert.equal(prompt.options.length, 3)
  assert.deepEqual(prompt.options, [
    'Reformular solo experiencia real que ya está en mi CV',
    'Quiero agregar contexto real que puedo respaldar',
    'Muéstrame una alternativa más segura para esta vacante',
  ])
  assert.match(prompt.freeTextLabel, /contexto real/i)
})

test('buildRiskyRevisionPrompt ignores normal editing requests and role names', () => {
  assert.equal(buildRiskyRevisionPrompt('Haz el resumen más corto y profesional'), null)
  assert.equal(buildRiskyRevisionPrompt('Quiero adaptar mi experiencia a una vacante UX UI'), null)
})

test('buildLowScoreCoachingPrompt appears automatically for low scores without keyword matching', () => {
  const prompt = buildLowScoreCoachingPrompt(50)

  assert.ok(prompt)
  assert.match(prompt.question, /50%/)
  assert.match(prompt.question, /mejorar/i)
  assert.equal(prompt.options.length, 3)
  assert.deepEqual(prompt.options, [
    'Sí, ayúdame a reforzar mi CV con experiencia real que ya tengo',
    'Tengo más contexto real para agregar antes de ajustar',
    'Muéstrame una versión más estratégica sin inventar nada',
  ])
  assert.doesNotMatch(prompt.question, /UX\/UI|UX UI|forzar/i)
})

test('buildLowScoreCoachingPrompt does not interrupt when score is already strong enough', () => {
  assert.equal(buildLowScoreCoachingPrompt(75), null)
  assert.equal(buildLowScoreCoachingPrompt(undefined), null)
})

test('coachBlockedChange rewrites blocked copy without judging the candidate', () => {
  const copy = coachBlockedChange('No puedo inventar experiencia en Figma')

  assert.match(copy, /Para cuidar tu credibilidad/i)
  assert.match(copy, /experiencia real/i)
  assert.doesNotMatch(copy, /no puedo/i)
  assert.doesNotMatch(copy, /inventar/i)
})

test('summarizeCvChanges returns simple human-readable change tags', () => {
  const beforeCv = {
    targetTitle: 'Diseñadora Industrial',
    summary: 'Diseñadora industrial con experiencia en producto.',
    coreCompetencies: ['Diseño industrial'],
    experience: [{ bullets: ['Diseño de producto físico'] }],
  }
  const afterCv = {
    targetTitle: 'Diseñadora Industrial orientada a UX/UI',
    summary: 'Diseñadora industrial con enfoque en investigación de usuario y producto digital.',
    coreCompetencies: ['Diseño industrial', 'Investigación de usuario', 'Figma'],
    experience: [{ bullets: ['Diseño de producto físico', 'Colaboración con equipos digitales'] }],
  }

  const changes = summarizeCvChanges(beforeCv, afterCv)

  assert.ok(changes.some((change) => change.label === 'Título objetivo ajustado'))
  assert.ok(changes.some((change) => change.label === 'Perfil profesional reescrito'))
  assert.ok(changes.some((change) => change.label === 'Keywords añadidas'))
  assert.ok(changes.some((change) => change.label === 'Experiencia reforzada'))
})
