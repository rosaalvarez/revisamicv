import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { creditTokensForPaidCheckoutSession } from '@/lib/stripe-token-credit'
import { normalizeEmail } from '@/lib/token-rules'
import { createAuthToken } from '@/lib/auth-token'
import { sendPurchaseConfirmedEmail } from '@/lib/email-service'
import { isStripeSessionExpired, isValidStripeCheckoutSessionId } from '@/lib/stripe-session-validation'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { session_id, email } = await req.json()
    const sessionId = String(session_id || '').trim()
    const expectedEmail = normalizeEmail(email || '')

    if (!isValidStripeCheckoutSessionId(sessionId)) {
      return NextResponse.json({ error: 'invalid_session', message: 'No recibí una sesión de pago válida.' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (isStripeSessionExpired(session, { maxAgeDays: 30 })) {
      return NextResponse.json(
        { error: 'session_expired', message: 'Esta sesión de pago ya expiró. Si pagaste y no recibiste créditos, escribe a soporte@revisamicv.lat.' },
        { status: 410 }
      )
    }

    const sessionEmail = normalizeEmail(session.customer_email || session.customer_details?.email || session.metadata?.email || '')

    if (expectedEmail && sessionEmail && expectedEmail !== sessionEmail) {
      return NextResponse.json(
        { error: 'email_mismatch', message: 'El pago pertenece a otro email. Usa el email con el que pagaste.' },
        { status: 400 }
      )
    }

    const result = await creditTokensForPaidCheckoutSession(supabaseAdmin, session)
    try {
      await sendPurchaseConfirmedEmail(result.email, result.tokensToAdd, result.tokens)
    } catch (err: any) {
      console.error('Purchase email failed:', err?.message || err)
    }
    return NextResponse.json({
      ok: true,
      email: result.email,
      auth_token: createAuthToken(result.email),
      tokens: result.tokens,
      tokens_added: result.credited ? result.tokensToAdd : 0,
      already_credited: result.alreadyCredited,
      pack: session.metadata?.pack || null,
      purchase_value: typeof session.amount_total === 'number' ? session.amount_total / 100 : null,
      currency: session.currency?.toUpperCase() || 'USD',
      transaction_id: session.id,
      message: result.credited
        ? `Pago confirmado. Se acreditaron ${result.tokensToAdd} créditos.`
        : 'Pago confirmado. Tus créditos ya estaban acreditados.',
    })
  } catch (error: any) {
    console.error('Payment recovery failed:', error?.message || error)
    return NextResponse.json(
      { error: 'payment_recovery_failed', message: 'No pude confirmar el pago todavía. Si Stripe ya cobró, escríbenos y lo acreditamos manualmente.' },
      { status: 500 }
    )
  }
}
