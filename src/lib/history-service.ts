import { SupabaseClient } from '@supabase/supabase-js'
import { normalizeEmail } from './token-rules'

type SaveCvHistoryInput = {
  email: string
  cvText: string
  jobDescription: string
  optimizedCv: any
  compatibilityScore: number
  outputLanguage: 'english' | 'spanish'
  vacancyTitle?: string
  requirementsTable?: any
  originalMatchResults?: any
  adaptedMatchResults?: any
  originalScore?: number
  adaptedScore?: number
  scoreBreakdown?: any
  llmModel?: string
}

const MAX_ORIGINAL_TEXT = 2500
const MAX_JOB_DESCRIPTION = 4000
const HISTORY_LIMIT = 20

function toPreview(value: string, maxLength: number) {
  return String(value || '').trim().slice(0, maxLength)
}

export async function saveCvHistory(
  supabase: SupabaseClient,
  input: SaveCvHistoryInput
) {
  const email = normalizeEmail(input.email)
  if (!email) throw new Error('Email is required')

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (userError) throw userError
  if (!user?.id) return null

  const { data, error } = await supabase
    .from('cv_history')
    .insert({
      user_id: user.id,
      original_text: toPreview(input.cvText, MAX_ORIGINAL_TEXT),
      job_description: toPreview(input.jobDescription, MAX_JOB_DESCRIPTION),
      optimized_cv: input.optimizedCv,
      compatibility_score: input.compatibilityScore,
      output_language: input.outputLanguage,
      tokens_used: 1,
      vacancy_title: input.vacancyTitle || null,
      requirements_table: input.requirementsTable || null,
      original_match_results: input.originalMatchResults || null,
      adapted_match_results: input.adaptedMatchResults || null,
      original_score: input.originalScore ?? null,
      adapted_score: input.adaptedScore ?? input.compatibilityScore,
      score_breakdown: input.scoreBreakdown || null,
      llm_model: input.llmModel || null,
    })
    .select('id, created_at')
    .single()

  if (error) throw error
  return data
}

export async function listCvHistory(
  supabase: SupabaseClient,
  emailInput: string
) {
  const email = normalizeEmail(emailInput)
  if (!email) throw new Error('Email is required')

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (userError) throw userError
  if (!user?.id) return { history: [], latest_cv_text: '', lifetime_analyses: 0 }

  const { data, error } = await supabase
    .from('cv_history')
    .select('id, created_at, job_description, original_text, optimized_cv, compatibility_score, output_language, vacancy_title, original_score, adapted_score')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT)

  if (error) throw error

  const history = (data || []).map((item: any) => ({
    id: item.id,
    created_at: item.created_at,
    compatibility_score: item.compatibility_score,
    original_score: item.original_score,
    adapted_score: item.adapted_score,
    output_language: item.output_language,
    optimized_cv: item.optimized_cv,
    vacancy_title: item.vacancy_title,
    job_preview: String(item.job_description || '').replace(/\s+/g, ' ').slice(0, 180),
  }))

  return {
    history,
    latest_cv_text: String(data?.[0]?.original_text || ''),
    lifetime_analyses: data?.length || 0,
  }
}
