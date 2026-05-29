import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RevisaMiCV.lat — Optimiza tu CV para empresas de EE.UU. con IA',
  description: 'Tu CV en español no pasa los filtros ATS de empresas gringas. Optimizamos tu currículum con IA para que consigas entrevistas. Primer CV gratis.',
  openGraph: {
    title: 'RevisaMiCV.lat',
    description: 'Optimiza tu CV para EE.UU. con IA',
    images: ['/og.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  )
}