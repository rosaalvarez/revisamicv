import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  selectFilteredEvidence,
  buildCoverLetterSystemPrompt,
  buildCoverLetterUserPrompt,
  validateCoverLetterOutput,
  buildShortMessage,
  buildFormalLetter,
  buildCoverLettersFromTemplate,
} from '../src/lib/cover-letter.js'

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

// ── Filter tests ──

describe('selectFilteredEvidence', () => {
  it('filters out gaps and returns only match/partial items with evidence', () => {
    const result = selectFilteredEvidence(sampleMatchResults, sampleRequirements)
    assert.ok(Array.isArray(result.short), 'short should be an array')
    assert.ok(result.short.every((m) => m.status === 'match' || m.status === 'partial'), 'only match/partial')
    assert.ok(result.short.every((m) => m.evidence && m.evidence.length > 0), 'all have evidence')
    assert.ok(!result.short.find((m) => m.requirementId === 'r3'), 'r3 gap should be excluded')
  })

  it('returns short (3) and formal (4) lists', () => {
    const many = [
      ...sampleMatchResults,
      { requirement_id: 'r5', status: 'match', evidence: 'Mentoricé equipos junior', evidence_source: 'cv', note: '' },
    ]
    const manyReqs = [
      ...sampleRequirements,
      { id: 'r5', text: 'Mentoría de equipos', type: 'nice_to_have', category: 'soft_skill', weight: 1 },
    ]
    const result = selectFilteredEvidence(many, manyReqs)
    assert.ok(result.short.length <= 3, 'short capped at 3')
    assert.ok(result.formal.length <= 4, 'formal capped at 4')
  })

  it('allIds includes all matched requirement IDs', () => {
    const result = selectFilteredEvidence(sampleMatchResults, sampleRequirements)
    assert.ok(result.allIds.has('r1'), 'r1 should be in allIds')
    assert.ok(result.allIds.has('r2'), 'r2 should be in allIds')
    assert.ok(result.allIds.has('r4'), 'r4 should be in allIds')
    assert.ok(!result.allIds.has('r3'), 'r3 gap should not be in allIds')
  })

  it('match evidence sorts before partial evidence', () => {
    const partialFirst = [
      { requirement_id: 'r2', status: 'partial', evidence: 'Documenté procesos', evidence_source: 'cv', note: '' },
      { requirement_id: 'r1', status: 'match', evidence: 'Coordiné usando Scrum', evidence_source: 'cv', note: '' },
    ]
    const result = selectFilteredEvidence(partialFirst, sampleRequirements)
    assert.equal(result.short[0].status, 'match', 'match should come first')
  })
})

// ── Prompt builder tests ──

describe('buildCoverLetterSystemPrompt', () => {
  it('includes language instruction', () => {
    const es = buildCoverLetterSystemPrompt('spanish')
    assert.ok(es.includes('Spanish'), 'spanish prompt should mention Spanish')
    const en = buildCoverLetterSystemPrompt('english')
    assert.ok(en.includes('English'), 'english prompt should mention English')
  })

  it('includes anti-invention rules', () => {
    const prompt = buildCoverLetterSystemPrompt('spanish')
    assert.ok(prompt.includes('Do not add, embellish, or invent'), 'should forbid invention')
    assert.ok(prompt.includes('Do NOT mention gaps'), 'should forbid gaps')
  })
})

describe('buildCoverLetterUserPrompt', () => {
  it('includes candidate name and role', () => {
    const evidenceList = [{ requirementText: 'Scrum', evidence: 'Coordiné equipos usando Scrum' }]
    const prompt = buildCoverLetterUserPrompt({
      candidateName: 'María Gómez',
      candidateRole: 'Project Manager',
      evidenceList,
      language: 'spanish',
    })
    assert.ok(prompt.includes('María Gómez'), 'should include name')
    assert.ok(prompt.includes('Project Manager'), 'should include role')
  })

  it('includes evidence in the prompt', () => {
    const evidenceList = [
      { requirementText: 'Scrum', evidence: 'Coordiné equipos usando Scrum' },
      { requirementText: 'Inglés', evidence: 'Entregué reportes bilingües' },
    ]
    const prompt = buildCoverLetterUserPrompt({
      candidateName: 'A',
      candidateRole: 'B',
      evidenceList,
      language: 'english',
    })
    assert.ok(prompt.includes('Scrum'), 'should include requirement text')
    assert.ok(prompt.includes('Entregué reportes bilingües'), 'should include evidence text')
  })

  it('handles empty evidence list gracefully', () => {
    const prompt = buildCoverLetterUserPrompt({
      candidateName: 'A',
      candidateRole: 'B',
      evidenceList: [],
      language: 'spanish',
    })
    assert.ok(prompt.includes('No specific requirements'), 'should indicate no requirements')
  })
})

// ── Validation tests ──

describe('validateCoverLetterOutput', () => {
  it('accepts clean output with no inventions', () => {
    const clean = "I'm Ana Pérez. I have experience with Scrum and documentation processes."
    const result = validateCoverLetterOutput(clean, new Set(['r1', 'r2']), sampleRequirements)
    assert.ok(result.valid, 'clean output should be valid')
    assert.equal(result.violations.length, 0, 'no violations')
  })

  it('rejects output with fabricated metrics', () => {
    const fabricated = 'I increased team efficiency by 45%. I have experience with Scrum.'
    const result = validateCoverLetterOutput(fabricated, new Set(['r1']), sampleRequirements)
    assert.ok(!result.valid, 'fabricated metric should be rejected')
    assert.ok(result.violations.length > 0, 'should have violations')
  })

  it('rejects output with invented company names', () => {
    const fabricated = 'I worked at Google Inc as a project manager. I have Scrum experience.'
    const result = validateCoverLetterOutput(fabricated, new Set(['r1']), sampleRequirements)
    assert.ok(!result.valid, 'invented company should be rejected')
  })
})

// ── Template fallback tests (unchanged behavior) ──

describe('buildCoverLettersFromTemplate', () => {
  it('returns both formats as non-empty strings', () => {
    const result = buildCoverLettersFromTemplate({
      matchResults: sampleMatchResults,
      requirementsTable: sampleRequirements,
      optimizedCV: sampleCV,
      language: 'spanish',
    })
    assert.ok(typeof result.shortMessage === 'string' && result.shortMessage.length > 0)
    assert.ok(typeof result.formalLetter === 'string' && result.formalLetter.length > 0)
  })

  it('includes candidate name', () => {
    const result = buildCoverLettersFromTemplate({
      matchResults: sampleMatchResults,
      requirementsTable: sampleRequirements,
      optimizedCV: sampleCV,
      language: 'spanish',
    })
    assert.ok(result.shortMessage.includes('Ana Pérez'))
    assert.ok(result.formalLetter.includes('Ana Pérez'))
  })

  it('never references gap requirements', () => {
    const result = buildCoverLettersFromTemplate({
      matchResults: sampleMatchResults,
      requirementsTable: sampleRequirements,
      optimizedCV: sampleCV,
      language: 'spanish',
    })
    assert.ok(!result.shortMessage.includes('HubSpot'))
    assert.ok(!result.formalLetter.includes('HubSpot'))
  })

  it('English output excludes Spanish greetings', () => {
    const result = buildCoverLettersFromTemplate({
      matchResults: sampleMatchResults,
      requirementsTable: sampleRequirements,
      optimizedCV: sampleCV,
      language: 'english',
    })
    assert.ok(!result.shortMessage.includes('Hola'))
    assert.ok(!result.formalLetter.includes('Estimado'))
  })

  it('handles empty match results gracefully', () => {
    const result = buildCoverLettersFromTemplate({
      matchResults: [],
      requirementsTable: [],
      optimizedCV: sampleCV,
      language: 'spanish',
    })
    assert.ok(result.shortMessage.includes('Ana Pérez'))
  })
})
