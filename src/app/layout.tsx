import type { Metadata } from 'next'
import './globals.css'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://revisamicv.lat'

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'RevisaMiCV.lat — Score de compatibilidad + CV adaptado a cada vacante',
  description: 'Cruza tu CV real contra una vacante específica, descubre tu porcentaje de compatibilidad y descarga un CV adaptado en inglés o español sin inventar experiencia.',
  keywords: ['CV ATS', 'compatibilidad laboral', 'curriculum vitae', 'vacantes remotas', 'empleo LATAM', 'CV en inglés', 'CV en español'],
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.ico'],
  },
  openGraph: {
    title: 'RevisaMiCV.lat — ¿Qué tan compatible eres con esta vacante?',
    description: 'Sube tu CV, pega una vacante y recibe score, brechas, keywords y CV adaptado descargable en PDF.',
    url: appUrl,
    siteName: 'RevisaMiCV.lat',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'RevisaMiCV.lat — Score de compatibilidad y CV adaptado',
      },
    ],
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RevisaMiCV.lat — Score + CV adaptado',
    description: 'Cruza tu CV real contra una vacante y descarga un CV adaptado en PDF.',
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
