import { SupabaseClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { creditTokens, ensureUser, getUserTokenState } from './token-service'
import { creditTokensForPaidCheckoutSessionCore } from './stripe-token-credit-core'

export type StripeTokenCreditResult = {
  email: string
  tokensToAdd: number
  credited: boolean
  alreadyCredited: boolean
  tokens: number
  sessionId: string
}

export async function creditTokensForPaidCheckoutSession(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session
): Promise<StripeTokenCreditResult> {
  return creditTokensForPaidCheckoutSessionCore({
    supabase,
    session,
    ensureUser,
    creditTokens,
    getUserTokenState,
  })
}
