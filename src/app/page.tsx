import { TOKEN_PACKS } from '@/lib/stripe'
import { CheckIcon, SparklesIcon, ArrowRightIcon, StarIcon } from '@/components/icons'
import PricingCard from '@/components/PricingCard'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <section className="pt-24 pb-16 px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <SparklesIcon className="w-4 h-4" />
          Potenciado con IA
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6 max-w-3xl mx-auto leading-tight">
          Tu CV en español no pasa los filtros.{' '}
          <span className="text-purple-600">Nosotros lo arreglamos.</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
          Optimizamos tu currículum para los sistemas ATS de empresas en EE.UU. y Europa.
          Súbelo en español, recíbelo en inglés profesional en segundos.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-purple-700 transition shadow-lg shadow-purple-200"
        >
          Probar gratis <ArrowRightIcon className="w-5 h-5" />
        </Link>
        <p className="text-sm text-slate-400 mt-3">Primer CV gratis. Sin tarjeta.</p>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
          Así de simple
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '1', title: 'Sube tu CV', desc: 'En español o inglés. PDF, Word, o texto. Lo que tengas.' },
            { step: '2', title: 'Pega la oferta', desc: 'Copia y pega la descripción del cargo al que quieres aplicar.' },
            { step: '3', title: 'Recibe tu CV optimizado', desc: 'Nuestra IA lo reescribe con las keywords exactas que busca el ATS de esa empresa.' },
          ].map((item) => (
            <div key={item.step} className="text-center p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 max-w-5xl mx-auto" id="pricing">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
          Precios simples. Sin suscripción.
        </h2>
        <p className="text-center text-slate-600 mb-12">
          Compra los CVs que necesites. No expiran. Sin letra pequeña.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          <PricingCard pack="basic" />
          <PricingCard pack="pro" />
          <PricingCard pack="premium" />
        </div>
      </section>

      {/* Social proof */}
      <section className="py-20 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">
            Profesionales LATAM ya están consiguiendo entrevistas
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                quote: 'Apliqué a 30 posiciones sin respuesta. Después de optimizar mi CV con RevisaMiCV, tuve 4 entrevistas en 2 semanas.',
                name: 'María G.',
                role: 'Ingeniera de Software, Bogotá',
              },
              {
                quote: 'No sabía que mi CV era rechazado por los ATS. La diferencia después de la optimización fue inmediata.',
                name: 'Carlos R.',
                role: 'Marketing Manager, Medellín',
              },
            ].map((t, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-800 border border-slate-700">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <StarIcon key={j} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-300 mb-4 italic">"{t.quote}"</p>
                <p className="font-semibold">{t.name}</p>
                <p className="text-sm text-slate-400">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">
          ¿Listo para conseguir entrevistas?
        </h2>
        <p className="text-xl text-slate-600 mb-8">
          Tu primer CV optimizado es gratis.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-purple-600 text-white px-10 py-5 rounded-full text-xl font-semibold hover:bg-purple-700 transition shadow-xl shadow-purple-200"
        >
          Empezar ahora <ArrowRightIcon className="w-6 h-6" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-sm text-slate-400 border-t border-slate-200">
        <p>© 2025 RevisaMiCV.lat — Todos los derechos reservados</p>
      </footer>
    </main>
  )
}