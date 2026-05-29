import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET || '')
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const email = session.metadata?.email
    const cvCount = parseInt(session.metadata?.cvCount || '0')

    if (email && cvCount > 0) {
      // Find or create user, add tokens
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('tokens')
        .eq('email', email)
        .single()

      if (existing) {
        await supabaseAdmin
          .from('users')
          .update({ tokens: existing.tokens + cvCount })
          .eq('email', email)
      } else {
        await supabaseAdmin.from('users').insert({ email, tokens: cvCount })
      }
    }
  }

  return NextResponse.json({ received: true })
}