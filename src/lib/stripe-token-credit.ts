import { SupabaseClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { creditTokens, ensureUser, getUserTokenState } from './token-service'
import { getPackTokenCount, normalizeEmail } from './token-rules'

export type StripeTokenCreditResult = {
  email: string
  tokensToAdd: number
  credited: boolean
  alreadyCredited: boolean
  tokens: number
  sessionId: string
}

function getSessionEmail(session: Stripe.Checkout.Session): string {
  return normalizeEmail(session.customer_email || session.customer_details?.email || session.metadata?.email || '')
}

function getSessionPack(session: Stripe.Checkout.Session): string {
  return String(session.metadata?.pack || 'basic').trim()
}

function getSessionTokens(session: Stripe.Checkout.Session): number {
  const fromMetadata = Number(session.metadata?.cvCount || 0)
  if (Number.isFinite(fromMetadata) && fromMetadata > 0) return fromMetadata
  return getPackTokenCount(getSessionPack(session)) || 5
}

function getSessionPaidAt(session: Stripe.Checkout.Session): number {
  const paidAt = (session as any).status_transitions?.paid_at
  return Number(paidAt || session.created || 0)
}

export async function creditTokensForPaidCheckoutSession(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session
): Promise<StripeTokenCreditResult> {
  if (session.mode !== 'payment') throw new Error('Checkout session is not a payment')
  if (session.payment_status !== 'paid') throw new Error('Checkout session is not paid')

  const email = getSessionEmail(session)
  const sessionId = session.id
  const tokensToAdd = getSessionTokens(session)
  if (!email) throw new Error('No email in checkout session')
  if (!sessionId) throw new Error('No checkout session id')
  if (!tokensToAdd || tokensToAdd <= 0) throw new Error('No tokens configured for checkout session')

  await ensureUser(supabase, email)

  // Best-effort idempotency without requiring a new DB table yet:
  // if this account was updated after the Stripe session was paid and already has at least
  // this pack's tokens, treat it as already credited. This prevents webhook retries from
  // double-crediting manually/recovered payments while we add a proper payment ledger later.
  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('id, email, tokens, free_used, updated_at')
    .eq('email', email)
    .maybeSingle()

  if (userError) throw userError

  const currentTokens = Math.max(0, Number(userRow?.tokens || 0))
  const updatedAtMs = userRow?.updated_at ? new Date(userRow.updated_at).getTime() : 0
  const paidAtMs = getSessionPaidAt(session) * 1000
  if (updatedAtMs >= paidAtMs && currentTokens >= tokensToAdd) {
    return {
      email,
      tokensToAdd,
      credited: false,
      alreadyCredited: true,
      tokens: currentTokens,
      sessionId,
    }
  }

  const creditedUser = await creditTokens(supabase, email, tokensToAdd)
  return {
    email,
    tokensToAdd,
    credited: true,
    alreadyCredited: false,
    tokens: creditedUser.tokens,
    sessionId,
  }
}
