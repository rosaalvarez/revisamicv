import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildCoverLetters, buildShortMessage, buildFormalLetter } from '../src/lib/cover-letter.js'

const sampleMatchResults = [
  { requirement_id: 'r1', status: 'match', evidence: 'Coordiné equipos internos usando Scrum', evidence_source: 'cv', note: '' },
  { requirement_id: 'r2', status: 'partial', evidence: 'Documenté procesos para el equipo comercial', evidence_source: 'cv', note: '' },
  { requirement_id: 'r3', status: 'gap', evidence: null, evidence_source: 'cv', note: 'No evidence found' },
  { requirement_id: 'r4', status: 'match', evidence: 'Entregué reportes bilingües inglés-español', evidence_source: 'cv', note: '' },
]

const sampleRequirements = [
  { id: 'r1', text: 'Experiencia con metodologías ágiles (Scrum)', type: 'must_have', category: 'hard_skill', weight: 3 },
  { id: 'r2', text: 'Documentación de procesos', type: 'must_have', category: 'soft_skill', weight: 3 },
  { id: 'r3', text: 'Conocimiento de HubSpot', type: 'nice_to_have', category: 'hard_skill', weight: 1 },
  { id: 'r4', text: 'Inglés avanzado para llamadas con clientes', type: 'must_have', category: 'language', weight: 3 },
]

const sampleCV = {
  candidateName: 'Ana Pérez',
  targetTitle: 'Coordinadora de Proyectos',
  summary: 'Coordinadora de proyectos con experiencia en operación y mejora de procesos.',
  experience: [{ title: 'Coordinadora de Proyectos', company: 'Empresa Demo', dates: '2022-2025', bullets: ['Coordiné equipos usando Scrum'] }],
  skills: ['Scrum', 'Gestión de proyectos'],
}

describe('buildCoverLetters', () => {
  it('returns both shortMessage and formalLetter as non-empty strings', () => {
    const result = buildCoverLetters({
      matchResults: sampleMatchResults,
      requirementsTable: sampleRequirements,
      optimizedCV: sampleCV,
      language: 'spanish',
    })
    assert.ok(typeof result.shortMessage === 'string' && result.shortMessage.length > 0)
    assert.ok(typeof result.formalLetter === 'string' && result.formalLetter.length > 0)
  })

  it('includes candidate name in both formats', () => {
    const result = buildCoverLetters({
      matchResults: sampleMatchResults,
      requirementsTable: sampleRequirements,
      optimizedCV: sampleCV,
      language: 'spanish',
    })
    assert.ok(result.shortMessage.includes('Ana Pérez'), 'short message missing candidate name')
    assert.ok(result.formalLetter.includes('Ana Pérez'), 'formal letter missing candidate name')
  })

  it('references matched requirement evidence in short message', () => {
    const result = buildShortMessage({
      matchResults: sampleMatchResults,
      requirementsTable: sampleRequirements,
      optimizedCV: sampleCV,
      language: 'spanish',
    })
    assert.ok(result.includes('Scrum') || result.includes('ágiles'), 'short message missing matched evidence')
  })

  it('references matched requirement evidence in formal letter', () => {
    const result = buildFormalLetter({
      matchResults: sampleMatchResults,
      requirementsTable: sampleRequirements,
      optimizedCV: sampleCV,
      language: 'spanish',
    })
    assert.ok(result.includes('Scrum') || result.includes('ágiles'), 'formal letter missing matched evidence')
  })

  it('never references gap (unmatched) requirements', () => {
    const result = buildCoverLetters({
      matchResults: sampleMatchResults,
      requirementsTable: sampleRequirements,
      optimizedCV: sampleCV,
      language: 'spanish',
    })
    assert.ok(!result.shortMessage.includes('HubSpot'), 'short message should not mention HubSpot gap')
    assert.ok(!result.formalLetter.includes('HubSpot'), 'formal letter should not mention HubSpot gap')
  })

  it('produces English output when requested', () => {
    const result = buildShortMessage({
      matchResults: sampleMatchResults,
      requirementsTable: sampleRequirements,
      optimizedCV: sampleCV,
      language: 'english',
    })
    assert.ok(result.includes('Hi,') || result.includes('Dear'), 'english message missing greeting')
    assert.ok(!result.includes('Hola') && !result.includes('Estimado'), 'english message should not have spanish')
  })

  it('produces Spanish output by default', () => {
    const result = buildCoverLetters({
      matchResults: sampleMatchResults,
      requirementsTable: sampleRequirements,
      optimizedCV: sampleCV,
      language: 'spanish',
    })
    assert.ok(result.shortMessage.includes('Hola'), 'spanish short message missing greeting')
    assert.ok(result.formalLetter.includes('Estimado'), 'spanish formal letter missing greeting')
  })

  it('formal letter has subject line with role', () => {
    const result = buildFormalLetter({
      matchResults: sampleMatchResults,
      requirementsTable: sampleRequirements,
      optimizedCV: sampleCV,
      language: 'spanish',
    })
    assert.ok(result.includes('Coordinadora de Proyectos'), 'formal letter missing role in subject line')
  })

  it('handles empty match results gracefully', () => {
    const result = buildCoverLetters({
      matchResults: [],
      requirementsTable: [],
      optimizedCV: sampleCV,
      language: 'spanish',
    })
    assert.ok(result.shortMessage.includes('Ana Pérez'), 'should still include name with no matches')
    assert.ok(result.formalLetter.includes('Ana Pérez'), 'should still include name with no matches')
  })

  it('handles missing CV gracefully', () => {
    const result = buildCoverLetters({
      matchResults: sampleMatchResults,
      requirementsTable: sampleRequirements,
      optimizedCV: {},
      language: 'spanish',
    })
    assert.ok(typeof result.shortMessage === 'string' && result.shortMessage.length > 0)
    assert.ok(typeof result.formalLetter === 'string' && result.formalLetter.length > 0)
  })

  it('sorting: match evidence appears before partial evidence', () => {
    // Only partial matches — should still work
    const partialOnly = [
      { requirement_id: 'r1', status: 'partial', evidence: 'Algo de Scrum', evidence_source: 'cv', note: '' },
      { requirement_id: 'r4', status: 'match', evidence: 'Inglés bilingüe', evidence_source: 'cv', note: '' },
    ]
    const result = buildShortMessage({
      matchResults: partialOnly,
      requirementsTable: sampleRequirements,
      optimizedCV: sampleCV,
      language: 'spanish',
    })
    const idxMatch = result.indexOf('Inglés bilingüe')
    const idxPartial = result.indexOf('Scrum')
    assert.ok(idxMatch >= 0 && idxPartial >= 0, 'both evidences should appear')
    assert.ok(idxMatch < idxPartial, 'match evidence should appear before partial evidence')
  })

  it('limits evidence references to top 3 in short message', () => {
    // Create 6 matches, only top 3 should appear
    const manyMatches = [
      { requirement_id: 'r1', status: 'match', evidence: 'Evidencia 1 Scrum', evidence_source: 'cv', note: '' },
      { requirement_id: 'r2', status: 'match', evidence: 'Evidencia 2 Procesos', evidence_source: 'cv', note: '' },
      { requirement_id: 'r4', status: 'match', evidence: 'Evidencia 3 Inglés', evidence_source: 'cv', note: '' },
      { requirement_id: 'r5', status: 'match', evidence: 'Evidencia 4 Extra', evidence_source: 'cv', note: '' },
    ]
    const manyReqs = [
      ...sampleRequirements,
      { id: 'r5', text: 'Requisito extra', type: 'must_have', category: 'experience', weight: 3 },
    ]
    const result = buildShortMessage({
      matchResults: manyMatches,
      requirementsTable: manyReqs,
      optimizedCV: sampleCV,
      language: 'spanish',
    })
    // 4th evidence should NOT appear
    assert.ok(!result.includes('Evidencia 4 Extra'), 'short message should cap at 3 evidence references')
    // 3rd evidence SHOULD appear
    assert.ok(result.includes('Evidencia 3'), '3rd evidence should appear')
  })
})
