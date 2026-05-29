'use client'

import { useState } from 'react'
import { TOKEN_PACKS } from '@/lib/stripe'
import { ArrowRightIcon, DocumentIcon } from '@/components/icons'

export default function DashboardPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<{ tokens: number } | null>(null)
  const [error, setError] = useState('')

  const checkTokens = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUser(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBuy = async (pack: keyof typeof TOKEN_PACKS) => {
    if (!email) return
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack, email }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-2xl mx-auto pt-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 text-center">Mis CVs</h1>
        <p className="text-slate-600 mb-8 text-center">Revisa tu saldo y compra más tokens</p>

        {!user ? (
          <form onSubmit={checkTokens} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm max-w-md mx-auto">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Tu email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full border border-slate-300 rounded-xl p-3 text-sm mb-4 focus:ring-2 focus:ring-purple-500 outline-none"
              required
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 rounded-full font-semibold hover:bg-purple-700 transition disabled:opacity-50"
            >
              {loading ? 'Buscando...' : 'Ver mi cuenta'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
              <p className="text-slate-500 mb-2">{email}</p>
              <div className="text-5xl font-bold text-purple-600 mb-2">{user.tokens}</div>
              <p className="text-slate-600">CVs disponibles</p>
              {user.tokens === 0 && (
                <p className="text-orange-600 text-sm mt-2">¡Sin tokens! Compra más abajo</p>
              )}
            </div>

            {user.tokens > 0 && (
              <a
                href="/signup"
                className="flex items-center justify-center gap-2 bg-green-600 text-white py-4 rounded-full font-semibold hover:bg-green-700 transition"
              >
                <DocumentIcon className="w-5 h-5" />
                Usar un token ahora
              </a>
            )}

            <h2 className="text-xl font-semibold text-slate-900 pt-4">Comprar más tokens</h2>
            <div className="grid grid-cols-3 gap-4">
              {(Object.keys(TOKEN_PACKS) as Array<keyof typeof TOKEN_PACKS>).map((pack) => {
                const p = TOKEN_PACKS[pack]
                return (
                  <button
                    key={pack}
                    onClick={() => handleBuy(pack)}
                    className={`rounded-2xl border-2 p-4 text-center transition hover:shadow-md ${
                      p.popular ? 'border-purple-500 bg-purple-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <p className="font-bold text-slate-900">{p.name}</p>
                    <p className="text-2xl font-bold text-purple-600 my-1">${p.priceUSD}</p>
                    <p className="text-sm text-slate-500">{p.cvCount} CVs</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}