import Link from 'next/link'
import { ArrowRightIcon, CheckIcon, ShieldCheckIcon } from '@/components/icons'

export const SUPPORT_EMAIL = 'soporte@revisamicv.lat'
export const SUPPORT_EMAIL_URL = `mailto:${SUPPORT_EMAIL}?subject=Soporte%20RevisaMiCV&body=Hola%20RevisaMiCV%2C%0A%0ANecesito%20ayuda%20con%3A%0A-%20Email%20usado%20en%20RevisaMiCV%20o%20Stripe%3A%0A-%20Qu%C3%A9%20pas%C3%B3%3A%0A-%20Fecha%20aproximada%3A%0A`

export function LegalShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string
  title: string
  intro: string
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-[#0e0a14] text-[#f3f0f7]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(178,74,237,0.20),transparent_34%),radial-gradient(circle_at_top_right,rgba(255,93,74,0.10),transparent_28%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
        <header className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 backdrop-blur md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#b24aed] text-lg font-bold text-white shadow-lg shadow-violet-950/40">R</div>
            <div>
              <p className="font-semibold tracking-tight text-white">RevisaMiCV</p>
              <p className="text-xs text-[#9d96a8]">Confianza, datos y soporte</p>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-[#c8c1d1]">
            <Link href="/signup" className="rounded-full px-4 py-2 hover:bg-white/10">Analizar gratis</Link>
            <Link href="/dashboard" className="rounded-full px-4 py-2 hover:bg-white/10">Dashboard</Link>
            <a href={SUPPORT_EMAIL_URL} className="rounded-full bg-white px-4 py-2 font-semibold text-[#120d18] hover:bg-violet-100">Soporte</a>
          </nav>
        </header>

        <section className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30">
          <div className="relative p-6 md:p-10">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#b24aed]/30 blur-3xl" />
            <div className="relative max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#cf9bff]">{eyebrow}</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-6xl">{title}</h1>
              <p className="mt-5 text-lg leading-8 text-[#c8c1d1]">{intro}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-[#b24aed] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c26bff]">
                  Analizar primer CV gratis <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <Link href="/" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Volver a la landing</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#b24aed]/15 text-[#cf9bff]"><ShieldCheckIcon className="h-6 w-6" /></div>
            <h2 className="mt-4 text-xl font-semibold text-white">Reglas simples</h2>
            <div className="mt-5 space-y-4 text-sm leading-6 text-[#c8c1d1]">
              <div className="flex gap-3"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>No vendemos tu CV ni tus datos personales.</span></div>
              <div className="flex gap-3"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>No inventamos experiencia, cargos, estudios ni métricas.</span></div>
              <div className="flex gap-3"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>Si un análisis falla por error técnico, no debería consumirse tu token.</span></div>
              <div className="flex gap-3"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /><span>Tus tokens quedan asociados al email usado en Stripe.</span></div>
            </div>
            <div className="mt-6 rounded-3xl border border-[#b24aed]/25 bg-[#b24aed]/10 p-4">
              <p className="font-semibold text-white">¿Necesitas ayuda?</p>
              <p className="mt-1 text-sm leading-6 text-[#c8c1d1]">Escríbenos a {SUPPORT_EMAIL} con el email usado en RevisaMiCV o Stripe.</p>
              <a href={SUPPORT_EMAIL_URL} className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#120d18]">Enviar email</a>
            </div>
          </aside>

          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-[#d9d2e3] md:p-8">
            {children}
          </article>
        </section>
      </div>
    </main>
  )
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-white/10 py-6 last:border-0 first:pt-0 last:pb-0">
      <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
      <div className="mt-3 space-y-3 text-base leading-7 text-[#d9d2e3]">{children}</div>
    </section>
  )
}
