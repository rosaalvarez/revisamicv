export const TOKEN_PACKS = {
  basic: {
    name: 'Básico',
    cvCount: 5,
    priceUSD: 5,
    priceCents: 500,
    description: '5 vacantes donde aplicas como candidato local',
    popular: false,
  },
  pro: {
    name: 'Pro',
    cvCount: 15,
    priceUSD: 12,
    priceCents: 1200,
    description: '15 oportunidades con CV blindado',
    popular: true,
  },
  premium: {
    name: 'Premium',
    cvCount: 30,
    priceUSD: 19,
    priceCents: 1900,
    description: '30 aplicaciones nivel US',
    popular: false,
  },
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

export function getPack(pack) {
  return TOKEN_PACKS[String(pack || '').trim()] || null
}

export function getPackTokenCount(pack) {
  return getPack(pack)?.cvCount || 0
}

export function getUsageDecision(user) {
  if (!user) {
    return {
      allowed: true,
      reason: 'free_available',
      tokens_remaining: 0,
      free_used: false,
    }
  }

  const tokens = Math.max(0, Number(user.tokens || 0))
  const freeUsed = Boolean(user.free_used)

  if (!freeUsed) {
    return {
      allowed: true,
      reason: 'free_available',
      tokens_remaining: tokens,
      free_used: false,
    }
  }

  if (tokens > 0) {
    return {
      allowed: true,
      reason: 'tokens_available',
      tokens_remaining: tokens,
      free_used: true,
    }
  }

  return {
    allowed: false,
    reason: 'no_tokens',
    tokens_remaining: 0,
    free_used: true,
  }
}
