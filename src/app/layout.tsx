import type { Metadata } from 'next'
import './globals.css'

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://revisamicv.lat').trim().replace(/\/+$/, '')

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'RevisaMiCV.lat — Adapta tu CV a cada vacante con score ATS',
    template: '%s | RevisaMiCV.lat',
  },
  description: 'Optimiza tu CV para una vacante específica: score de compatibilidad, keywords ATS, brechas y CV adaptado descargable en PDF, DOCX o TXT, en inglés o español, sin inventar experiencia.',
  keywords: [
    'adaptar CV a vacante',
    'optimizar CV ATS',
    'score de compatibilidad CV',
    'CV para vacantes remotas',
    'mejorar curriculum vitae',
    'CV en inglés',
    'CV en español',
    'curriculum ATS',
    'analizador de CV',
    'RevisaMiCV',
  ],
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
    description: 'Sube tu CV, pega una vacante y recibe score, brechas, keywords ATS y CV adaptado descargable en PDF, DOCX o TXT.',
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
    title: 'RevisaMiCV.lat — Score ATS + CV adaptado',
    description: 'Optimiza tu CV para una vacante específica y descarga una versión adaptada sin inventar experiencia.',
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
