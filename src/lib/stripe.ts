import Stripe from 'stripe'
import { TOKEN_PACKS } from './token-rules'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
})

export { TOKEN_PACKS }
