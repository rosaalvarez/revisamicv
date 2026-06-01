import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getPackTokenCount,
  getUsageDecision,
  normalizeEmail,
} from '../src/lib/token-rules.js'

test('normalizeEmail lowercases and trims emails', () => {
  assert.equal(normalizeEmail('  Rosa@Example.COM '), 'rosa@example.com')
})

test('getPackTokenCount maps commercial packs to token counts', () => {
  assert.equal(getPackTokenCount('basic'), 5)
  assert.equal(getPackTokenCount('pro'), 15)
  assert.equal(getPackTokenCount('premium'), 30)
  assert.equal(getPackTokenCount('unknown'), 0)
})

test('getUsageDecision allows first free CV for new or free_available users', () => {
  assert.deepEqual(getUsageDecision(null), {
    allowed: true,
    reason: 'free_available',
    tokens_remaining: 0,
    free_used: false,
  })
  assert.equal(getUsageDecision({ tokens: 0, free_used: false }).allowed, true)
})

test('getUsageDecision allows paid token users and blocks exhausted users', () => {
  assert.deepEqual(getUsageDecision({ tokens: 2, free_used: true }), {
    allowed: true,
    reason: 'tokens_available',
    tokens_remaining: 2,
    free_used: true,
  })
  assert.deepEqual(getUsageDecision({ tokens: 0, free_used: true }), {
    allowed: false,
    reason: 'no_tokens',
    tokens_remaining: 0,
    free_used: true,
  })
})
