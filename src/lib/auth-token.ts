import crypto from 'crypto'
import { normalizeEmail } from './token-rules'

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7

function getSecret() {
  return process.env.MAGIC_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.STRIPE_SECRET_KEY || 'dev-only-revisamicv-secret'
}

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString('base64url')
}

function signPayload(payload: string) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url')
}

export function createAuthToken(emailInput: string, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const email = normalizeEmail(emailInput)
  if (!email) throw new Error('Email is required')
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds
  const nonce = crypto.randomBytes(12).toString('base64url')
  const payload = base64url(JSON.stringify({ email, exp: expiresAt, nonce }))
  const signature = signPayload(payload)
  return `${payload}.${signature}`
}

export function verifyAuthToken(tokenInput: string, expectedEmailInput?: string) {
  const token = String(tokenInput || '').trim()
  const [payload, signature] = token.split('.')
  if (!payload || !signature) throw new Error('Invalid auth token')

  const expectedSignature = signPayload(payload)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)
  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    throw new Error('Invalid auth token')
  }

  const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  const email = normalizeEmail(parsed.email || '')
  const expectedEmail = normalizeEmail(expectedEmailInput || '')
  if (!email) throw new Error('Invalid auth token')
  if (expectedEmail && email !== expectedEmail) throw new Error('Email does not match auth token')
  if (!parsed.exp || Number(parsed.exp) < Math.floor(Date.now() / 1000)) throw new Error('Auth token expired')
  return { email, expiresAt: Number(parsed.exp) }
}

export function createMagicDashboardLink(emailInput: string) {
  const email = normalizeEmail(emailInput)
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://revisamicv.lat').trim().replace(/\/+$/, '')
  const token = createAuthToken(email)
  return `${appUrl}/dashboard?email=${encodeURIComponent(email)}&auth=${encodeURIComponent(token)}`
}
