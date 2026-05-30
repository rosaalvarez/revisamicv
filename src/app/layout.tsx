import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RevisaMiCV.lat — Tu experiencia es Senior. No dejes que tu CV grite Junior.',
  description: 'Deja de traducir literalmente. Nuestra IA reescribe tu experiencia con el vocabulario exacto y las action metrics que los reclutadores en EE.UU. exigen. Primer CV gratis.',
  openGraph: {
    title: 'RevisaMiCV.lat — CV nivel US en 2 minutos',
    description: 'Tu experiencia es Senior. No dejes que tu CV en inglés grite Junior. Optimización ATS con IA para profesionales LATAM.',
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