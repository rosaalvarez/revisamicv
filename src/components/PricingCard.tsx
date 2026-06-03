import { TOKEN_PACKS } from '@/lib/stripe'
import { CheckIcon } from '@/components/icons'
import Link from 'next/link'

const FEATURES_BASIC = [
  'Score CV vs vacante',
  'Brechas y fortalezas',
  'Keywords recomendadas',
  'CV adaptado en PDF/DOCX/TXT',
  'Créditos sin vencimiento',
]

const FEATURES_PRO_PREMIUM = [
  'Todo lo de Básico',
  'Ideal para comparar varias vacantes',
  'Historial en dashboard',
  'Créditos sin vencimiento',
]

export default function PricingCard({ pack }: { pack: keyof typeof TOKEN_PACKS }) {
  const p = TOKEN_PACKS[pack]
  const isBasic = pack === 'basic'
  const features = isBasic ? FEATURES_BASIC : FEATURES_PRO_PREMIUM

  return (
    <div className={`relative rounded-xl border p-7 transition hover:-translate-y-1 ${
      p.popular
        ? 'border-[#b9b9f9] bg-[#f4f5ff] shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px]'
        : 'border-[#e5edf5] bg-white shadow-[0_15px_35px_rgba(23,23,23,0.06)]'
    }`}>
      {p.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-md bg-[#533afd] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-[0_18px_34px_-18px_rgba(83,58,253,0.9)]">
          Mejor valor
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-light tracking-[-0.02em] text-[#061b31]">{p.name}</h3>
        <p className="mt-2 min-h-12 text-sm leading-6 text-[#64748d]">{p.description}</p>
      </div>

      <div className="mb-2 flex items-end gap-1">
        <span className="text-5xl font-light tracking-tight text-[#061b31]">${p.priceUSD}</span>
        <span className="mb-2 text-sm font-semibold text-[#64748d]">USD</span>
      </div>
      <p className="mb-7 rounded-md bg-white/70 px-3 py-2 text-sm font-semibold text-[#533afd]">
        {p.cvCount} análisis incluidos
      </p>

      <ul className="mb-8 space-y-3">
        {features.map((feat) => (
          <li key={feat} className="flex items-start gap-2 text-sm leading-6 text-[#273951]">
            <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#15be53]" />
            {feat}
          </li>
        ))}
      </ul>

      <Link
        href={`/dashboard?pack=${pack}`}
        className={`block rounded-lg py-3 text-center font-semibold transition ${
          p.popular
            ? 'bg-[#533afd] text-white shadow-[0_18px_34px_-18px_rgba(83,58,253,0.9)] hover:bg-[#4434d4]'
            : 'border border-[#b9b9f9] bg-white text-[#533afd] hover:bg-[#f6f7ff]'
        }`}
      >
        Elegir {p.name} →
      </Link>
      <p className="mt-3 text-center text-xs text-[#64748d]">Te pediremos tu email para acreditar los créditos.</p>
    </div>
  )
}
