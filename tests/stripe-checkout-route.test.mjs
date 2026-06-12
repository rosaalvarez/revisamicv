import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const routeSource = readFileSync(new URL('../src/app/api/stripe/checkout/route.ts', import.meta.url), 'utf8')

test('Stripe checkout can return to the analysis wizard for credits=0 recovery', () => {
  assert.match(routeSource, /returnTo/)
  assert.match(routeSource, /returnTo === 'analysis' \? '\/analizar' : '\/dashboard'/)
  assert.match(routeSource, /success_url = `\$\{appUrl\}\$\{checkoutReturnPath\}\?payment=success/)
  assert.match(routeSource, /cancel_url = `\$\{appUrl\}\$\{checkoutReturnPath\}\?payment=cancelled/)
})
