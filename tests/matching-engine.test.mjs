import assert from 'node:assert/strict'
import test from 'node:test'

import {
  applyStatusFloor,
  computeDeterministicScore,
  containsEvidenceQuote,
  normalizeRequirementWeights,
  runEvidenceMatchingWithValidation,
  validateOptimizedCvOutput,
} from '../src/lib/matching-engine.js'

const requirements = [
  { id: 'r1', text: 'Project management experience', type: 'must_have', category: 'experience', weight: 3 },
  { id: 'r2', text: 'SQL', type: 'nice_to_have', category: 'hard_skill', weight: 1 },
  { id: 'r3', text: 'Senior title', type: 'nice_to_have', category: 'title_seniority', weight: 2 },
]

test('normalizeRequirementWeights applies configured defaults without hardcoding them in requirements', () => {
  const normalized = normalizeRequirementWeights([
    { id: 'r1', text: 'Required English', type: 'must_have', category: 'language' },
    { id: 'r2', text: 'Senior analyst', type: 'nice_to_have', category: 'title_seniority' },
    { id: 'r3', text: 'Tableau', type: 'nice_to_have', category: 'hard_skill' },
  ], { must_have: 5, nice_to_have: 2, title_seniority: 4 })

  assert.deepEqual(normalized.map((item) => item.weight), [5, 4, 2])
})

test('computeDeterministicScore calculates total and category scores from validated statuses', () => {
  const result = computeDeterministicScore(requirements, [
    { requirement_id: 'r1', status: 'match', evidence: 'Managed projects', evidence_source: 'cv', note: 'ok' },
    { requirement_id: 'r2', status: 'partial', evidence: 'SQL reports', evidence_source: 'cv', note: 'ok' },
    { requirement_id: 'r3', status: 'gap', evidence: null, evidence_source: 'cv', note: 'missing' },
  ])

  assert.equal(result.score, 58)
  assert.equal(result.score_breakdown.must_haves, 100)
  assert.equal(result.score_breakdown.hard_skills, 50)
  assert.equal(result.score_breakdown.title_seniority, 0)
})

test('containsEvidenceQuote allows case, accents, and whitespace normalization', () => {
  const cvText = 'Gestioné proyectos multifuncionales con equipos de ventas y operaciones.'
  assert.equal(containsEvidenceQuote(cvText, 'gestione   proyectos multifuncionales'), true)
  assert.equal(containsEvidenceQuote(cvText, 'project management'), false)
})

test('runEvidenceMatchingWithValidation re-asks once and downgrades evidence-less matches to gap', async () => {
  const cvText = 'Managed projects for operations teams. Built SQL reports.'
  let calls = 0
  const completion = async () => {
    calls += 1
    if (calls === 1) {
      return {
        text: JSON.stringify({ matches: [
          { requirement_id: 'r1', status: 'match', evidence: 'Led a PMO transformation', evidence_source: 'cv', note: 'Not actually in CV' },
          { requirement_id: 'r2', status: 'partial', evidence: 'SQL reports', evidence_source: 'cv', note: 'Found SQL reports' },
        ] }),
        model: 'fake-model',
      }
    }
    return {
      text: JSON.stringify({ matches: [
        { requirement_id: 'r1', status: 'match', evidence: 'Managed projects', evidence_source: 'cv', note: 'Corrected quote' },
      ] }),
      model: 'fake-model',
    }
  }

  const result = await runEvidenceMatchingWithValidation({
    cvText,
    requirements: requirements.slice(0, 2),
    outputLanguage: 'english',
    createJsonCompletion: completion,
  })

  assert.equal(calls, 2)
  assert.equal(result.matches.find((item) => item.requirement_id === 'r1')?.status, 'match')
  assert.equal(result.matches.find((item) => item.requirement_id === 'r1')?.evidence, 'Managed projects')
  assert.equal(result.matches.find((item) => item.requirement_id === 'r2')?.status, 'partial')
})

test('runEvidenceMatchingWithValidation downgrades invalid evidence after one failed retry', async () => {
  const completion = async () => ({
    text: JSON.stringify({ matches: [
      { requirement_id: 'r1', status: 'match', evidence: 'Invented quote', evidence_source: 'cv', note: 'bad' },
    ] }),
    model: 'fake-model',
  })

  const result = await runEvidenceMatchingWithValidation({
    cvText: 'Actual CV only mentions customer support.',
    requirements: requirements.slice(0, 1),
    outputLanguage: 'english',
    createJsonCompletion: completion,
  })

  assert.deepEqual(result.matches[0], {
    requirement_id: 'r1',
    status: 'gap',
    evidence: null,
    evidence_source: 'cv',
    note: 'No valid CV evidence found for this requirement.',
  })
})

test('applyStatusFloor guarantees adapted matching cannot lower original score', () => {
  const original = [
    { requirement_id: 'r1', status: 'match', evidence: 'Managed projects', evidence_source: 'cv', note: 'ok' },
    { requirement_id: 'r2', status: 'partial', evidence: 'SQL', evidence_source: 'cv', note: 'ok' },
    { requirement_id: 'r3', status: 'gap', evidence: null, evidence_source: 'cv', note: 'missing' },
  ]
  const adaptedRaw = [
    { requirement_id: 'r1', status: 'gap', evidence: null, evidence_source: 'cv', note: 'bad downgrade' },
    { requirement_id: 'r2', status: 'gap', evidence: null, evidence_source: 'cv', note: 'bad downgrade' },
    { requirement_id: 'r3', status: 'partial', evidence: 'Senior stakeholder work', evidence_source: 'cv', note: 'improved' },
  ]

  const floored = applyStatusFloor(original, adaptedRaw)
  const originalScore = computeDeterministicScore(requirements, original).score
  const adaptedScore = computeDeterministicScore(requirements, floored).score

  assert.equal(floored.map((item) => item.status).join(','), 'match,partial,partial')
  assert.ok(adaptedScore >= originalScore)
})

test('adapted score invariant holds on 3 sample CV/vacancy pairs', () => {
  const samples = [
    {
      reqs: requirements,
      original: ['match', 'gap', 'gap'],
      adapted: ['gap', 'partial', 'match'],
    },
    {
      reqs: requirements,
      original: ['partial', 'partial', 'gap'],
      adapted: ['gap', 'match', 'partial'],
    },
    {
      reqs: requirements,
      original: ['gap', 'gap', 'gap'],
      adapted: ['partial', 'match', 'gap'],
    },
  ]

  for (const sample of samples) {
    const original = sample.original.map((status, index) => ({ requirement_id: requirements[index].id, status, evidence: status === 'gap' ? null : 'evidence', evidence_source: 'cv', note: '' }))
    const adapted = sample.adapted.map((status, index) => ({ requirement_id: requirements[index].id, status, evidence: status === 'gap' ? null : 'evidence', evidence_source: 'cv', note: '' }))
    const floored = applyStatusFloor(original, adapted)
    assert.ok(computeDeterministicScore(sample.reqs, floored).score >= computeDeterministicScore(sample.reqs, original).score)
  }
})

test('validateOptimizedCvOutput rejects empty or incomplete generated CVs', () => {
  assert.equal(validateOptimizedCvOutput({}).valid, false)
  assert.equal(validateOptimizedCvOutput({ summary: 'Short' }).valid, false)
  assert.equal(validateOptimizedCvOutput({
    candidateName: 'Rosa Alvarez',
    targetTitle: 'Project Manager',
    summary: 'Project manager with experience coordinating cross-functional operational initiatives and stakeholder communication.',
    coreCompetencies: ['Project Management', 'Stakeholder Communication', 'Reporting'],
    experience: [{ title: 'Project Coordinator', company: 'Acme', bullets: ['Managed projects for operations teams and prepared weekly reports for leadership.'] }],
    education: ['Business Administration'],
  }).valid, true)
})
