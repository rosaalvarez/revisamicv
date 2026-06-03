'use client'

import { track } from '@vercel/analytics'

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>

export function trackEvent(name: string, properties: AnalyticsProperties = {}) {
  try {
    const safeProperties = Object.fromEntries(
      Object.entries(properties).filter(([, value]) => value !== undefined && value !== null)
    ) as Record<string, string | number | boolean>

    track(name, safeProperties)
  } catch {
    // Analytics must never break the product flow.
  }
}

export function getFileSizeBucket(size?: number) {
  const bytes = Number(size || 0)
  if (!bytes) return 'unknown'
  const mb = bytes / (1024 * 1024)
  if (mb < 1) return '<1mb'
  if (mb < 3) return '1-3mb'
  if (mb < 8) return '3-8mb'
  return '8mb+'
}

export function getFileExtensionForAnalytics(name?: string) {
  const extension = String(name || '').toLowerCase().split('.').pop() || 'unknown'
  return ['pdf', 'docx', 'txt'].includes(extension) ? extension : 'other'
}
