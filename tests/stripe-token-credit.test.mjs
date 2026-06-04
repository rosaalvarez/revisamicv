import test from 'node:test'
import assert from 'node:assert/strict'
import { creditTokensForPaidCheckoutSessionCore } from '../src/lib/stripe-token-credit-core.js'

function createQueryBuilder(state, table) {
  const query = {
    _op: null,
    _insertRecord: null,
    _eqField: null,
    _eqValue: null,
    select() { return this },
    eq(field, value) { this._eqField = field; this._eqValue = value; return this },
    insert(record) { this._op = 'insert'; this._insertRecord = record; return this },
    async single() {
      if (table === 'payment_transactions' && this._op === 'insert') {
        if (state.transactions.has(this._insertRecord.stripe_session_id)) {
          return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } }
        }
        const inserted = { id: state.transactions.size + 1, ...this._insertRecord }
        state.transactions.set(this._insertRecord.stripe_session_id, inserted)
        return { data: inserted, error: null }
      }
      throw new Error(`Unhandled single ${table} ${this._op}`)
    },
  }
  return query
}

function createFakeSupabase() {
  const state = { transactions: new Map() }
  return {
    state,
    from(table) { return createQueryBuilder(state, table) },
  }
}

function createTokenStore(initial = {}) {
  const users = new Map(Object.entries(initial))
  return {
    users,
    async ensureUser(_supabase, email) {
      if (!users.has(email)) users.set(email, { email, tokens: 0 })
      return users.get(email)
    },
    async creditTokens(_supabase, email, tokensToAdd) {
      const user = users.get(email) || { email, tokens: 0 }
      user.tokens += tokensToAdd
      users.set(email, user)
      return user
    },
    async getUserTokenState(_supabase, email) {
      return users.get(email) || { email, tokens: 0 }
    },
  }
}

function mockPaidSession(overrides = {}) {
  return {
    id: 'cs_test_session_12345678901234567890123456789012345678901234567890',
    mode: 'payment',
    payment_status: 'paid',
    customer_email: 'buyer@example.com',
    customer_details: null,
    metadata: { pack: 'pro', cvCount: '15', email: 'buyer@example.com' },
    amount_total: 1200,
    currency: 'usd',
    created: 1760000000,
    status_transitions: { paid_at: 1760000100 },
    ...overrides,
  }
}

test('creditTokensForPaidCheckoutSessionCore credits a paid session once and records the transaction', async () => {
  const supabase = createFakeSupabase()
  const tokenStore = createTokenStore({ 'buyer@example.com': { email: 'buyer@example.com', tokens: 2 } })

  const result = await creditTokensForPaidCheckoutSessionCore({ supabase, session: mockPaidSession(), ...tokenStore })

  assert.equal(result.credited, true)
  assert.equal(result.alreadyCredited, false)
  assert.equal(result.tokensToAdd, 15)
  assert.equal(result.tokens, 17)
  assert.equal(supabase.state.transactions.size, 1)
  const [transaction] = supabase.state.transactions.values()
  assert.equal(transaction.stripe_session_id, result.sessionId)
  assert.equal(transaction.email, 'buyer@example.com')
  assert.equal(transaction.pack, 'pro')
  assert.equal(transaction.tokens_added, 15)
  assert.equal(transaction.amount_cents, 1200)
  assert.equal(transaction.currency, 'USD')
})

test('creditTokensForPaidCheckoutSessionCore treats duplicate Stripe sessions as already credited', async () => {
  const session = mockPaidSession()
  const supabase = createFakeSupabase()
  const tokenStore = createTokenStore({ 'buyer@example.com': { email: 'buyer@example.com', tokens: 2 } })

  const first = await creditTokensForPaidCheckoutSessionCore({ supabase, session, ...tokenStore })
  const second = await creditTokensForPaidCheckoutSessionCore({ supabase, session, ...tokenStore })

  assert.equal(first.credited, true)
  assert.equal(second.credited, false)
  assert.equal(second.alreadyCredited, true)
  assert.equal(second.tokens, 17)
  assert.equal(tokenStore.users.get('buyer@example.com').tokens, 17)
  assert.equal(supabase.state.transactions.size, 1)
})

test('creditTokensForPaidCheckoutSessionCore credits different sessions for the same user', async () => {
  const supabase = createFakeSupabase()
  const tokenStore = createTokenStore({ 'buyer@example.com': { email: 'buyer@example.com', tokens: 0 } })

  await creditTokensForPaidCheckoutSessionCore({ supabase, session: mockPaidSession({ id: 'cs_test_first_12345678901234567890123456789012345678901234567890', metadata: { pack: 'basic', cvCount: '5' }, amount_total: 500 }), ...tokenStore })
  const second = await creditTokensForPaidCheckoutSessionCore({ supabase, session: mockPaidSession({ id: 'cs_test_second_12345678901234567890123456789012345678901234567890', metadata: { pack: 'premium', cvCount: '30' }, amount_total: 1900 }), ...tokenStore })

  assert.equal(second.credited, true)
  assert.equal(second.tokens, 35)
  assert.equal(tokenStore.users.get('buyer@example.com').tokens, 35)
  assert.equal(supabase.state.transactions.size, 2)
})
