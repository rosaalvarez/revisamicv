import test from 'node:test'
import assert from 'node:assert/strict'
import { isValidStripeCheckoutSessionId, isStripeSessionExpired } from '../src/lib/stripe-session-validation.js'

test('isValidStripeCheckoutSessionId accepts realistic test and live Checkout Session ids', () => {
  assert.equal(isValidStripeCheckoutSessionId('cs_test_1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN'), true)
  assert.equal(isValidStripeCheckoutSessionId('cs_live_1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN'), true)
})

test('isValidStripeCheckoutSessionId rejects short or malformed ids', () => {
  assert.equal(isValidStripeCheckoutSessionId('cs_'), false)
  assert.equal(isValidStripeCheckoutSessionId('cs_test'), false)
  assert.equal(isValidStripeCheckoutSessionId('pi_live_1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN'), false)
  assert.equal(isValidStripeCheckoutSessionId('cs_live_bad-id-with-dash'), false)
})

test('isStripeSessionExpired flags sessions older than max age', () => {
  const nowMs = Date.UTC(2026, 5, 4)
  const thirtyOneDaysAgoSeconds = Math.floor((nowMs - 31 * 24 * 60 * 60 * 1000) / 1000)
  const recentSeconds = Math.floor((nowMs - 2 * 24 * 60 * 60 * 1000) / 1000)

  assert.equal(isStripeSessionExpired({ created: thirtyOneDaysAgoSeconds }, { nowMs, maxAgeDays: 30 }), true)
  assert.equal(isStripeSessionExpired({ created: recentSeconds }, { nowMs, maxAgeDays: 30 }), false)
})
