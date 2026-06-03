'use client'

import { useEffect, useMemo, useState } from 'react'
import { TOKEN_PACKS } from '@/lib/token-rules'
import { ArrowRightIcon, ChartBarIcon, CheckIcon, ClockIcon, DocumentIcon, DownloadIcon, ShieldCheckIcon, SparklesIcon, UserIcon } from '@/components/icons'
import { SUPPORT_WHATSAPP_URL } from '@/components/LegalShell'
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

function StatusPill({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'green' | 'purple' | 'slate' }) {
  const styles = {
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    purple: 'border-violet-200 bg-violet-50 text-violet-700',
    slate: 'border-slate-200 bg-white text-slate-600',
  }
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${styles[tone]}`}>{children}</span>
}

function TrustNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      <span>{children}</span>
    </div>
  )
}

function MiniMetric({ label, value, icon, dark = false }: { label: string; value: string | number; icon: React.ReactNode; dark?: boolean }) {
  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${dark ? 'border-white/10 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-950'}`}>
      <div className="flex items-center justify-between gap-4">
        <p className={`text-sm ${dark ? 'text-slate-300' : 'text-slate-500'}`}>{label}</p>
        <div className={`grid h-10 w-10 place-items-center rounded-2xl ${dark ? 'bg-white/10 text-violet-200' : 'bg-violet-50 text-violet-700'}`}>{icon}</div>
      </div>
      <p className={`mt-3 text-4xl font-semibold tracking-tight ${dark ? 'text-violet-200' : 'text-slate-950'}`}>{value}</p>
    </div>
  )
}

export default function DashboardPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [pdfLoadingId, setPdfLoadingId] = useState<string | number | null>(null)
  const [user, setUser] = useState<UserState | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selectedPack, setSelectedPack] = useState<string>('')

  const usedAnalyses = history.length
  const accountStatus = useMemo(() => {
    if (!user) return 'Ingresa tu email para ver tu cuenta'
    if (user.tokens > 0) return 'Lista para analizar vacantes'
    if (user.has_free_cv) return 'Tienes un análisis gratis disponible'
    return 'Sin créditos disponibles'
  }, [user])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const queryEmail = params.get('email') || ''
    const savedEmail = window.localStorage.getItem('revisamicv_email') || ''
    const initialEmail = queryEmail || savedEmail
    const payment = params.get('payment')
    const pack = params.get('pack') || ''
    if (pack && PACKS[pack]) {
      setSelectedPack(pack)
      setNotice(`Pack ${PACKS[pack].name} seleccionado. Usa el email donde quieres recibir y guardar tus tokens.`)
    }

    const sessionId = params.get('session_id') || ''
    if (payment === 'success') setNotice(sessionId ? 'Confirmando pago con Stripe y acreditando tokens...' : 'Pago recibido. Tus tokens pueden tardar unos segundos en aparecer.')
    if (payment === 'cancelled') setNotice('Pago cancelado. No se hizo ningún cargo.')

    if (initialEmail) {
      setEmail(initialEmail)
      if (payment === 'success' && sessionId) {
        recoverPayment(sessionId, initialEmail)
      } else {
        checkAccount(initialEmail)
      }
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

    try {
      const normalizedEmail = emailToCheck.trim().toLowerCase()
      const [userRes, historyRes] = await Promise.all([
        fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail }),
        }),
        fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail }),
        }),
      ])

      const userData = await userRes.json()
      const historyData = await historyRes.json()
      if (!userRes.ok) throw new Error(userData.message || userData.error)
      if (!historyRes.ok) throw new Error(historyData.message || historyData.error)

      window.localStorage.setItem('revisamicv_email', normalizedEmail)
      setUser(userData)
      setHistory(historyData.history || [])
    } catch (err: any) {
      setError(getFriendlyApiError(err.message, 'No pude cargar tu cuenta'))
    } finally {
      setLoading(false)
    }
  }

  const recoverPayment = async (sessionId: string, emailToCheck: string) => {
    const emailError = validateEmail(emailToCheck)
    if (emailError) {
      setError(emailError)
      return
    }

    setLoading(true)
    setError('')

    try {
      const normalizedEmail = emailToCheck.trim().toLowerCase()
      const res = await fetch('/api/stripe/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, email: normalizedEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.error || 'No pude confirmar el pago')
      setNotice(data.message || 'Pago confirmado. Tokens acreditados.')
      await checkAccount(data.email || normalizedEmail)
    } catch (err: any) {
      setError(getFriendlyApiError(err.message, 'No pude confirmar el pago'))
      await checkAccount(emailToCheck)
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
    setNotice('Abriendo checkout seguro de Stripe...')

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack, email: normalizedEmail }),
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
    <main className="min-h-screen bg-[#f7f8ff] text-slate-950">
      <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_left,#ede9fe,transparent_32%),radial-gradient(circle_at_top_right,#dbeafe,transparent_28%)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <header className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#533AFD] text-lg font-bold text-white shadow-lg shadow-violet-200">R</div>
            <div>
              <p className="font-semibold tracking-tight text-slate-950">RevisaMiCV</p>
              <p className="text-xs text-slate-500">Centro de aplicaciones</p>
            </div>
          </a>
          <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-600">
            <a href="/signup" className="rounded-full px-4 py-2 hover:bg-slate-100">Analizar otra vacante</a>
            <a href="#historial" className="rounded-full px-4 py-2 hover:bg-slate-100">Historial</a>
            <a href="#comprar" className="rounded-full px-4 py-2 hover:bg-slate-100">Comprar tokens</a>
            <a href={SUPPORT_WHATSAPP_URL} className="rounded-full px-4 py-2 hover:bg-slate-100">Soporte</a>
          </nav>
        </header>

        <section className="mb-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 text-white shadow-xl shadow-slate-200">
            <div className="relative p-6 md:p-8">
              <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-violet-500/30 blur-3xl" />
              <div className="relative z-10">
                <StatusPill tone={user?.tokens ? 'green' : user?.has_free_cv ? 'purple' : 'slate'}>{accountStatus}</StatusPill>
                <h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
                  Consulta tus créditos, CVs e historial por email.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                  Ingresa el email que usaste en tu análisis gratis o en Stripe. Con ese email recuperas tus créditos, tus CVs generados y tu historial. No necesitas contraseña.
                </p>

                <div className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-3 backdrop-blur">
                  <p className="px-2 pb-3 text-sm leading-6 text-violet-100">Usa el mismo email con el que analizaste gratis o compraste tokens en Stripe. Ahí quedan guardados tus créditos e historial.</p>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      const nextEmail = e.target.value
                      setEmail(nextEmail)
                      if (nextEmail.trim()) window.localStorage.setItem('revisamicv_email', nextEmail.trim().toLowerCase())
                    }}
                    placeholder="tu@email.com"
                    className="min-h-12 flex-1 rounded-2xl border border-white/10 bg-white px-4 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-violet-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => checkAccount(email)}
                    disabled={loading}
                    className="min-h-12 rounded-2xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-violet-50 disabled:opacity-60"
                  >
                    {loading ? 'Cargando...' : 'Ver cuenta'}
                  </button>
                  <a
                    href="/signup"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-violet-500 px-5 text-sm font-semibold text-white transition hover:bg-violet-400"
                  >
                    Analizar otra vacante <ArrowRightIcon className="h-4 w-4" />
                  </a>
                  </form>
                </div>

                {notice && <p className="mt-4 rounded-2xl border border-violet-300/30 bg-violet-400/10 p-3 text-sm text-violet-100">{notice}</p>}
                {error && <p className="mt-4 rounded-2xl border border-red-300/30 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
              </div>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Estado de cuenta</p>
                <p className="mt-1 break-all text-lg font-semibold text-slate-950">{user?.email || 'Ingresa tu email'}</p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-700"><UserIcon className="h-5 w-5" /></div>
            </div>
            <div className="mt-6 space-y-3 text-sm text-slate-600">
              <TrustNote>Tu cuenta se crea y se recupera con tu email. No necesitas contraseña.</TrustNote>
              <TrustNote>Stripe confirma pagos y la app recupera tus créditos al volver del checkout.</TrustNote>
              <TrustNote>No vendemos tu CV ni inventamos experiencia: optimizamos lo que sí existe.</TrustNote>
              <TrustNote>Tus CVs quedan en historial para descargarlos otra vez sin gastar otro análisis.</TrustNote>
            </div>
            <div className="mt-6 rounded-3xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">¿Pagaste y no ves tokens?</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Usa el mismo email de Stripe y recarga esta pantalla. Si sigue igual, escríbenos por soporte con el email de pago.</p>
              <a href={SUPPORT_WHATSAPP_URL} className="mt-3 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">Contactar soporte</a>
            </div>
          </aside>
        </section>

        {!user && (
          <section className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">1 análisis = 1 vacante</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Cada análisis compara tu CV contra una vacante concreta y genera descargas PDF, DOCX y TXT.</p>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">Pago seguro con Stripe</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">No guardamos tu tarjeta. Los créditos se asocian al email de compra.</p>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">Privacidad primero</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Puedes revisar privacidad, términos y solicitar eliminación de datos desde soporte.</p>
            </div>
          </section>
        )}

        {user && (
          <div className="space-y-8">
            <section className="grid gap-4 md:grid-cols-3">
              <MiniMetric label="Tokens disponibles" value={user.tokens} icon={<SparklesIcon className="h-5 w-5" />} dark />
              <MiniMetric label="Análisis realizados" value={usedAnalyses} icon={<ChartBarIcon className="h-5 w-5" />} />
              <MiniMetric label="CV gratis" value={user.has_free_cv ? 'Activo' : 'Usado'} icon={<ShieldCheckIcon className="h-5 w-5" />} />
            </section>

            <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">Siguiente paso</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Analiza otra vacante real antes de aplicar</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">Cada token compara tu CV contra una vacante específica y genera un CV adaptado descargable.</p>
                <a href="/signup" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-violet-700 md:w-auto">
                  Analizar otra vacante <ArrowRightIcon className="h-4 w-4" />
                </a>
                <div className="mt-6 grid gap-3 text-sm text-slate-600">
                  <div className="rounded-2xl border border-slate-200 p-4"><span className="font-semibold text-slate-900">1.</span> Sube CV PDF/DOCX/TXT</div>
                  <div className="rounded-2xl border border-slate-200 p-4"><span className="font-semibold text-slate-900">2.</span> Pega la vacante completa</div>
                  <div className="rounded-2xl border border-slate-200 p-4"><span className="font-semibold text-slate-900">3.</span> Recibe score, brechas y CV adaptado</div>
                </div>
              </div>

              <section id="historial" className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Historial de análisis</h2>
                    <p className="mt-1 text-sm text-slate-500">Recupera resultados anteriores sin volver a gastar tokens.</p>
                  </div>
                  <StatusPill tone="purple">{history.length} guardado{history.length === 1 ? '' : 's'}</StatusPill>
                </div>

                {history.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <DocumentIcon className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                    <p className="font-semibold text-slate-950">Todavía no tienes CVs generados</p>
                    <p className="mt-1 text-sm text-slate-500">Cuando hagas tu primer análisis, aparecerá aquí para descargarlo otra vez.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center">
                          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-700">
                            <DocumentIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-950">Score: {item.compatibility_score ?? '—'}/100</span>
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                                {item.output_language === 'english' ? 'English' : 'Español'}
                              </span>
                              <span className="inline-flex items-center gap-1 text-xs text-slate-400"><ClockIcon className="h-3 w-3" />{new Date(item.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="line-clamp-2 text-sm text-slate-600">{item.job_preview || 'Vacante sin preview'}</p>
                          </div>
                          <button
                            onClick={() => handleDownloadPdf(item)}
                            disabled={pdfLoadingId === item.id}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                          >
                            <DownloadIcon className="h-4 w-4" /> {pdfLoadingId === item.id ? 'Generando...' : 'Descargar'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </section>

            <section id="comprar" className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">Créditos</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Compra más análisis cuando compares más vacantes</h2>
                  <p className="mt-2 text-sm text-slate-500">Un token = un CV comparado contra una vacante. Los tokens quedan guardados en tu email.</p>
                </div>
                <StatusPill tone="green">Pago seguro con Stripe</StatusPill>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(PACKS).map(([pack, p]) => (
                  <button
                    key={pack}
                    onClick={() => {
                      setSelectedPack(pack)
                      handleBuy(pack)
                    }}
                    className={`group relative overflow-hidden rounded-3xl border-2 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-xl ${
                      selectedPack === pack
                        ? 'border-emerald-400 bg-emerald-50'
                        : p.popular ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    {p.popular && <span className="mb-4 inline-flex rounded-full bg-violet-600 px-3 py-1 text-xs font-bold text-white">MEJOR VALOR</span>}
                    <p className="text-lg font-semibold text-slate-950">{p.name}</p>
                    <div className="my-3 flex items-end gap-2">
                      <p className="text-4xl font-semibold tracking-tight text-slate-950">${p.priceUSD}</p>
                      <p className="pb-1 text-sm text-slate-500">USD</p>
                    </div>
                    <p className="font-semibold text-violet-700">{p.cvCount} análisis</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{p.description}</p>
                    <div className="mt-5 flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm">
                      Comprar pack <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
        <footer className="mt-10 rounded-[2rem] border border-slate-200 bg-white/80 p-5 text-sm text-slate-600 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p>RevisaMiCV — CVs adaptados a vacantes reales, sin inventar experiencia.</p>
            <div className="flex flex-wrap gap-3 font-medium">
              <a href="/privacidad" className="hover:text-violet-700">Privacidad</a>
              <a href="/terminos" className="hover:text-violet-700">Términos</a>
              <a href="/soporte" className="hover:text-violet-700">Soporte</a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
