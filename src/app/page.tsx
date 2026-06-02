import { SparklesIcon, ArrowRightIcon, StarIcon, SearchIcon, ClipboardIcon, UploadIcon, DownloadIcon, ClockIcon, AlertCircleIcon, ChartBarIcon, ShieldCheckIcon, ThumbsDownIcon, UserIcon, CheckIcon } from '@/components/icons'
import PricingCard from '@/components/PricingCard'
import BeforeAfterCards from '@/components/BeforeAfterCards'
import Link from 'next/link'

const proofBadges = [
  'Primer análisis gratis',
  'PDF, DOCX y TXT',
  'Español o inglés',
  'Reglas anti-invención',
]

const metrics = [
  { value: '87/100', label: 'score ejemplo de compatibilidad por vacante' },
  { value: '3', label: 'formatos de descarga ATS-friendly' },
  { value: '0', label: 'experiencia inventada por diseño' },
]

const painBlocks = [
  {
    icon: AlertCircleIcon,
    title: 'No sabes si esa vacante vale tu tiempo.',
    text: 'Lees 40 requisitos, te emocionas, pero no sabes si tu CV realmente conecta con lo que piden. Terminas aplicando a ciegas.',
  },
  {
    icon: ClockIcon,
    title: 'Adaptar bien un CV toma demasiado.',
    text: 'Cambiar keywords, mover logros y ajustar el tono por cada vacante puede consumir horas. Y aun así no sabes si quedó fuerte.',
  },
  {
    icon: ThumbsDownIcon,
    title: 'Un prompt genérico puede sonar bonito, pero arriesgado.',
    text: 'Si la IA exagera cargos, métricas o herramientas, el CV pierde credibilidad. Necesitas mejorar tu historia sin mentir.',
  },
]

const steps = [
  { step: '01', icon: UploadIcon, title: 'Sube tu CV real', desc: 'PDF, Word .docx o TXT. En español o inglés.' },
  { step: '02', icon: ClipboardIcon, title: 'Pega una vacante', desc: 'Responsabilidades, requisitos, skills y contexto del cargo.' },
  { step: '03', icon: SearchIcon, title: 'Recibe diagnóstico', desc: 'Score /100, brechas, fortalezas, riesgos y keywords.' },
  { step: '04', icon: DownloadIcon, title: 'Descarga el CV adaptado', desc: 'Editable y listo para enviar en PDF, DOCX o TXT.' },
]

const useCases = [
  {
    quote: 'Tengo varias vacantes parecidas y quiero saber a cuál aplicar primero.',
    name: 'Comparar oportunidades',
    role: 'Score distinto por cada vacante',
  },
  {
    quote: 'Estoy cambiando de industria y necesito reposicionar mi experiencia sin inventar cargos.',
    name: 'Transición profesional',
    role: 'Fortalezas transferibles + brechas claras',
  },
  {
    quote: 'Necesito enviar mi CV en inglés para remoto global, pero que suene profesional.',
    name: 'Aplicaciones internacionales',
    role: 'Output en inglés o español',
  },
]

const trustPoints = [
  'No inventa empleadores, cargos, títulos, certificaciones, años de experiencia ni métricas.',
  'Cruza tu CV real contra una vacante específica, no contra consejos genéricos.',
  'Preserva evidencia valiosa: métricas, marcas, links, proyectos propios, GitHub, Product Hunt y tech stack por rol.',
  'Puedes editar antes de descargar y exportar PDF, Word DOCX o TXT ATS-friendly.',
]

const comparisonRows = [
  ['Lee PDF/DOCX/TXT', 'manual o inconsistente', 'automático'],
  ['Cruza CV vs vacante', 'depende del prompt', 'flujo guiado'],
  ['Score de compatibilidad', 'no estructurado', '/100 con desglose'],
  ['Brechas y riesgos', 'genérico', 'por vacante'],
  ['CV adaptado descargable', 'copiar/pegar', 'PDF/DOCX/TXT'],
  ['Historial y tokens', 'no', 'dashboard'],
  ['Control anti-invención', 'riesgo alto', 'reglas explícitas'],
]

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfcff] text-[#061b31]">
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[620px] bg-[radial-gradient(circle_at_18%_12%,rgba(83,58,253,0.20),transparent_34%),radial-gradient(circle_at_82%_4%,rgba(249,107,238,0.18),transparent_30%),linear-gradient(180deg,#ffffff_0%,#f6f8ff_65%,#fbfcff_100%)]" />

      <nav className="sticky top-0 z-30 border-b border-white/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-[#061b31]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#533afd] text-white shadow-[0_18px_34px_-18px_rgba(83,58,253,0.8)]">R</span>
            <span>RevisaMiCV.lat</span>
          </Link>
          <div className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <a href="#como-funciona" className="hover:text-[#533afd]">Cómo funciona</a>
            <a href="#comparacion" className="hover:text-[#533afd]">Comparación</a>
            <a href="#pricing" className="hover:text-[#533afd]">Precios</a>
          </div>
          <Link href="/signup" className="rounded-lg bg-[#533afd] px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_34px_-18px_rgba(83,58,253,0.9)] transition hover:bg-[#4434d4]">
            Probar gratis
          </Link>
        </div>
      </nav>

      <section className="px-4 pb-14 pt-16 text-center md:pb-20 md:pt-24">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#d6d9fc] bg-white/80 px-4 py-2 text-sm font-semibold text-[#533afd] shadow-[0_12px_32px_-24px_rgba(50,50,93,0.55)]">
          <SparklesIcon className="h-4 w-4" />
          CV ATS premium para aplicar con más estrategia
        </div>

        <h1 className="mx-auto max-w-5xl text-4xl font-light leading-[1.03] tracking-[-0.04em] text-[#061b31] md:text-6xl lg:text-7xl">
          Antes de aplicar, descubre si tu CV realmente encaja con esa vacante.
        </h1>

        <p className="mx-auto mt-6 max-w-3xl text-lg font-light leading-8 text-[#64748d] md:text-xl">
          Sube tu CV, pega una vacante y recibe un diagnóstico honesto: score de compatibilidad,
          brechas, keywords y un CV adaptado en inglés o español sin inventar experiencia.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/signup" className="inline-flex items-center gap-2 rounded-lg bg-[#533afd] px-7 py-4 text-base font-semibold text-white shadow-[0_30px_45px_-30px_rgba(50,50,93,0.75),0_18px_36px_-18px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:bg-[#4434d4]">
            Analizar mi CV gratis <ArrowRightIcon className="h-5 w-5" />
          </Link>
          <a href="#pricing" className="inline-flex items-center gap-2 rounded-lg border border-[#b9b9f9] bg-white px-7 py-4 text-base font-semibold text-[#533afd] transition hover:bg-[#f6f7ff]">
            Ver precios
          </a>
        </div>

        <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-2">
          {proofBadges.map((badge) => (
            <span key={badge} className="rounded-md border border-[#e5edf5] bg-white px-3 py-1.5 text-xs font-semibold text-[#273951] shadow-[0_8px_20px_-18px_rgba(50,50,93,0.45)]">
              {badge}
            </span>
          ))}
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-3 rounded-xl border border-[#e5edf5] bg-white/80 p-3 shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px] backdrop-blur md:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-lg bg-[#f8f9ff] px-5 py-4 text-left">
              <p className="text-3xl font-light tracking-tight text-[#533afd]">{metric.value}</p>
              <p className="mt-1 text-sm text-[#64748d]">{metric.label}</p>
            </div>
          ))}
        </div>

        <BeforeAfterCards />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#533afd]">El problema</p>
          <h2 className="text-3xl font-light tracking-[-0.03em] text-[#061b31] md:text-5xl">Aplicar sin estrategia sale caro</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#64748d]">
            Muchas veces el problema no es tu experiencia, sino cómo se ve frente a esa vacante específica.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {painBlocks.map((block) => (
            <div key={block.title} className="rounded-xl border border-[#e5edf5] bg-white p-6 shadow-[0_15px_35px_rgba(23,23,23,0.06)] transition hover:-translate-y-1 hover:shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px]">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-[#fff1f6] text-[#ea2261]">
                <block.icon className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-[#061b31]">{block.title}</h3>
              <p className="mt-3 leading-7 text-[#64748d]">{block.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="bg-[#1c1e54] px-4 py-20 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-end gap-8 md:grid-cols-[1fr_0.8fr]">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#b9b9f9]">Cómo funciona</p>
              <h2 className="text-3xl font-light tracking-[-0.03em] md:text-5xl">De CV genérico a aplicación específica en minutos.</h2>
            </div>
            <p className="text-lg font-light leading-8 text-white/70">
              RevisaMiCV convierte cada vacante en una decisión: aplicar fuerte, adaptar con cuidado o no perder tiempo.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {steps.map((s) => (
              <div key={s.step} className="rounded-xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
                <div className="mb-5 flex items-center justify-between">
                  <span className="font-mono text-xs text-white/45">{s.step}</span>
                  <s.icon className="h-5 w-5 text-[#b9b9f9]" />
                </div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/65">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-xl border border-white/10 bg-white p-6 text-[#061b31] shadow-[rgba(3,3,39,0.25)_0px_24px_48px_-24px,rgba(0,0,0,0.12)_0px_18px_36px_-18px]">
            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              <ShieldCheckIcon className="h-10 w-10 flex-shrink-0 text-[#533afd]" />
              <div>
                <h3 className="text-xl font-semibold">Reglas de confianza del producto</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {trustPoints.map((point) => (
                    <div key={point} className="flex gap-3 rounded-lg bg-[#f8f9ff] p-3 text-sm leading-6 text-[#273951]">
                      <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#15be53]" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="comparacion" className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#533afd]">Por qué no solo ChatGPT</p>
            <h2 className="text-3xl font-light tracking-[-0.03em] text-[#061b31] md:text-5xl">Menos prompt, más producto.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[#64748d]">
              ChatGPT puede ayudar. RevisaMiCV está cerrado alrededor del flujo exacto: CV real + vacante real + salida descargable.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#e5edf5] bg-white shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px]">
            <div className="grid grid-cols-3 bg-[#f6f8ff] text-sm font-semibold text-[#273951]">
              <div className="p-4">Capacidad</div>
              <div className="border-l border-[#e5edf5] p-4 text-center">ChatGPT genérico</div>
              <div className="border-l border-[#d6d9fc] bg-[#eeefff] p-4 text-center text-[#533afd]">RevisaMiCV</div>
            </div>
            {comparisonRows.map(([label, chatgpt, revisamicv], i) => (
              <div key={label} className={`grid grid-cols-3 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-[#fbfcff]'}`}>
                <div className="p-4 font-medium text-[#273951]">{label}</div>
                <div className="border-l border-[#e5edf5] p-4 text-center text-[#64748d]">{chatgpt}</div>
                <div className="border-l border-[#e5edf5] p-4 text-center font-semibold text-[#533afd]">{revisamicv}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f6f8ff] px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#533afd]">Casos de uso</p>
            <h2 className="text-3xl font-light tracking-[-0.03em] text-[#061b31] md:text-5xl">Úsalo antes de gastar energía aplicando.</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {useCases.map((t) => (
              <div key={t.name} className="rounded-xl border border-[#e5edf5] bg-white p-6 shadow-[0_15px_35px_rgba(23,23,23,0.06)]">
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, j) => <StarIcon key={j} className="h-4 w-4 fill-[#533afd] text-[#533afd]" />)}
                </div>
                <p className="min-h-24 text-lg font-light leading-8 text-[#273951]">“{t.quote}”</p>
                <div className="mt-6 flex items-center gap-3 border-t border-[#e5edf5] pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eeefff] text-[#533afd]">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#061b31]">{t.name}</p>
                    <p className="text-sm text-[#64748d]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-10 flex max-w-3xl items-start gap-4 rounded-xl border border-[#d6d9fc] bg-white p-6 shadow-[0_15px_35px_rgba(23,23,23,0.06)]">
            <ChartBarIcon className="mt-1 h-9 w-9 flex-shrink-0 text-[#533afd]" />
            <p className="text-sm leading-7 text-[#64748d]">
              Nota honesta: el score no promete entrevistas. Te ayuda a priorizar, entender brechas y enviar un CV más alineado con lo que esa vacante está pidiendo.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20" id="pricing">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#533afd]">Precios</p>
          <h2 className="text-3xl font-light tracking-[-0.03em] text-[#061b31] md:text-5xl">Simple, sin suscripción.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#64748d]">
            Cada token = 1 análisis de CV contra 1 vacante + CV adaptado descargable.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <PricingCard pack="basic" />
          <PricingCard pack="pro" />
          <PricingCard pack="premium" />
        </div>
      </section>

      <section className="px-4 py-20 text-center">
        <div className="mx-auto max-w-5xl rounded-2xl bg-[#1c1e54] px-6 py-14 text-white shadow-[rgba(3,3,39,0.25)_0px_34px_70px_-30px,rgba(0,0,0,0.16)_0px_18px_36px_-18px] md:px-14">
          <h2 className="mx-auto max-w-3xl text-3xl font-light leading-tight tracking-[-0.03em] md:text-5xl">
            Antes de mandar otro CV genérico, revisa si esa vacante realmente encaja contigo.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg font-light leading-8 text-white/70">
            Empieza gratis. Si te sirve, compra tokens sin suscripción.
          </p>
          <Link href="/signup" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 font-semibold text-[#533afd] transition hover:-translate-y-0.5 hover:bg-[#f6f8ff]">
            Analizar mi primer CV gratis <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#e5edf5] bg-white px-4 py-8 text-center text-sm text-[#64748d]">
        <p>© 2026 RevisaMiCV.lat — CVs adaptados a vacantes reales, sin inventar experiencia.</p>
      </footer>
    </main>
  )
}
