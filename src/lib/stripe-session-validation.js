export function isValidStripeCheckoutSessionId(sessionId) {
  return /^cs_(test|live)_[A-Za-z0-9]{30,}$/.test(String(sessionId || '').trim())
}

export function isStripeSessionExpired(session, { nowMs = Date.now(), maxAgeDays = 30 } = {}) {
  const createdSeconds = Number(session?.created || 0)
  if (!Number.isFinite(createdSeconds) || createdSeconds <= 0) return true
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000
  return nowMs - createdSeconds * 1000 > maxAgeMs
}
