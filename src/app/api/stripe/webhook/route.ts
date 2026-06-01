import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { creditTokens } from '@/lib/token-service'
import { getPackTokenCount } from '@/lib/token-rules'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const email = session.customer_email || session.metadata?.email
    const pack = session.metadata?.pack || 'basic'
    const tokens = getPackTokenCount(pack) || 5

    if (!email) {
      console.error('No email in checkout session')
      return NextResponse.json({ error: 'No email' }, { status: 400 })
    }

    try {
      const user = await creditTokens(supabaseAdmin, email, tokens)
      console.log(`✓ Credited ${tokens} tokens to ${user.email} (now: ${user.tokens})`)
    } catch (error: any) {
      console.error('Token credit failed:', error?.message || error)
      return NextResponse.json({ error: 'Token credit failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}