import type { MetadataRoute } from 'next'

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://revisamicv.lat').trim().replace(/\/+$/, '')

const resourceSlugs = ['adaptar-cv-a-vacante', 'optimizar-cv-ats', 'cv-en-ingles-para-remoto']
const blogSlugs = [
  'por-que-tu-cv-no-recibe-respuestas',
  'como-usar-keywords-ats-sin-mentir',
  'adaptar-cv-para-cada-vacante-rapido',
  'cv-en-ingles-errores-comunes',
  'score-cv-vacante-como-interpretarlo',
  'chatgpt-vs-herramienta-cv',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: appUrl, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${appUrl}/analizar`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${appUrl}/dashboard`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${appUrl}/privacidad`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${appUrl}/terminos`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${appUrl}/soporte`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${appUrl}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.75 },
    ...blogSlugs.map((slug) => ({
      url: `${appUrl}/blog/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.65,
    })),
    ...resourceSlugs.map((slug) => ({
      url: `${appUrl}/recursos/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}
