export function getClientIp(req) {
  const forwardedFor = req?.headers?.get?.('x-forwarded-for') || ''
  if (forwardedFor) return forwardedFor.split(',')[0].trim() || 'unknown'
  return req?.headers?.get?.('x-real-ip') || 'unknown'
}

export async function checkRateLimit(supabase, { scope, identifier, limit, windowSeconds }) {
  const safeIdentifier = String(identifier || 'unknown').trim().toLowerCase() || 'unknown'
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_scope: scope,
    p_identifier: safeIdentifier,
    p_max_requests: limit,
    p_window_seconds: windowSeconds,
  })

  if (error) {
    console.warn('Rate limit check failed open:', error?.message || error)
    return { allowed: true, remaining: limit, resetSeconds: windowSeconds, failOpen: true }
  }

  return {
    allowed: Boolean(data?.allowed),
    remaining: Math.max(0, Number(data?.remaining || 0)),
    resetSeconds: Math.max(0, Number(data?.reset_seconds || windowSeconds)),
    failOpen: false,
  }
}

export function rateLimitResponse(message, { resetSeconds = 0 } = {}) {
  return {
    status: 429,
    body: {
      error: 'rate_limit_exceeded',
      message,
      reset_seconds: resetSeconds,
    },
  }
}

export async function enforceRateLimits(supabase, limits) {
  for (const limit of limits) {
    const result = await checkRateLimit(supabase, limit)
    if (!result.allowed) return { allowed: false, result, limit }
  }
  return { allowed: true }
}
