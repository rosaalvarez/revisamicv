import Link from 'next/link'
import { ArrowRightIcon, CheckIcon, ShieldCheckIcon, UserIcon } from '@/components/icons'
import { SUPPORT_EMAIL, SUPPORT_EMAIL_URL } from '@/lib/support'
export { SUPPORT_EMAIL, SUPPORT_EMAIL_URL }

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
    <main className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)]">
      <div className="relative mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
        <header className="mb-8 flex flex-col gap-4 rounded-[18px] border border-[var(--color-line)] bg-white/80 p-4 shadow-[var(--shadow-card)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <Link href="/" className="logo">
            <b>R</b>
            <div>
              <p className="font-semibold tracking-tight text-[var(--color-ink)]">RevisaMiCV</p>
              <p className="text-xs text-[var(--color-ink-soft)]">Confianza, datos y soporte</p>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-[var(--color-ink-soft)]">
            <Link href="/analizar" className="rounded-full px-4 py-2 hover:bg-[var(--color-paper-2)]">Analizar</Link>
            <Link href="/blog" className="rounded-full px-4 py-2 hover:bg-[var(--color-paper-2)]">Blog</Link>
            <Link href="/#precios" className="rounded-full px-4 py-2 hover:bg-[var(--color-paper-2)]">Precios</Link>
            <Link href="/dashboard" aria-label="Mi panel" className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-4 py-2 font-semibold text-[var(--color-ink)] hover:border-[var(--color-primary)]">
              <UserIcon className="h-4 w-4" /> Mi panel
            </Link>
          </nav>
        </header>

        <section className="overflow-hidden rounded-[22px] bg-[var(--color-block)] text-[var(--color-paper)] shadow-[var(--shadow-screen)]">
          <div className="relative p-6 md:p-10">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[var(--color-primary)]/30 blur-3xl" />
            <div className="relative max-w-3xl">
              <p className="kicker text-[#7FE3D3]">{eyebrow}</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--color-paper)] md:text-6xl">{title}</h1>
              <p className="mt-5 text-lg leading-8 text-[#CFE3DE]">{intro}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/analizar" className="btn-primary inline-flex items-center gap-2">
                  Analizar primer CV gratis <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <Link href="/" className="rounded-[12px] border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Volver a la landing</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="rounded-[18px] border border-[var(--color-line)] bg-white p-6">
            <div className="grid h-12 w-12 place-items-center rounded-[11px] bg-[var(--color-ink)] text-[var(--color-primary)]"><ShieldCheckIcon className="h-6 w-6" /></div>
            <h2 className="mt-4 text-xl font-semibold text-[var(--color-ink)]">Reglas simples</h2>
            <div className="mt-5 space-y-4 text-sm leading-6 text-[var(--color-ink-soft)]">
              <div className="flex gap-3"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-[var(--color-seen)]" /><span>No vendemos tu CV ni tus datos personales.</span></div>
              <div className="flex gap-3"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-[var(--color-seen)]" /><span>No inventamos experiencia, cargos, estudios ni métricas.</span></div>
              <div className="flex gap-3"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-[var(--color-seen)]" /><span>Si un análisis falla por error técnico, no debería consumirse tu crédito.</span></div>
              <div className="flex gap-3"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-[var(--color-seen)]" /><span>Tus créditos quedan asociados al email usado en Stripe.</span></div>
            </div>
            <div className="mt-6 rounded-[16px] border border-[var(--color-line)] bg-[var(--color-paper-2)] p-4">
              <p className="font-semibold text-[var(--color-ink)]">¿Necesitas ayuda?</p>
              <p className="mt-1 text-sm leading-6 text-[var(--color-ink-soft)]">Escríbenos a {SUPPORT_EMAIL} con el email usado en RevisaMiCV o Stripe.</p>
              <a href={SUPPORT_EMAIL_URL} className="mt-4 inline-flex rounded-[10px] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]">Enviar email</a>
            </div>
          </aside>

          <article className="rounded-[18px] border border-[var(--color-line)] bg-white p-6 text-[var(--color-ink-soft)] md:p-8">
            {children}
          </article>
        </section>
      </div>
    </main>
  )
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-[var(--color-line)] py-6 last:border-0 first:pt-0 last:pb-0">
      <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">{title}</h2>
      <div className="mt-3 space-y-3 text-base leading-7 text-[var(--color-ink-soft)]">{children}</div>
    </section>
  )
}
