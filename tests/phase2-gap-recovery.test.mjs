import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildGapRecoveryQuestions,
  buildKeyRequirementRows,
  buildScoreBreakdownRows,
  sanitizeDocumentFraming,
} from '../src/lib/result-phase2.js'
import {
  applyUserDeclaredEvidenceUpgrades,
  computeDeterministicScore,
  buildUserDeclaredRevisionInstruction,
} from '../src/lib/matching-engine.js'

test('buildScoreBreakdownRows hides null categories and labels deterministic sub-scores', () => {
  const rows = buildScoreBreakdownRows({
    must_haves: 63,
    hard_skills: 25,
    soft_skills: 100,
    title_seniority: null,
    other: undefined,
  })

  assert.deepEqual(rows.map((row) => row.key), ['must_haves', 'hard_skills', 'soft_skills'])
  assert.deepEqual(rows.map((row) => row.score), [63, 25, 100])
  assert.ok(rows.every((row) => row.label && row.tone))
})

test('buildKeyRequirementRows uses evidence quotes and document-only framing', () => {
  const requirements = [
    { id: 'r1', text: 'Jira or Asana experience', type: 'must_have', category: 'hard_skill', weight: 3 },
    { id: 'r2', text: 'Advanced English for client calls', type: 'must_have', category: 'language', weight: 3 },
  ]
  const matches = [
    { requirement_id: 'r1', status: 'partial', evidence: 'Usé Jira para priorizar backlog', evidence_source: 'cv', note: '' },
    { requirement_id: 'r2', status: 'gap', evidence: null, evidence_source: 'cv', note: 'No advanced English is visible' },
  ]

  const rows = buildKeyRequirementRows(requirements, matches)

  assert.equal(rows[0].copy, 'Tu CV muestra esto parcialmente.')
  assert.equal(rows[0].type, 'must_have')
  assert.equal(rows[0].type_label, 'Obligatorio')
  assert.equal(rows[0].quote, '“Usé Jira para priorizar backlog”')
  assert.equal(rows[1].copy, 'Tu CV no muestra esto todavía.')
  assert.doesNotMatch(rows.map((row) => `${row.copy} ${row.note}`).join(' '), /no cumples|no tienes|te falta/i)
})

test('buildGapRecoveryQuestions creates Tu experiencia prompts from gaps only with evidence-source options', () => {
  const requirements = [
    { id: 'r1', text: 'SaaS implementation projects', type: 'must_have', category: 'experience', weight: 3 },
    { id: 'r2', text: 'Stakeholder management', type: 'nice_to_have', category: 'soft_skill', weight: 1 },
  ]
  const matches = [
    { requirement_id: 'r1', status: 'gap', evidence: null, evidence_source: 'cv', note: 'No SaaS evidence' },
    { requirement_id: 'r2', status: 'match', evidence: 'Gestión con equipos internos', evidence_source: 'cv', note: '' },
  ]

  const questions = buildGapRecoveryQuestions(requirements, matches)

  assert.equal(questions.length, 1)
  assert.equal(questions[0].requirement_id, 'r1')
  assert.deepEqual(questions[0].options, ['Proyectos personales', 'Freelance', 'Estudios o cursos', 'Voluntariado', 'Parcialmente / en un proyecto puntual', 'No tengo'])
  assert.match(questions[0].question, /tu CV no muestra/i)
  assert.doesNotMatch(questions[0].question, /no cumples|no tienes/i)
})

test('buildGapRecoveryQuestions caps at 5 and prioritizes must-have gaps first', () => {
  const requirements = [
    { id: 'n1', text: 'Nice optional one', type: 'nice_to_have', category: 'other', weight: 1 },
    { id: 'm1', text: 'Must one', type: 'must_have', category: 'experience', weight: 3 },
    { id: 'm2', text: 'Must two', type: 'must_have', category: 'hard_skill', weight: 3 },
    { id: 'm3', text: 'Must three', type: 'must_have', category: 'language', weight: 3 },
    { id: 'm4', text: 'Must four', type: 'must_have', category: 'soft_skill', weight: 3 },
    { id: 'm5', text: 'Must five', type: 'must_have', category: 'education', weight: 3 },
    { id: 'n2', text: 'Nice optional two', type: 'nice_to_have', category: 'other', weight: 1 },
  ]
  const matches = requirements.map((requirement) => ({ requirement_id: requirement.id, status: 'gap', evidence: null, evidence_source: 'cv', note: '' }))

  const questions = buildGapRecoveryQuestions(requirements, matches)

  assert.equal(questions.length, 5)
  assert.deepEqual(questions.map((question) => question.requirement_id), ['m1', 'm2', 'm3', 'm4', 'm5'])
})

test('applyUserDeclaredEvidenceUpgrades upgrades declared gaps, marks user_declared, and recalculates score', () => {
  const requirements = [
    { id: 'r1', text: 'SaaS implementation projects', type: 'must_have', category: 'experience', weight: 3 },
    { id: 'r2', text: 'Advanced English', type: 'must_have', category: 'language', weight: 3 },
  ]
  const matches = [
    { requirement_id: 'r1', status: 'gap', evidence: null, evidence_source: 'cv', note: '' },
    { requirement_id: 'r2', status: 'gap', evidence: null, evidence_source: 'cv', note: '' },
  ]
  const before = computeDeterministicScore(requirements, matches)

  const upgraded = applyUserDeclaredEvidenceUpgrades(requirements, matches, [
    { requirement_id: 'r1', detail: 'Implementé onboarding de clientes en una herramienta SaaS interna durante 8 meses.' },
    { requirement_id: 'r2', detail: 'No aplica' },
  ])
  const after = computeDeterministicScore(requirements, upgraded.matches)

  assert.equal(before.score, 0)
  assert.ok(after.score > before.score)
  assert.equal(upgraded.matches[0].status, 'partial')
  assert.equal(upgraded.matches[0].evidence_source, 'user_declared')
  assert.match(upgraded.matches[0].evidence, /SaaS interna/)
  assert.equal(upgraded.matches[1].status, 'gap')
})

test('buildUserDeclaredRevisionInstruction injects declared evidence without person-judging copy', () => {
  const instruction = buildUserDeclaredRevisionInstruction([
    { requirement_id: 'r1', requirement_text: 'SaaS implementation projects', detail: 'Implementé onboarding SaaS para 12 clientes.' },
  ])

  assert.match(instruction, /user-declared|declarada por la persona/i)
  assert.match(instruction, /Implementé onboarding SaaS/)
  assert.doesNotMatch(sanitizeDocumentFraming('no cumples SaaS y no tienes inglés'), /no cumples|no tienes/i)
})
