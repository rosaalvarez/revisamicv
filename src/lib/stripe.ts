import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
})

export const TOKEN_PACKS = {
  basic: {
    name: 'Básico',
    cvCount: 5,
    priceUSD: 5,
    priceCents: 500,
    description: '5 CVs optimizados',
    popular: false,
  },
  pro: {
    name: 'Pro',
    cvCount: 15,
    priceUSD: 12,
    priceCents: 1200,
    description: '15 CVs optimizados',
    popular: true,
  },
  premium: {
    name: 'Premium',
    cvCount: 30,
    priceUSD: 19,
    priceCents: 1900,
    description: '30 CVs optimizados',
    popular: false,
  },
} as const