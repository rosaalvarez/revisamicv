import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getSmartPackDefault,
  buildDashboardDeltaLabel,
  shouldShowLastCreditNotice,
  shouldSuppressFollowupSequence,
  getVacancyTitle,
} from '../src/lib/conversion-triggers.js'
import {
  buildAnalysisEmail,
  buildUnsubscribeUrl,
  getNextSequenceStep,
  shouldCreateSequence,
} from '../src/lib/analysis-email-sequence.js'

test('getSmartPackDefault highlights Pro only after at least five lifetime analyses', () => {
  assert.equal(getSmartPackDefault(0), 'basic')
  assert.equal(getSmartPackDefault(4), 'basic')
  assert.equal(getSmartPackDefault(5), 'pro')
  assert.equal(getSmartPackDefault(12), 'pro')
})

test('shouldShowLastCreditNotice fires only at start when exactly one credit remains', () => {
  assert.equal(shouldShowLastCreditNotice({ credits: 1, moment: 'analysis_start' }), true)
  assert.equal(shouldShowLastCreditNotice({ credits: 1, moment: 'result' }), false)
  assert.equal(shouldShowLastCreditNotice({ credits: 0, moment: 'analysis_start' }), false)
  assert.equal(shouldShowLastCreditNotice({ credits: 2, moment: 'analysis_start' }), false)
})

test('dashboard delta label uses real original to adapted scores and falls back safely', () => {
  assert.equal(buildDashboardDeltaLabel({ original_score: 54, adapted_score: 81, compatibility_score: 81 }), '54 → 81')
  assert.equal(buildDashboardDeltaLabel({ original_score: null, adapted_score: 81, compatibility_score: 81 }), '81')
  assert.equal(buildDashboardDeltaLabel({ original_score: 54, adapted_score: null, compatibility_score: 81 }), '54 → 81')
  assert.equal(buildDashboardDeltaLabel({ original_score: null, adapted_score: null, compatibility_score: null }), '—')
})

test('getVacancyTitle prefers explicit vacancy title then optimized CV target title then preview', () => {
  assert.equal(getVacancyTitle({ vacancy_title: 'Growth Marketer' }), 'Growth Marketer')
  assert.equal(getVacancyTitle({ optimized_cv: { targetTitle: 'Product Manager' } }), 'Product Manager')
  assert.equal(getVacancyTitle({ job_preview: 'ACME: Data Analyst - Remote' }), 'Data Analyst · ACME')
})

test('followup sequence suppresses if user ran another analysis after the sequence analysis', () => {
  const sequence = { analysis_id: 'a1', created_at: '2026-06-01T10:00:00Z' }
  assert.equal(shouldSuppressFollowupSequence(sequence, []), false)
  assert.equal(shouldSuppressFollowupSequence(sequence, [{ id: 'a1', created_at: '2026-06-01T10:00:00Z' }]), false)
  assert.equal(shouldSuppressFollowupSequence(sequence, [{ id: 'a2', created_at: '2026-06-02T10:00:00Z' }]), true)
})

test('max one active sequence per user: do not create another when one is active', () => {
  assert.equal(shouldCreateSequence([]), true)
  assert.equal(shouldCreateSequence([{ status: 'completed' }]), true)
  assert.equal(shouldCreateSequence([{ status: 'active' }]), false)
})

test('email renders include required Spanish copy, delta, CTA and unsubscribe', () => {
  const context = {
    email: 'ana@example.com',
    language: 'spanish',
    vacancyTitle: 'Marketing Digital',
    originalScore: 54,
    adaptedScore: 81,
    dashboardUrl: 'https://revisamicv.lat/dashboard?auth=x',
    unsubscribeUrl: 'https://revisamicv.lat/api/email/unsubscribe?token=abc',
  }
  const day0 = buildAnalysisEmail('day0', context)
  const day2 = buildAnalysisEmail('day2', context)
  const day6 = buildAnalysisEmail('day6', context)

  assert.match(day0.subject, /listo/i)
  assert.match(day0.text, /Tu CV pasó de 54 a 81 para esta vacante/)
  assert.doesNotMatch(day0.text, /Delta real/i)
  assert.match(day0.html, /Darse de baja/)
  assert.match(day2.subject, /Ya aplicaste con tu CV adaptado/i)
  assert.match(day2.text, /siguiente vacante pide cosas distintas/i)
  assert.match(day2.html, /Analizar mi próxima vacante/)
  assert.match(day6.subject, /Tu CV pasó de 54 a 81/i)
  assert.match(day6.text, /haz lo mismo con la siguiente/i)
  assert.doesNotMatch(day6.text, /delta real/i)
  assert.match(day6.html, /Darse de baja/)
})

test('email renders support English when analysis language is EN', () => {
  const email = buildAnalysisEmail('day2', {
    email: 'ana@example.com',
    language: 'english',
    vacancyTitle: 'Product Manager',
    originalScore: 60,
    adaptedScore: 76,
    dashboardUrl: 'https://revisamicv.lat/dashboard?auth=x',
    unsubscribeUrl: 'https://revisamicv.lat/api/email/unsubscribe?token=abc',
  })
  assert.match(email.subject, /Did you apply/i)
  assert.match(email.text, /next vacancy asks for different things/i)
})

test('sequence step selector returns day0, day2, day6 in order', () => {
  assert.equal(getNextSequenceStep({ day0_sent_at: null, day2_sent_at: null, day6_sent_at: null }), 'day0')
  assert.equal(getNextSequenceStep({ day0_sent_at: 'x', day2_sent_at: null, day6_sent_at: null }), 'day2')
  assert.equal(getNextSequenceStep({ day0_sent_at: 'x', day2_sent_at: 'x', day6_sent_at: null }), 'day6')
  assert.equal(getNextSequenceStep({ day0_sent_at: 'x', day2_sent_at: 'x', day6_sent_at: 'x' }), null)
})

test('unsubscribe URL is signed and includes normalized email', () => {
  const url = buildUnsubscribeUrl(' Ana@Example.COM ', 'seq_123')
  assert.match(url, /email=ana%40example.com/)
  assert.match(url, /sequence_id=seq_123/)
  assert.match(url, /token=/)
})
