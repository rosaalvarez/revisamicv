import type { MetadataRoute } from 'next'

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://revisamicv.lat').trim().replace(/\/+$/, '')

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: appUrl, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${appUrl}/signup`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${appUrl}/dashboard`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${appUrl}/privacidad`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${appUrl}/terminos`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${appUrl}/soporte`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ]
}
