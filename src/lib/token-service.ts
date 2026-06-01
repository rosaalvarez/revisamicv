import { SupabaseClient } from '@supabase/supabase-js'
import { getUsageDecision, normalizeEmail } from './token-rules'

export type UserTokenState = {
  id?: number | string
  email: string
  tokens: number
  free_used: boolean
  exists: boolean
}

export type TokenDecision = ReturnType<typeof getUsageDecision>

function normalizeUser(row: any, email: string): UserTokenState {
  return {
    id: row?.id,
    email,
    tokens: Math.max(0, Number(row?.tokens || 0)),
    free_used: Boolean(row?.free_used),
    exists: Boolean(row),
  }
}

export async function getUserTokenState(
  supabase: SupabaseClient,
  emailInput: string
): Promise<UserTokenState> {
  const email = normalizeEmail(emailInput)
  if (!email) throw new Error('Email is required')

  const { data, error } = await supabase
    .from('users')
    .select('id, email, tokens, free_used')
    .eq('email', email)
    .maybeSingle()

  if (error) throw error
  return normalizeUser(data, email)
}

export async function canGenerateCv(
  supabase: SupabaseClient,
  emailInput: string
): Promise<TokenDecision> {
  const user = await getUserTokenState(supabase, emailInput)
  return getUsageDecision(user.exists ? user : null)
}

export async function ensureUser(
  supabase: SupabaseClient,
  emailInput: string
): Promise<UserTokenState> {
  const current = await getUserTokenState(supabase, emailInput)
  if (current.exists) return current

  const { data, error } = await supabase
    .from('users')
    .insert({
      email: current.email,
      tokens: 0,
      free_used: false,
    })
    .select('id, email, tokens, free_used')
    .single()

  if (error) throw error
  return normalizeUser(data, current.email)
}

export async function consumeCvCredit(
  supabase: SupabaseClient,
  emailInput: string
): Promise<TokenDecision> {
  const user = await ensureUser(supabase, emailInput)
  const decision = getUsageDecision(user)

  if (!decision.allowed) return decision

  if (decision.reason === 'free_available') {
    const { data, error } = await supabase
      .from('users')
      .update({
        free_used: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('id, email, tokens, free_used')
      .single()

    if (error) throw error
    return getUsageDecision(normalizeUser(data, user.email))
  }

  const newTokens = Math.max(0, user.tokens - 1)
  const { data, error } = await supabase
    .from('users')
    .update({
      tokens: newTokens,
      free_used: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select('id, email, tokens, free_used')
    .single()

  if (error) throw error
  return {
    allowed: true,
    reason: 'token_consumed',
    tokens_remaining: normalizeUser(data, user.email).tokens,
    free_used: true,
  } as any
}

export async function creditTokens(
  supabase: SupabaseClient,
  emailInput: string,
  tokensToAdd: number
): Promise<UserTokenState> {
  const user = await ensureUser(supabase, emailInput)
  const add = Math.max(0, Number(tokensToAdd || 0))
  if (add <= 0) throw new Error('tokensToAdd must be greater than zero')

  const { data, error } = await supabase
    .from('users')
    .update({
      tokens: user.tokens + add,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select('id, email, tokens, free_used')
    .single()

  if (error) throw error
  return normalizeUser(data, user.email)
}
