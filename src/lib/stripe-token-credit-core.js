import { getPackTokenCount, normalizeEmail } from './token-rules.js'

export function getSessionEmail(session) {
  return normalizeEmail(session.customer_email || session.customer_details?.email || session.metadata?.email || '')
}

export function getSessionPack(session) {
  return String(session.metadata?.pack || 'basic').trim()
}

export function getSessionTokens(session) {
  const fromMetadata = Number(session.metadata?.cvCount || 0)
  if (Number.isFinite(fromMetadata) && fromMetadata > 0) return fromMetadata
  return getPackTokenCount(getSessionPack(session)) || 5
}

export function isDuplicatePaymentTransactionError(error) {
  return error?.code === '23505' || /duplicate key|unique constraint/i.test(String(error?.message || ''))
}

export async function insertPaymentTransaction(supabase, { session, user, email, pack, tokensToAdd }) {
  const { data, error } = await supabase
    .from('payment_transactions')
    .insert({
      stripe_session_id: session.id,
      user_id: user.id || null,
      email,
      pack,
      tokens_added: tokensToAdd,
      amount_cents: typeof session.amount_total === 'number' ? session.amount_total : 0,
      currency: String(session.currency || 'USD').toUpperCase(),
      status: 'completed',
    })
    .select()
    .single()

  return { data, error }
}

export async function creditTokensForPaidCheckoutSessionCore({
  supabase,
  session,
  ensureUser,
  creditTokens,
  getUserTokenState,
}) {
  if (session.mode !== 'payment') throw new Error('Checkout session is not a payment')
  if (session.payment_status !== 'paid') throw new Error('Checkout session is not paid')

  const email = getSessionEmail(session)
  const sessionId = session.id
  const pack = getSessionPack(session)
  const tokensToAdd = getSessionTokens(session)

  if (!email) throw new Error('No email in checkout session')
  if (!sessionId) throw new Error('No checkout session id')
  if (!tokensToAdd || tokensToAdd <= 0) throw new Error('No tokens configured for checkout session')

  const user = await ensureUser(supabase, email)

  const { error: insertError } = await insertPaymentTransaction(supabase, {
    session,
    user,
    email,
    pack,
    tokensToAdd,
  })

  if (isDuplicatePaymentTransactionError(insertError)) {
    const current = await getUserTokenState(supabase, email)
    return {
      email,
      tokensToAdd,
      credited: false,
      alreadyCredited: true,
      tokens: current?.tokens || 0,
      sessionId,
    }
  }

  if (insertError) throw insertError

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
