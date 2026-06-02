import { SparklesIcon, ArrowRightIcon, StarIcon, SearchIcon, ClipboardIcon, UploadIcon, DownloadIcon, ClockIcon, AlertCircleIcon, ChartBarIcon, ShieldCheckIcon, ThumbsDownIcon, UserIcon, CheckIcon } from '@/components/icons'
import PricingCard from '@/components/PricingCard'
import BeforeAfterCards from '@/components/BeforeAfterCards'
import Link from 'next/link'

const painBlocks = [
  {
    icon: AlertCircleIcon,
    title: 'No sabes si esa vacante vale tu tiempo.',
    text: 'Lees la descripción, ves 40 requisitos y no sabes si aplicar, adaptar tu CV o descartarla. Terminas usando el mismo documento para todo.',
  },
  {
    icon: ClockIcon,
    title: 'Cada aplicación te toma demasiado.',
    text: 'Copias la vacante, abres tu CV, intentas mover keywords y pierdes horas. Cuando por fin lo envías, no sabes si quedó alineado o solo más largo.',
  },
  {
    icon: ThumbsDownIcon,
    title: 'ChatGPT ayuda, pero también inventa o exagera.',
    text: 'Un prompt genérico puede sonar bonito, pero mezclar experiencia real con frases infladas te puede costar credibilidad. Necesitas adaptación sin mentir.',
  },
]

const steps = [
  {
    step: '1',
    icon: UploadIcon,
    title: 'Sube tu CV real',
    desc: 'PDF, Word .docx o TXT. En español o inglés.',
  },
  {
    step: '2',
    icon: ClipboardIcon,
    title: 'Pega una vacante',
    desc: 'Responsabilidades, requisitos y skills del cargo objetivo.',
  },
  {
    step: '3',
    icon: SearchIcon,
    title: 'Recibe score y brechas',
    desc: 'Compatibilidad /100, fortalezas, riesgos y keywords que faltan.',
  },
  {
    step: '4',
    icon: DownloadIcon,
    title: 'Descarga el CV adaptado',
    desc: 'ATS-friendly, editable y listo para enviar en PDF, DOCX o TXT.',
  },
]

const useCases = [
  {
    quote: 'Tengo 3 vacantes parecidas y quiero saber a cuál vale más la pena aplicar primero.',
    name: 'Comparar oportunidades',
    role: 'Score distinto por cada vacante',
  },
  {
    quote: 'Vengo de otra industria y necesito reposicionar mi experiencia sin inventar cargos.',
    name: 'Transición profesional',
    role: 'Fortalezas transferibles + brechas claras',
  },
  {
    quote: 'Necesito un CV en inglés para remoto global, pero que suene profesional y honesto.',
    name: 'Aplicaciones internacionales',
    role: 'Output en inglés o español',
  },
]

const trustPoints = [
  'No inventa experiencia: marca brechas y reposiciona habilidades reales.',
  'Cada análisis cruza tu CV contra una vacante específica, no contra consejos genéricos.',
  'Puedes editar antes de descargar y exportar PDF, Word DOCX o TXT ATS.',
]

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ═══════════════ 1. HERO ═══════════════ */}
      <section className="pt-24 pb-16 px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <SparklesIcon className="w-4 h-4" />
          Para profesionales LATAM que aplican a mejores vacantes
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto leading-tight">
          ¿Qué tan compatible es tu CV con esa vacante?{' '}
          <span className="text-purple-600">Descúbrelo antes de aplicar.</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed">
          Sube tu CV real, pega una vacante y recibe un score de compatibilidad, brechas honestas,
          keywords importantes y un CV adaptado en inglés o español, sin inventar experiencia.
        </p>

        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-purple-700 transition shadow-lg shadow-purple-200"
        >
          Analizar mi CV gratis <ArrowRightIcon className="w-5 h-5" />
        </Link>
        <p className="text-sm text-slate-400 mt-3">
          Primer análisis gratis. Sin tarjeta. PDF/DOCX/TXT soportados.
        </p>

        <BeforeAfterCards />
      </section>

      {/* ═══════════════ 2. AGITACIÓN DEL DOLOR ═══════════════ */}
      <section className="py-20 px-4 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
          Aplicar sin estrategia sale caro
        </h2>
        <p className="text-center text-slate-500 mb-12 text-lg">
          El problema no siempre es tu experiencia. Muchas veces es el match entre tu CV y esa vacante.
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
            &ldquo;No necesitas aplicar a más vacantes a ciegas. Necesitas saber cuáles sí tienen sentido para tu perfil.&rdquo;
          </p>
          <p className="text-lg text-slate-400 leading-relaxed">
            RevisaMiCV convierte cada vacante en una decisión: aplicar fuerte, adaptar con cuidado o no perder tiempo.
            Y cuando sí aplica, te entrega un CV alineado con esa oportunidad.
          </p>
        </div>
      </section>

      {/* ═══════════════ 4. CÓMO FUNCIONA ═══════════════ */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-2">
          Así funciona
        </h2>
        <p className="text-center text-slate-500 mb-12 text-lg">
          De un CV genérico a una aplicación específica en pocos minutos.
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

        <div className="max-w-3xl mx-auto bg-purple-50 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-start gap-4">
            <ShieldCheckIcon className="w-8 h-8 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-slate-900 mb-3">Reglas del producto</h3>
              <ul className="space-y-2 text-sm text-slate-700">
                {trustPoints.map((point) => (
                  <li key={point} className="flex gap-2">
                    <CheckIcon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
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
            Puedes. Pero RevisaMiCV está diseñado para este flujo exacto:
          </p>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 bg-slate-100 text-sm font-semibold text-slate-700">
              <div className="p-4">&nbsp;</div>
              <div className="p-4 text-center border-l border-slate-200">ChatGPT genérico</div>
              <div className="p-4 text-center border-l border-slate-200 bg-purple-50 text-purple-700 rounded-tr-2xl">RevisaMiCV</div>
            </div>

            {[
              ['Lee PDF/DOCX/TXT', '⚠️ manual', '✅ automático'],
              ['Cruza CV vs vacante', '⚠️ depende del prompt', '✅ flujo guiado'],
              ['Score de compatibilidad', '❌', '✅ /100'],
              ['Brechas y riesgos', '⚠️ genérico', '✅ por vacante'],
              ['CV adaptado descargable', '❌ copiar/pegar', '✅ PDF/DOCX/TXT'],
              ['Historial y tokens', '❌', '✅ dashboard'],
              ['Inventa experiencia', '⚠️ posible', '❌ reglas anti-invención'],
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

      {/* ═══════════════ 6. CASOS DE USO ═══════════════ */}
      <section className="py-20 px-4 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Úsalo antes de gastar energía aplicando
          </h2>
          <p className="text-center text-slate-400 mb-12 text-lg">
            Ideal cuando necesitas decidir rápido y adaptar con honestidad.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {useCases.map((t, i) => (
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

          <div className="max-w-2xl mx-auto bg-slate-800 border border-slate-700 rounded-2xl p-6 flex items-center gap-4">
            <ChartBarIcon className="w-10 h-10 text-purple-400 flex-shrink-0" />
            <p className="text-slate-300 text-sm leading-relaxed">
              El score no promete entrevistas. Te ayuda a priorizar, entender brechas y enviar un CV más alineado
              con lo que esa vacante está pidiendo.
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
          Cada token = 1 análisis de CV contra 1 vacante + CV adaptado descargable en PDF.
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
          Antes de mandar otro CV genérico, revisa si esa vacante realmente encaja contigo.{' '}
          <span className="text-purple-600">Empieza con un análisis gratis.</span>
        </h2>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-purple-600 text-white px-10 py-5 rounded-full text-xl font-semibold hover:bg-purple-700 transition shadow-xl shadow-purple-200 mt-8"
        >
          Analizar mi primer CV gratis <ArrowRightIcon className="w-6 h-6" />
        </Link>
        <p className="text-sm text-slate-400 mt-4">
          Sin tarjeta. Recibe score, CV adaptado y PDF descargable.
        </p>
      </section>

      {/* ═══════════════ 9. FOOTER ═══════════════ */}
      <footer className="py-8 px-4 text-center text-sm text-slate-400 border-t border-slate-200">
        <p>© 2026 RevisaMiCV.lat — Todos los derechos reservados</p>
      </footer>
    </main>
  )
}
