import { SparklesIcon, ArrowRightIcon, StarIcon, SearchIcon, ClipboardIcon, UploadIcon, DownloadIcon, ClockIcon, AlertCircleIcon, TrendingUpIcon, ChartBarIcon, ShieldCheckIcon, ThumbsDownIcon, UserIcon } from '@/components/icons'
import PricingCard from '@/components/PricingCard'
import BeforeAfterCards from '@/components/BeforeAfterCards'
import Link from 'next/link'

const painBlocks = [
  {
    icon: AlertCircleIcon,
    title: 'Hablas inglés perfecto. Tu CV suena a Google Translate.',
    text: 'Usas palabras como "spearheaded" y se siente falso. Tu CV se lee como una descripción de cargo, no como una lista de logros. Los reclutadores en EE.UU. lo notan en 6 segundos.',
  },
  {
    icon: ClockIcon,
    title: '100 aplicaciones. Rechazos automáticos a las 3 a.m.',
    text: 'Tienes las skills. Las pusiste en el CV. Pero si no usas las palabras exactas de la vacante, tu CV se pierde entre 2.000 aplicantes. Y si marcas "no soy ciudadano US" — incluso en "Global Remote" — el filtro te descarta antes de que alguien lea la primera línea.',
  },
  {
    icon: ThumbsDownIcon,
    title: '15 versiones de tu CV en PDF. Y ni así te llaman.',
    text: 'Ya probaste Jobscan, Teal, ChatGPT. Pasaste 3 horas adaptando para UNA vacante, sacaste 80% de match — y rechazo automático 12 horas después. Cuando usas ChatGPT, todos los CVs suenan igual: rellenos de "synergy" y "navigated" que un reclutador detecta al instante.',
  },
]

const steps = [
  {
    step: '1',
    icon: UploadIcon,
    title: 'Sube tu CV',
    desc: 'En español o inglés. PDF, Word, o texto. Lo que tengas.',
  },
  {
    step: '2',
    icon: SearchIcon,
    title: 'Auditoría instantánea',
    desc: 'Te marcamos qué falla, qué sobra, y qué te está costando entrevistas. Con sugerencias concretas.',
  },
  {
    step: '3',
    icon: ClipboardIcon,
    title: 'Pega la vacante',
    desc: 'Copia la descripción del cargo al que quieres aplicar.',
  },
  {
    step: '4',
    icon: DownloadIcon,
    title: 'Recibe tu CV reconstruido',
    desc: 'En inglés nativo. Reorganizado con tus logros reales en formato action verbs + métricas. Con las keywords exactas de esa vacante. Listo para enviar.',
  },
]

const testimonials = [
  {
    quote: 'Apliqué a 30 posiciones sin respuesta. Después de optimizar mi CV, tuve 4 entrevistas en 2 semanas.',
    name: 'María González',
    role: 'Ingeniera de Software, Bogotá',
  },
  {
    quote: 'No sabía que mi CV era invisible para los filtros. La diferencia fue inmediata.',
    name: 'Carlos Ramírez',
    role: 'Marketing Manager, Medellín',
  },
  {
    quote: 'Tenía 12 versiones de mi CV. Ahora subo la vacante y en 2 minutos tengo uno perfecto.',
    name: 'Andrea López',
    role: 'Product Designer, Lima',
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ═══════════════ 1. HERO ═══════════════ */}
      <section className="pt-24 pb-16 px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <SparklesIcon className="w-4 h-4" />
          Para profesionales LATAM que aplican afuera
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto leading-tight">
          Tu experiencia es Senior.{' '}
          <span className="text-purple-600">No dejes que tu CV en inglés grite &apos;Junior&apos;.</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed">
          Deja de traducir literalmente. Nuestra IA reescribe tu experiencia usando el vocabulario exacto
          y las <em>action metrics</em> que los reclutadores en EE.UU. exigen — adaptado a cada vacante en segundos.
        </p>

        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-purple-700 transition shadow-lg shadow-purple-200"
        >
          Generar mi CV nivel US <ArrowRightIcon className="w-5 h-5" />
        </Link>
        <p className="text-sm text-slate-400 mt-3">
          Primer CV gratis. Sin tarjeta. Sin registro para ver el resultado.
        </p>

        <BeforeAfterCards />
      </section>

      {/* ═══════════════ 2. AGITACIÓN DEL DOLOR ═══════════════ */}
      <section className="py-20 px-4 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
          ¿Esto te suena?
        </h2>
        <p className="text-center text-slate-500 mb-12 text-lg">
          No eres tú. Es tu CV.
        </p>
        <div className="space-y-6">
          {painBlocks.map((block, i) => (
            <div
              key={i}
              className="flex items-start gap-5 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-red-200 transition-colors"
            >
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                <block.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{block.title}</h3>
                <p className="text-slate-600 leading-relaxed">{block.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ 3. GIRO / FOMO ═══════════════ */}
      <section className="py-20 px-4 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-2xl md:text-3xl italic font-light text-slate-300 mb-6 leading-relaxed">
            &ldquo;Igual escucho de gente consiguiendo trabajo. ¿Quiénes son? ¿Qué hicieron diferente?&rdquo;
          </p>
          <p className="text-lg text-slate-400 leading-relaxed">
            Lo que hicieron diferente no fue aplicar a más vacantes. Fue dejar de enviar el mismo CV
            traducido a todas y presentar un documento que un <em>hiring manager</em> gringo no distingue
            de un candidato local.
          </p>
        </div>
      </section>

      {/* ═══════════════ 4. CÓMO FUNCIONA ═══════════════ */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-2">
          Así funciona
        </h2>
        <p className="text-center text-slate-500 mb-12 text-lg">
          De tu CV en español a un CV nivel US en 2 minutos.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {steps.map((s) => (
            <div key={s.step} className="text-center p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {s.step}
              </div>
              <div className="flex justify-center mb-3">
                <s.icon className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{s.title}</h3>
              <p className="text-slate-600 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Mini before/after */}
        <div className="max-w-2xl mx-auto bg-purple-50 rounded-2xl p-6 border border-purple-200">
          <div className="space-y-3">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">De:</span>
              <p className="text-slate-600 italic mt-1">&ldquo;Fui el encargado del proyecto de migración&rdquo;</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">A:</span>
              <p className="text-slate-900 font-medium mt-1">
                &ldquo;Spearheaded cloud migration for 3 microservices, reducing deployment time by 40%&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 5. POR QUÉ NO SOLO CHATGPT ═══════════════ */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-2">
            ¿Y si uso ChatGPT?
          </h2>
          <p className="text-center text-slate-500 mb-12 text-lg">
            Puedes. Pero esto es lo que pasa:
          </p>

          {/* Mobile: card-based comparison. Desktop: table-like grid */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="grid grid-cols-3 bg-slate-100 text-sm font-semibold text-slate-700">
              <div className="p-4">&nbsp;</div>
              <div className="p-4 text-center border-l border-slate-200">ChatGPT</div>
              <div className="p-4 text-center border-l border-slate-200 bg-purple-50 text-purple-700 rounded-tr-2xl">RevisaMiCV</div>
            </div>

            {[
              ['Traduce CV', '✅', '✅'],
              ['Suena nativo', '❌ buzzwords', '✅ action verbs'],
              ['Audita tu CV', '❌', '✅'],
              ['Sugiere cambios', '❌', '✅'],
              ['Extrae keywords JD', '❌ manual', '✅ automático'],
              ['Score de match', '❌', '✅'],
              ['Tiempo por vacante', '30–40 min', '2 min'],
              ['Inventa experiencia', '⚠️ frecuente', '❌ nunca'],
            ].map(([label, chatgpt, revisamicv], i) => (
              <div key={i} className={`grid grid-cols-3 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                <div className="p-4 text-slate-700 font-medium">{label}</div>
                <div className="p-4 text-center border-l border-slate-100 text-slate-500">{chatgpt}</div>
                <div className="p-4 text-center border-l border-slate-100 text-purple-700 font-medium">{revisamicv}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 6. PRUEBA SOCIAL ═══════════════ */}
      <section className="py-20 px-4 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Profesionales LATAM ya están consiguiendo entrevistas
          </h2>
          <p className="text-center text-slate-400 mb-12 text-lg">
            No son casos especiales. Hicieron un cambio simple.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {testimonials.map((t, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-800 border border-slate-700">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <StarIcon key={j} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-300 mb-4 italic leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-700">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stat box */}
          <div className="max-w-2xl mx-auto bg-slate-800 border border-slate-700 rounded-2xl p-6 flex items-center gap-4">
            <ChartBarIcon className="w-10 h-10 text-purple-400 flex-shrink-0" />
            <p className="text-slate-300 text-sm leading-relaxed">
              Un estudio de la Universidad de Texas demostró que alinear el CV con las keywords del puesto
              sube al candidato <strong className="text-white">al menos 16 posiciones</strong> en un pool de 100.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ 7. PRICING ═══════════════ */}
      <section className="py-20 px-4 max-w-5xl mx-auto" id="pricing">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
          Precios simples. Sin suscripción.
        </h2>
        <p className="text-center text-slate-500 mb-12 text-lg">
          Compra los CVs que necesites. No expiran. Sin letra pequeña.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          <PricingCard pack="basic" />
          <PricingCard pack="pro" />
          <PricingCard pack="premium" />
        </div>
      </section>

      {/* ═══════════════ 8. CTA FINAL ═══════════════ */}
      <section className="py-20 px-4 text-center bg-gradient-to-b from-white to-purple-50">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 max-w-2xl mx-auto leading-tight">
          Dejaste de aplicar a esa vacante porque sentiste que tu inglés no daba.{' '}
          <span className="text-purple-600">Hoy lo arreglas.</span>
        </h2>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-purple-600 text-white px-10 py-5 rounded-full text-xl font-semibold hover:bg-purple-700 transition shadow-xl shadow-purple-200 mt-8"
        >
          Generar mi primer CV gratis <ArrowRightIcon className="w-6 h-6" />
        </Link>
        <p className="text-sm text-slate-400 mt-4">
          Sin tarjeta. Sin registro para ver el resultado.
        </p>
      </section>

      {/* ═══════════════ 9. FOOTER ═══════════════ */}
      <footer className="py-8 px-4 text-center text-sm text-slate-400 border-t border-slate-200">
        <p>© 2025 RevisaMiCV.lat — Todos los derechos reservados</p>
      </footer>
    </main>
  )
}