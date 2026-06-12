import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe, TOKEN_PACKS } from '@/lib/stripe'
import { validateEmail } from '@/lib/input-validation'
import { normalizeEmail } from '@/lib/token-rules'
import { enforceRateLimits, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { pack, email, returnTo } = await req.json()
    const normalizedEmail = normalizeEmail(email || '')
    const emailError = validateEmail(normalizedEmail)
    if (emailError) return NextResponse.json({ error: 'invalid_email', message: emailError }, { status: 400 })

    const limitCheck = await enforceRateLimits(supabaseAdmin, [
      { scope: 'stripe_checkout_email', identifier: normalizedEmail, limit: 10, windowSeconds: 3600 },
      { scope: 'stripe_checkout_ip', identifier: getClientIp(req), limit: 30, windowSeconds: 3600 },
    ])
    if (!limitCheck.allowed) {
      const limited = rateLimitResponse('Demasiados intentos de compra en poco tiempo. Intenta de nuevo más tarde.', {
        resetSeconds: limitCheck.result?.resetSeconds,
      })
      return NextResponse.json(limited.body, { status: limited.status })
    }

    const packData = TOKEN_PACKS[pack as keyof typeof TOKEN_PACKS]
    if (!packData) return NextResponse.json({ error: 'Invalid pack' }, { status: 400 })

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://revisamicv.lat').trim()
    const checkoutReturnPath = returnTo === 'analysis' ? '/analizar' : '/dashboard'
    const success_url = `${appUrl}${checkoutReturnPath}?payment=success&session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(normalizedEmail)}`
    const cancel_url = `${appUrl}${checkoutReturnPath}?payment=cancelled&email=${encodeURIComponent(normalizedEmail)}`

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `RevisaMiCV - Pack ${packData.name}`,
              description: `${packData.cvCount} análisis de CV con IA para ATS`,
            },
            unit_amount: packData.priceCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: normalizedEmail,
      invoice_creation: { enabled: true },
      payment_intent_data: { receipt_email: normalizedEmail },
      success_url,
      cancel_url,
      metadata: { pack, email: normalizedEmail, cvCount: packData.cvCount.toString() },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}