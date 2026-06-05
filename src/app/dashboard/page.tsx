'use client'

import { useEffect, useState } from 'react'
import { TOKEN_PACKS } from '@/lib/token-rules'
import { getFriendlyApiError, validateEmail } from '@/lib/input-validation'
import { trackEvent } from '@/lib/analytics'

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

function firstPackKey() {
  return Object.keys(PACKS)[0] || ''
}

function preferredPackKey() {
  return PACKS.pro ? 'pro' : firstPackKey()
}

function scoreChipClass(score: number) {
  if (score >= 85) return 'bg-[rgba(47,125,82,.14)] text-[var(--color-seen)]'
  if (score >= 70) return 'bg-[rgba(245,128,10,.16)] text-[var(--color-primary-deep)]'
  return 'bg-[rgba(140,134,122,.18)] text-[var(--color-silence)]'
}

function pricePerCv(price: number, count: number) {
  if (!count) return ''
  return `$${(price / count).toFixed(2).replace('.00', '')} por CV`
}


function stripJobMarkdown(value: string) {
  return String(value || '')
    .replace(/\*\*/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/[`_>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractLabel(text: string, label: string) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = text.match(new RegExp(`${escaped}:\\s*([^|•\\n-]+)`, 'i'))
  return match?.[1]?.trim().replace(/[.,;:]+$/, '') || ''
}

function getAnalysisTitle(jobPreview: string) {
  const clean = stripJobMarkdown(jobPreview)
  if (!clean) return 'Vacante analizada'

  const firstPart = clean.split(/\s{2,}|\s[-–—]\s|\s\|\s/)[0]?.trim() || clean
  const companyRole = firstPart.match(/^([^:]{2,60}):\s*(.{2,80})$/)
  if (companyRole) {
    return `${companyRole[2].trim()} · ${companyRole[1].trim()}`.slice(0, 92)
  }

  return clean
    .replace(/\b(Location|Ubicación|Commitment|Tipo|Full-time|Part-time|Remote|Remoto):?.*$/i, '')
    .trim()
    .slice(0, 92) || 'Vacante analizada'
}

function getAnalysisMeta(item: HistoryItem) {
  const clean = stripJobMarkdown(item.job_preview)
  const location = extractLabel(clean, 'Location') || extractLabel(clean, 'Ubicación')
  const commitment = extractLabel(clean, 'Commitment') || extractLabel(clean, 'Tipo')
  const meta = [
    location,
    commitment,
    item.output_language === 'english' ? 'English' : 'Español',
    new Date(item.created_at).toLocaleDateString(),
  ].filter(Boolean)
  return meta.join(' · ')
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
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutIntent, setCheckoutIntent] = useState(false)
  const [authToken, setAuthToken] = useState('')
  const [linkSent, setLinkSent] = useState(false)

  const selectedPackDetails = selectedPack ? PACKS[selectedPack] : null

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const queryEmail = params.get('email') || ''
    const queryAuth = params.get('auth') || ''
    const savedEmail = window.localStorage.getItem('revisamicv_email') || ''
    const savedAuth = window.localStorage.getItem('revisamicv_auth_token') || ''
    const initialEmail = queryEmail || savedEmail
    const initialAuth = queryAuth || savedAuth
    const payment = params.get('payment')
    const pack = params.get('pack') || ''
    const intent = params.get('intent')
    const wantsCheckout = intent === 'checkout' && Boolean(pack && PACKS[pack])

    setCheckoutIntent(wantsCheckout)
    trackEvent('dashboard_view', { payment: payment || 'none', pack: pack || 'none', intent: intent || 'none' })

    if (pack && PACKS[pack]) {
      setSelectedPack(pack)
      if (wantsCheckout) setCheckoutOpen(true)
      setNotice(wantsCheckout
        ? `Estás comprando el Pack ${PACKS[pack].name}. Escribe tu email y confirma el pago.`
        : `Pack ${PACKS[pack].name} seleccionado. Usa el email donde quieres recibir y guardar tus créditos.`)
    }

    const sessionId = params.get('session_id') || ''
    if (payment === 'success') setNotice(sessionId ? 'Confirmando pago con Stripe y acreditando créditos...' : 'Pago recibido. Tus créditos pueden tardar unos segundos en aparecer.')
    if (payment === 'cancelled') setNotice('Pago cancelado. No se hizo ningún cargo.')

    if (initialEmail) {
      setEmail(initialEmail)
      if (initialAuth) {
        setAuthToken(initialAuth)
        window.localStorage.setItem('revisamicv_auth_token', initialAuth)
      }
      if (payment === 'success' && sessionId) {
        recoverPayment(sessionId, initialEmail)
      } else if (initialAuth) {
        checkAccount(initialEmail, initialAuth)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const requestMagicLink = async (emailToSend = email) => {
    const emailError = validateEmail(emailToSend)
    if (emailError) return setError(emailError)

    setLoading(true)
    setError('')
    setNotice('Enviando enlace seguro a tu email...')
    try {
      const normalizedEmail = emailToSend.trim().toLowerCase()
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.error || 'No pude enviar el enlace')
      window.localStorage.setItem('revisamicv_email', normalizedEmail)
      setLinkSent(true)
      setNotice('Listo. Te enviamos un enlace seguro para entrar al dashboard. Revisa tu correo y spam/promociones.')
      trackEvent('magic_link_requested')
    } catch (err: any) {
      trackEvent('magic_link_failed', { message: String(err.message || '').slice(0, 80) })
      setError(getFriendlyApiError(err.message, 'No pude enviar el enlace de acceso'))
    } finally {
      setLoading(false)
    }
  }

  const checkAccount = async (emailToCheck = email, tokenToUse = authToken) => {
    const emailError = validateEmail(emailToCheck)
    if (emailError) {
      trackEvent('dashboard_email_validation_error')
      setError(emailError)
      return
    }

    if (!tokenToUse) {
      await requestMagicLink(emailToCheck)
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
          body: JSON.stringify({ email: normalizedEmail, auth_token: tokenToUse }),
        }),
        fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail, auth_token: tokenToUse }),
        }),
      ])

      const userData = await userRes.json()
      const historyData = await historyRes.json()
      if (!userRes.ok) throw new Error(userData.message || userData.error)
      if (!historyRes.ok) throw new Error(historyData.message || historyData.error)

      window.localStorage.setItem('revisamicv_email', normalizedEmail)
      window.localStorage.setItem('revisamicv_auth_token', tokenToUse)
      setAuthToken(tokenToUse)
      setUser(userData)
      setHistory(historyData.history || [])
      trackEvent('dashboard_account_loaded', {
        tokens: typeof userData.tokens === 'number' ? userData.tokens : -1,
        has_free_cv: Boolean(userData.has_free_cv),
        history_count: Array.isArray(historyData.history) ? historyData.history.length : 0,
      })
    } catch (err: any) {
      trackEvent('dashboard_account_failed', { message: String(err.message || '').slice(0, 80) })
      setError(getFriendlyApiError(err.message, 'No pude cargar tu cuenta'))
    } finally {
      setLoading(false)
    }
  }

  const recoverPayment = async (sessionId: string, emailToCheck: string) => {
    const emailError = validateEmail(emailToCheck)
    if (emailError) {
      trackEvent('payment_recovery_email_error')
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
      if (data.auth_token) {
        setAuthToken(data.auth_token)
        window.localStorage.setItem('revisamicv_auth_token', data.auth_token)
      }
      setNotice(data.message || 'Pago confirmado. Créditos acreditados.')
      await checkAccount(data.email || normalizedEmail, data.auth_token || authToken)
      trackEvent('payment_recovery_completed', {
        pack: data.pack || 'unknown',
        value: data.purchase_value,
        currency: data.currency || 'USD',
        transaction_id: data.transaction_id,
      })
    } catch (err: any) {
      trackEvent('payment_recovery_failed', { message: String(err.message || '').slice(0, 80) })
      setError(getFriendlyApiError(err.message, 'No pude confirmar el pago'))
      await checkAccount(emailToCheck)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (checkoutIntent && selectedPack) {
      setCheckoutOpen(true)
      return
    }
    await checkAccount(email)
  }

  const handleBuy = async (pack: string) => {
    const emailError = validateEmail(email)
    if (emailError) {
      trackEvent('checkout_validation_error', { pack })
      return setError(emailError)
    }
    trackEvent('checkout_started', { pack })
    setError('')
    setNotice('Abriendo checkout seguro de Stripe...')
    setLoading(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack, email: normalizedEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'No pude iniciar el pago')
      trackEvent('checkout_redirect_created', { pack })
      if (data.url) window.location.href = data.url
    } catch (err: any) {
      trackEvent('checkout_failed', { pack, message: String(err.message || '').slice(0, 80) })
      setError(getFriendlyApiError(err.message, 'No pude iniciar el pago'))
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPdf = async (item: HistoryItem) => {
    trackEvent('history_pdf_download_started')
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
      trackEvent('history_pdf_download_completed')
    } catch (err: any) {
      trackEvent('history_pdf_download_failed', { message: String(err.message || '').slice(0, 80) })
      setError(getFriendlyApiError(err.message, 'No pude generar el PDF'))
    } finally {
      setPdfLoadingId(null)
    }
  }

  const openCheckout = (pack: string) => {
    setSelectedPack(pack)
    setCheckoutOpen(true)
    trackEvent('dashboard_checkout_modal_opened', { pack })
  }

  const packEntries = Object.entries(PACKS)

  return (
    <main className="dashboard-redesign min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)]">
      <nav className="sticky top-0 z-20 border-b border-[var(--color-line)] bg-[rgba(251,248,242,.9)] backdrop-blur-xl">
        <div className="mx-auto flex h-[62px] max-w-[1000px] items-center justify-between px-5">
          <a href="/" className="flex items-center gap-2 font-display text-lg font-semibold text-[var(--color-ink)]">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--color-primary)] text-sm font-bold text-white">R</span>
            RevisaMiCV
          </a>
          <div className="flex items-center gap-4 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)]">
              Créditos: <b className="text-[var(--color-secondary-deep)]">{user ? `${user.tokens} análisis` : '—'}</b>
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-block)] text-xs font-bold text-white">
              {(user?.email || email || 'A').trim().charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-[1000px] px-5">
        <header className="flex flex-col gap-5 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-secondary-deep)]">Mi panel</p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-[var(--color-ink)] md:text-[2.3rem]">Hola de nuevo{user?.email ? `, ${user.email.split('@')[0]}` : ''}.</h1>
          </div>
          <a href="/analizar" className="inline-flex items-center justify-center rounded-xl bg-[var(--color-primary)] px-6 py-4 text-base font-bold text-[var(--color-ink)] shadow-[0_14px_38px_-12px_rgba(245,128,10,.55)] transition hover:-translate-y-0.5">
            Analizar nueva vacante →
          </a>
        </header>

        <section className="rounded-[18px] bg-[var(--color-block)] p-7 text-[var(--color-paper)] shadow-[0_24px_60px_-30px_rgba(14,63,58,.6)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-baseline gap-4">
              <div className="font-display text-5xl font-bold leading-none text-[var(--color-primary)]">{user ? user.tokens : '—'}</div>
              <div className="text-sm text-[#CFE3DE]">análisis<b className="block font-display text-lg font-semibold text-white">disponibles</b></div>
            </div>
            <p className="max-w-xs text-sm text-[#8FA9A4]">Cada análisis compara tu CV contra 1 vacante y genera un CV adaptado. No vencen.</p>
            <button type="button" onClick={() => openCheckout(preferredPackKey())} className="rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-bold text-[var(--color-ink)] transition hover:bg-white">Comprar más créditos</button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-6 grid gap-3 border-t border-white/10 pt-5 md:grid-cols-[1fr_auto_auto]">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                const nextEmail = e.target.value
                setEmail(nextEmail)
                if (nextEmail.trim()) window.localStorage.setItem('revisamicv_email', nextEmail.trim().toLowerCase())
              }}
              placeholder="tu@email.com"
              className="min-h-12 rounded-xl border border-white/10 bg-white px-4 text-sm text-[var(--color-ink)] outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-orange-200"
              required
            />
            <button type="submit" disabled={loading} className="min-h-12 rounded-xl border border-white/10 bg-white px-5 text-sm font-bold text-[var(--color-ink)] transition hover:bg-orange-50 disabled:opacity-60">
              {loading ? 'Cargando...' : authToken ? 'Actualizar panel' : 'Enviar enlace seguro'}
            </button>
            {checkoutIntent && selectedPack && (
              <button type="button" onClick={() => openCheckout(selectedPack)} className="min-h-12 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-bold text-[var(--color-ink)]">Confirmar compra</button>
            )}
          </form>
          {notice && <p className="mt-4 rounded-xl border border-white/10 bg-white/10 p-3 text-sm text-[#CFE3DE]">{notice}</p>}
          {linkSent && <p className="mt-2 text-xs leading-5 text-[#CFE3DE]/80">Por privacidad no mostramos tu historial solo con el email. Entra desde el enlace que llegó a tu correo.</p>}
          {error && <p className="mt-4 rounded-xl border border-red-300/30 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
        </section>

        <section id="historial" className="pt-10">
          <div className="mb-5 flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Tus análisis</h2>
            <a href="#historial" className="text-sm font-semibold text-[var(--color-primary-deep)]">Ver todos</a>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white">
            {!user ? (
              <div className="p-8 text-center">
                <p className="font-semibold text-[var(--color-ink)]">Para ver tus análisis necesitas entrar con enlace seguro.</p>
                <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Escribe tu email arriba. Así protegemos tus CVs y créditos.</p>
              </div>
            ) : history.length === 0 ? (
              <div className="p-8 text-center">
                <p className="font-semibold text-[var(--color-ink)]">Todavía no tienes CVs generados.</p>
                <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Cuando hagas tu primer análisis, aparecerá aquí para descargarlo otra vez.</p>
              </div>
            ) : (
              history.map((item) => {
                const score = item.compatibility_score ?? 0
                return (
                  <div key={item.id} className="grid gap-4 border-b border-[var(--color-line)] px-5 py-4 last:border-b-0 md:grid-cols-[1fr_auto_auto] md:items-center">
                    <div className="font-semibold text-[var(--color-ink)]">
                      {getAnalysisTitle(item.job_preview)}
                      <span className="mt-1 block text-xs font-normal text-[var(--color-ink-soft)]">{getAnalysisMeta(item)}</span>
                    </div>
                    <div className={`w-fit rounded-full px-3 py-1 font-display text-base font-bold ${scoreChipClass(score)}`}>{item.compatibility_score ?? '—'}</div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => handleDownloadPdf(item)} disabled={pdfLoadingId === item.id} className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-2)] px-3 py-2 text-xs font-semibold text-[var(--color-ink)] disabled:opacity-50">{pdfLoadingId === item.id ? 'Generando...' : 'Descargar'}</button>
                      <a href="/analizar" className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs font-semibold text-[var(--color-ink)]">Reusar</a>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        <section id="comprar" className="pt-10">
          <div className="mb-5 flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Comprar créditos</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {packEntries.map(([pack, p]) => (
              <div key={pack} className={`relative flex flex-col rounded-2xl border bg-white p-6 ${p.popular ? 'border-[var(--color-primary)] shadow-[0_22px_56px_-28px_rgba(245,128,10,.5)]' : 'border-[var(--color-line)]'}`}>
                {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-primary)] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink)]">Más elegido</span>}
                <h3 className="font-display text-xl font-semibold text-[var(--color-ink)]">{p.name}</h3>
                <p className="mt-2 font-display text-4xl font-bold text-[var(--color-ink)]">${p.priceUSD}<small className="ml-1 text-sm font-medium text-[var(--color-ink-soft)]">USD</small></p>
                <p className="mb-5 mt-1 text-sm text-[var(--color-ink-soft)]">{p.cvCount} análisis · {pricePerCv(p.priceUSD, p.cvCount)}</p>
                <button type="button" onClick={() => openCheckout(pack)} className={`mt-auto rounded-xl px-4 py-3 text-sm font-bold ${p.popular ? 'bg-[var(--color-primary)] text-[var(--color-ink)]' : 'border border-[var(--color-ink)] text-[var(--color-ink)] hover:bg-[var(--color-paper-2)]'}`}>
                  Comprar {p.name}
                </button>
              </div>
            ))}
          </div>
        </section>

        <p className="py-8 text-center text-sm text-[var(--color-ink-soft)]">Pago único, sin suscripción. Tus créditos no vencen.</p>
      </div>

      {checkoutOpen && selectedPackDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[rgba(15,20,15,.62)] px-5 py-8 backdrop-blur-sm" onClick={() => setCheckoutOpen(false)}>
          <div className="my-auto w-full max-w-[460px] overflow-hidden rounded-[18px] bg-white shadow-[0_40px_90px_-30px_rgba(0,0,0,.55)]" onClick={(e) => e.stopPropagation()}>
            <div className="relative px-6 pt-6">
              <button type="button" onClick={() => setCheckoutOpen(false)} className="absolute right-5 top-5 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-soft)]">Cerrar</button>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-secondary-deep)]">Confirmar compra</p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--color-ink)]">Plan {selectedPackDetails.name}</h3>
            </div>
            <div className="m-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-2)] p-5">
              <div className="flex justify-between py-1 text-sm"><span>{selectedPackDetails.cvCount} análisis</span><span>{pricePerCv(selectedPackDetails.priceUSD, selectedPackDetails.cvCount)}</span></div>
              <div className="flex justify-between py-1 text-sm"><span>Vigencia</span><span>Sin vencimiento</span></div>
              <div className="mt-2 flex justify-between border-t border-[var(--color-line)] pt-3 text-base font-bold"><span>Total hoy</span><b className="font-display text-xl">${selectedPackDetails.priceUSD} USD</b></div>
            </div>
            <ul className="mx-6 mb-5 space-y-2 text-sm text-[var(--color-ink-soft)]">
              <li>✓ Pago único, sin suscripción ni cobros mensuales.</li>
              <li>✓ Los créditos quedan en tu cuenta y no vencen.</li>
              <li>✓ Stripe procesa el pago de forma segura. No guardamos tu tarjeta.</li>
            </ul>
            <div className="px-6 pb-6">
              <button type="button" onClick={() => handleBuy(selectedPack)} disabled={loading} className="w-full rounded-xl bg-[var(--color-primary)] px-5 py-4 text-base font-bold text-[var(--color-ink)] shadow-[0_12px_30px_-10px_rgba(245,128,10,.5)] transition hover:bg-[var(--color-primary-deep)] hover:text-white disabled:opacity-60">
                {loading ? 'Abriendo Stripe...' : `Pagar $${selectedPackDetails.priceUSD} USD con Stripe →`}
              </button>
              <p className="mt-3 text-center text-xs text-[var(--color-ink-soft)]">Te llevamos a Stripe para completar el pago de forma segura.</p>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
