import test from 'node:test'
import assert from 'node:assert/strict'
import { checkRateLimit, getClientIp, rateLimitResponse } from '../src/lib/rate-limit.js'

function createRpcSupabase(handler) {
  return {
    calls: [],
    async rpc(name, payload) {
      this.calls.push({ name, payload })
      return handler(name, payload)
    },
  }
}

test('getClientIp prefers first x-forwarded-for address', () => {
  const req = { headers: { get: (name) => name === 'x-forwarded-for' ? '1.2.3.4, 5.6.7.8' : null } }
  assert.equal(getClientIp(req), '1.2.3.4')
})

test('checkRateLimit returns allowed result from Supabase RPC', async () => {
  const supabase = createRpcSupabase(async () => ({ data: { allowed: true, remaining: 2, reset_seconds: 3600 }, error: null }))

  const result = await checkRateLimit(supabase, {
    scope: 'magic_link_email',
    identifier: 'test@example.com',
    limit: 3,
    windowSeconds: 3600,
  })

  assert.equal(result.allowed, true)
  assert.equal(result.remaining, 2)
  assert.equal(supabase.calls[0].name, 'check_rate_limit')
  assert.deepEqual(supabase.calls[0].payload, {
    p_scope: 'magic_link_email',
    p_identifier: 'test@example.com',
    p_max_requests: 3,
    p_window_seconds: 3600,
  })
})

test('checkRateLimit fail-opens when rate limit table/function is missing', async () => {
  const supabase = createRpcSupabase(async () => ({ data: null, error: { code: '42883', message: 'function does not exist' } }))

  const result = await checkRateLimit(supabase, {
    scope: 'magic_link_ip',
    identifier: '1.2.3.4',
    limit: 10,
    windowSeconds: 3600,
  })

  assert.equal(result.allowed, true)
  assert.equal(result.failOpen, true)
})

test('rateLimitResponse returns friendly 429 body', () => {
  const res = rateLimitResponse('Demasiadas solicitudes. Intenta de nuevo en unos minutos.', { resetSeconds: 120 })

  assert.equal(res.status, 429)
  assert.equal(res.body.error, 'rate_limit_exceeded')
  assert.equal(res.body.reset_seconds, 120)
})
