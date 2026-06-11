import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mi panel',
  description: 'Entra a tu panel de RevisaMiCV para ver créditos, recuperar análisis guardados y comprar más vacantes cuando lo necesites.',
  alternates: { canonical: '/dashboard' },
  openGraph: {
    title: 'Mi panel | RevisaMiCV',
    description: 'Consulta créditos y recupera tus análisis guardados en RevisaMiCV.',
    url: '/dashboard',
    siteName: 'RevisaMiCV',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'RevisaMiCV — Score de compatibilidad y CV adaptado' }],
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mi panel | RevisaMiCV',
    description: 'Consulta créditos y recupera tus análisis guardados en RevisaMiCV.',
    images: ['/og.png'],
  },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
