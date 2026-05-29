import { TOKEN_PACKS } from '@/lib/stripe'
import { CheckIcon } from '@/components/icons'
import Link from 'next/link'

export default function PricingCard({ pack }: { pack: keyof typeof TOKEN_PACKS }) {
  const p = TOKEN_PACKS[pack]
  return (
    <div className={`rounded-2xl border-2 p-8 ${p.popular ? 'border-purple-500 bg-purple-50 relative' : 'border-slate-200 bg-white'}`}>
      {p.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
          Más popular
        </div>
      )}
      <h3 className="text-xl font-bold text-slate-900 mb-1">{p.name}</h3>
      <p className="text-slate-500 mb-6">{p.description}</p>
      <div className="mb-6">
        <span className="text-4xl font-bold text-slate-900">${p.priceUSD}</span>
        <span className="text-slate-500 ml-1">USD</span>
      </div>
      <ul className="space-y-3 mb-8">
        <li className="flex items-center gap-2 text-slate-700">
          <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
          {p.cvCount} CVs optimizados
        </li>
        <li className="flex items-center gap-2 text-slate-700">
          <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
          Adaptado a cada oferta
        </li>
        <li className="flex items-center gap-2 text-slate-700">
          <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
          Optimización ATS
        </li>
        <li className="flex items-center gap-2 text-slate-700">
          <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
          No expiran nunca
        </li>
      </ul>
      <Link
        href={`/signup?pack=${pack}`}
        className={`block text-center py-3 rounded-full font-semibold transition ${
          p.popular
            ? 'bg-purple-600 text-white hover:bg-purple-700'
            : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
        }`}
      >
        Comprar {p.name}
      </Link>
    </div>
  )
}