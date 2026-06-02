import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { creditTokensForPaidCheckoutSession } from '@/lib/stripe-token-credit'
import { normalizeEmail } from '@/lib/token-rules'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { session_id, email } = await req.json()
    const sessionId = String(session_id || '').trim()
    const expectedEmail = normalizeEmail(email || '')

    if (!sessionId || !sessionId.startsWith('cs_')) {
      return NextResponse.json({ error: 'invalid_session', message: 'No recibí una sesión de pago válida.' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const sessionEmail = normalizeEmail(session.customer_email || session.customer_details?.email || session.metadata?.email || '')

    if (expectedEmail && sessionEmail && expectedEmail !== sessionEmail) {
      return NextResponse.json(
        { error: 'email_mismatch', message: 'El pago pertenece a otro email. Usa el email con el que pagaste.' },
        { status: 400 }
      )
    }

    const result = await creditTokensForPaidCheckoutSession(supabaseAdmin, session)
    return NextResponse.json({
      ok: true,
      email: result.email,
      tokens: result.tokens,
      tokens_added: result.credited ? result.tokensToAdd : 0,
      already_credited: result.alreadyCredited,
      message: result.credited
        ? `Pago confirmado. Se acreditaron ${result.tokensToAdd} tokens.`
        : 'Pago confirmado. Tus tokens ya estaban acreditados.',
    })
  } catch (error: any) {
    console.error('Payment recovery failed:', error?.message || error)
    return NextResponse.json(
      { error: 'payment_recovery_failed', message: 'No pude confirmar el pago todavía. Si Stripe ya cobró, escríbenos y lo acreditamos manualmente.' },
      { status: 500 }
    )
  }
}
