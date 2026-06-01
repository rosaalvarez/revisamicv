'use client'

import { useEffect, useState } from 'react'
import { TOKEN_PACKS } from '@/lib/token-rules'
import { ArrowRightIcon, DocumentIcon, SparklesIcon } from '@/components/icons'
import { getFriendlyApiError, validateEmail } from '@/lib/input-validation'

type UserState = {
  email: string
  tokens: number
  free_used: boolean
  has_free_cv: boolean
}

type HistoryItem = {
  id: number | string
  created_at: string
  compatibility_score: number | null
  output_language: 'english' | 'spanish'
  optimized_cv: any
  job_preview: string
}

const PACKS = TOKEN_PACKS as Record<string, {
  name: string
  cvCount: number
  priceUSD: number
  description: string
  popular: boolean
}>

export default function DashboardPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [pdfLoadingId, setPdfLoadingId] = useState<string | number | null>(null)
  const [user, setUser] = useState<UserState | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selectedPack, setSelectedPack] = useState<string>('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const queryEmail = params.get('email') || ''
    const savedEmail = window.localStorage.getItem('revisamicv_email') || ''
    const initialEmail = queryEmail || savedEmail
    const payment = params.get('payment')
    const pack = params.get('pack') || ''
    if (pack && PACKS[pack]) {
      setSelectedPack(pack)
      setNotice(`Pack ${PACKS[pack].name} seleccionado. Escribe tu email y presiona comprar para acreditar tus tokens.`)
    }

    if (payment === 'success') setNotice('Pago recibido. Tus tokens pueden tardar unos segundos en aparecer.')
    if (payment === 'cancelled') setNotice('Pago cancelado. No se hizo ningún cargo.')

    if (initialEmail) {
      setEmail(initialEmail)
      checkAccount(initialEmail)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAccount = async (emailToCheck = email) => {
    const emailError = validateEmail(emailToCheck)
    if (emailError) {
      setError(emailError)
      return
    }

    setLoading(true)
    setError('')
    setNotice((current) => current)

    try {
      const [userRes, historyRes] = await Promise.all([
        fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailToCheck.trim().toLowerCase() }),
        }),
        fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailToCheck.trim().toLowerCase() }),
        }),
      ])

      const userData = await userRes.json()
      const historyData = await historyRes.json()
      if (!userRes.ok) throw new Error(userData.message || userData.error)
      if (!historyRes.ok) throw new Error(historyData.message || historyData.error)

      window.localStorage.setItem('revisamicv_email', emailToCheck.trim().toLowerCase())
      setUser(userData)
      setHistory(historyData.history || [])
    } catch (err: any) {
      setError(getFriendlyApiError(err.message, 'No pude cargar tu cuenta'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await checkAccount(email)
  }

  const handleBuy = async (pack: string) => {
    const emailError = validateEmail(email)
    if (emailError) return setError(emailError)
    setError('')

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack, email: email.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'No pude iniciar el pago')
      if (data.url) window.location.href = data.url
    } catch (err: any) {
      setError(getFriendlyApiError(err.message, 'No pude iniciar el pago'))
    }
  }

  const handleDownloadPdf = async (item: HistoryItem) => {
    setPdfLoadingId(item.id)
    setError('')

    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optimizedCV: item.optimized_cv,
          outputLanguage: item.output_language || 'spanish',
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || data.error || 'No pude generar el PDF')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cv-revisamicv-${item.id}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(getFriendlyApiError(err.message, 'No pude generar el PDF'))
    } finally {
      setPdfLoadingId(null)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-5xl mx-auto pt-10 pb-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Mi cuenta RevisaMiCV</h1>
          <p className="text-slate-600">Consulta tokens, historial y descarga CVs generados.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm max-w-2xl mx-auto mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Tu email</label>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                const nextEmail = e.target.value
                setEmail(nextEmail)
                if (nextEmail.trim()) window.localStorage.setItem('revisamicv_email', nextEmail.trim().toLowerCase())
              }}
              placeholder="tu@email.com"
              className="flex-1 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-700 transition disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Ver cuenta'}
            </button>
          </div>
          {notice && <p className="text-sm text-purple-700 bg-purple-50 rounded-xl p-3 mt-4">{notice}</p>}
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        </form>

        {user && (
          <div className="space-y-8">
            <section className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <p className="text-slate-500 text-sm">Cuenta</p>
                <p className="font-semibold text-slate-900 mt-1 break-all">{user.email}</p>
              </div>
              <div className="bg-slate-900 rounded-2xl p-6 shadow-sm text-white">
                <p className="text-slate-300 text-sm">Tokens disponibles</p>
                <p className="text-5xl font-bold text-purple-300 mt-1">{user.tokens}</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <p className="text-slate-500 text-sm">CV gratis</p>
                <p className={`font-bold mt-1 ${user.has_free_cv ? 'text-green-600' : 'text-slate-500'}`}>
                  {user.has_free_cv ? 'Disponible' : 'Ya usado'}
                </p>
                <a href="/signup" className="inline-flex items-center gap-2 text-purple-600 font-semibold mt-3">
                  Crear CV <ArrowRightIcon className="w-4 h-4" />
                </a>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">Historial de CVs</h2>
                <a href="/signup" className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-green-700 transition">
                  <SparklesIcon className="w-4 h-4" /> Nuevo análisis
                </a>
              </div>

              {history.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                  <DocumentIcon className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                  <p className="font-semibold text-slate-900">Todavía no tienes CVs generados</p>
                  <p className="text-slate-500 text-sm mt-1">Cuando generes uno, aparecerá aquí para descargarlo otra vez.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-bold text-slate-900">Score: {item.compatibility_score ?? '—'}/100</span>
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                            {item.output_language === 'english' ? 'English' : 'Español'}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{item.job_preview || 'Vacante sin preview'}</p>
                      </div>
                      <button
                        onClick={() => handleDownloadPdf(item)}
                        disabled={pdfLoadingId === item.id}
                        className="px-5 py-3 rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800 transition disabled:opacity-50"
                      >
                        {pdfLoadingId === item.id ? 'Generando...' : 'Descargar PDF'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Comprar más tokens</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {Object.entries(PACKS).map(([pack, p]) => (
                  <button
                    key={pack}
                    onClick={() => {
                      setSelectedPack(pack)
                      handleBuy(pack)
                    }}
                    className={`rounded-2xl border-2 p-5 text-center transition hover:shadow-md ${
                      selectedPack === pack
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : p.popular ? 'border-purple-500 bg-purple-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    {p.popular && <p className="text-xs font-bold text-purple-600 mb-1">MÁS POPULAR</p>}
                    <p className="font-bold text-slate-900">{p.name}</p>
                    <p className="text-3xl font-bold text-purple-600 my-1">${p.priceUSD}</p>
                    <p className="text-sm text-slate-500">{p.cvCount} análisis</p>
                    <p className="text-xs text-slate-400 mt-2">{p.description}</p>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
