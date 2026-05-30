import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TOKEN_MAP: Record<string, number> = {
  basic: 5,
  pro: 15,
  premium: 30,
}

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
    const tokens = TOKEN_MAP[pack] || 5

    if (!email) {
      console.error('No email in checkout session')
      return NextResponse.json({ error: 'No email' }, { status: 400 })
    }

    // Find or create user, add tokens
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id, tokens')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existing) {
      await supabaseAdmin
        .from('users')
        .update({
          tokens: existing.tokens + tokens,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
      console.log(`✓ Credited ${tokens} tokens to ${email} (now: ${existing.tokens + tokens})`)
    } else {
      await supabaseAdmin.from('users').insert({
        email: email.toLowerCase().trim(),
        tokens,
        free_used: false,
      })
      console.log(`✓ Created user ${email} with ${tokens} tokens`)
    }
  }

  return NextResponse.json({ received: true })
}