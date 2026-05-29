import { NextRequest, NextResponse } from 'next/server'
import { stripe, TOKEN_PACKS } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { pack, email } = await req.json()
    const packData = TOKEN_PACKS[pack as keyof typeof TOKEN_PACKS]
    if (!packData) return NextResponse.json({ error: 'Invalid pack' }, { status: 400 })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `RevisaMiCV - Pack ${packData.name}`,
              description: `${packData.cvCount} CVs optimizados con IA para ATS`,
            },
            unit_amount: packData.priceCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: email,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/#pricing`,
      metadata: { pack, email, cvCount: packData.cvCount.toString() },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}