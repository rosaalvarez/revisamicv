import { SupabaseClient } from '@supabase/supabase-js'
import { buildAnalysisEmail, buildUnsubscribeUrl, getNextSequenceStep, shouldCreateSequence, verifyUnsubscribeToken } from './analysis-email-sequence.js'
import { sendEmail } from './email-service'
import { createMagicDashboardLink } from './auth-token'
import { normalizeEmail } from './token-rules'

const SEQUENCE_TABLE = 'analysis_email_sequences'

export async function startAnalysisEmailSequence(supabase: SupabaseClient, input: {
  email: string
  analysisId: string | number
  vacancyTitle?: string
  originalScore?: number | null
  adaptedScore?: number | null
  language?: 'english' | 'spanish'
}) {
  const email = normalizeEmail(input.email)
  if (!email || !input.analysisId) return { skipped: true, reason: 'missing_input' }

  const { data: existing, error: existingError } = await supabase
    .from(SEQUENCE_TABLE)
    .select('id, status')
    .eq('email', email)
    .eq('status', 'active')
    .limit(1)

  if (existingError) throw existingError
  if (!shouldCreateSequence(existing || [])) return { skipped: true, reason: 'active_sequence_exists' }

  const sequenceId = `${input.analysisId}`
  const dashboardUrl = createMagicDashboardLink(email)
  const unsubscribeUrl = buildUnsubscribeUrl(email, sequenceId)
  const emailPayload = buildAnalysisEmail('day0', {
    email,
    sequenceId,
    language: input.language || 'spanish',
    vacancyTitle: input.vacancyTitle || 'esta vacante',
    originalScore: input.originalScore,
    adaptedScore: input.adaptedScore,
    dashboardUrl,
    unsubscribeUrl,
  })

  await sendEmail({ to: email, ...emailPayload })

  const now = new Date()
  const day2 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
  const day6 = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000)
  const { error: insertError } = await supabase.from(SEQUENCE_TABLE).insert({
    id: sequenceId,
    email,
    analysis_id: input.analysisId,
    vacancy_title: input.vacancyTitle || null,
    original_score: input.originalScore ?? null,
    adapted_score: input.adaptedScore ?? null,
    output_language: input.language || 'spanish',
    status: 'active',
    day0_sent_at: now.toISOString(),
    day2_due_at: day2.toISOString(),
    day6_due_at: day6.toISOString(),
  })
  if (insertError) throw insertError
  return { ok: true, sequenceId }
}

export async function unsubscribeAnalysisEmails(supabase: SupabaseClient, input: { email: string; sequenceId: string; token: string }) {
  const email = normalizeEmail(input.email)
  if (!verifyUnsubscribeToken(email, input.sequenceId, input.token)) return { ok: false, status: 400, message: 'Enlace inválido.' }
  const { error } = await supabase
    .from(SEQUENCE_TABLE)
    .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    .eq('id', input.sequenceId)
    .eq('email', email)
  if (error) throw error
  return { ok: true, status: 200, message: 'Listo. Ya no enviaremos recordatorios de este análisis.' }
}

export async function dispatchDueAnalysisEmails(supabase: SupabaseClient, now = new Date()) {
  const { data: sequences, error } = await supabase
    .from(SEQUENCE_TABLE)
    .select('id, email, analysis_id, vacancy_title, original_score, adapted_score, output_language, status, day0_sent_at, day2_sent_at, day6_sent_at, day2_due_at, day6_due_at, created_at')
    .eq('status', 'active')
    .or(`day2_due_at.lte.${now.toISOString()},day6_due_at.lte.${now.toISOString()}`)
    .limit(50)
  if (error) throw error

  const results = []
  for (const sequence of sequences || []) {
    const step = getNextSequenceStep(sequence)
    if (!step || step === 'day0') continue
    const dueAt = step === 'day2' ? sequence.day2_due_at : sequence.day6_due_at
    if (!dueAt || Date.parse(dueAt) > now.getTime()) continue

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', sequence.email)
      .maybeSingle()
    if (userError) throw userError
    const { data: newer, error: newerError } = user?.id ? await supabase
      .from('cv_history')
      .select('id, created_at')
      .eq('user_id', user.id)
      .gt('created_at', sequence.created_at)
      .neq('id', sequence.analysis_id)
      .limit(1) : { data: [], error: null }
    if (newerError) throw newerError
    if (newer?.length) {
      await supabase.from(SEQUENCE_TABLE).update({ status: 'suppressed', suppressed_at: now.toISOString() }).eq('id', sequence.id)
      results.push({ id: sequence.id, status: 'suppressed' })
      continue
    }

    const unsubscribeUrl = buildUnsubscribeUrl(sequence.email, sequence.id)
    const payload = buildAnalysisEmail(step, {
      email: sequence.email,
      sequenceId: sequence.id,
      language: sequence.output_language,
      vacancyTitle: sequence.vacancy_title || 'esta vacante',
      originalScore: sequence.original_score,
      adaptedScore: sequence.adapted_score,
      dashboardUrl: createMagicDashboardLink(sequence.email),
      unsubscribeUrl,
    })
    await sendEmail({ to: sequence.email, ...payload })
    const patch = step === 'day2'
      ? { day2_sent_at: now.toISOString() }
      : { day6_sent_at: now.toISOString(), status: 'completed' }
    await supabase.from(SEQUENCE_TABLE).update(patch).eq('id', sequence.id)
    results.push({ id: sequence.id, status: 'sent', step })
  }
  return results
}
