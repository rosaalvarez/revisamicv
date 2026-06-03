'use client'

import { track } from '@vercel/analytics'

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>
type GoogleAdsConversionKey = 'analysis_completed' | 'checkout_started' | 'purchase_completed'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim()

const googleAdsLabels: Record<GoogleAdsConversionKey, string | undefined> = {
  analysis_completed: process.env.NEXT_PUBLIC_GOOGLE_ADS_ANALYSIS_LABEL?.trim(),
  checkout_started: process.env.NEXT_PUBLIC_GOOGLE_ADS_CHECKOUT_LABEL?.trim(),
  purchase_completed: process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL?.trim(),
}

const checkoutValues: Record<string, number> = {
  basic: 5,
  pro: 12,
  premium: 19,
}

const googleAdsEventMap: Partial<Record<string, GoogleAdsConversionKey>> = {
  analysis_completed: 'analysis_completed',
  checkout_started: 'checkout_started',
  payment_recovery_completed: 'purchase_completed',
}

function numberProperty(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function buildGoogleAdsPayload(eventName: string, properties: AnalyticsProperties) {
  const conversionKey = googleAdsEventMap[eventName]
  if (!conversionKey || !googleAdsId) return null

  const label = googleAdsLabels[conversionKey]
  if (!label) return null

  const pack = typeof properties.pack === 'string' ? properties.pack : undefined
  const explicitValue = numberProperty(properties.value)
  const fallbackValue = conversionKey === 'checkout_started' && pack ? checkoutValues[pack] : undefined
  const value = explicitValue ?? fallbackValue
  const currency = typeof properties.currency === 'string' ? properties.currency.toUpperCase() : 'USD'
  const transactionId = typeof properties.transaction_id === 'string' ? properties.transaction_id : undefined

  return {
    send_to: `${googleAdsId}/${label}`,
    ...(value !== undefined ? { value, currency } : {}),
    ...(transactionId ? { transaction_id: transactionId } : {}),
  }
}

function trackGoogleAdsConversion(eventName: string, properties: AnalyticsProperties) {
  try {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
    const payload = buildGoogleAdsPayload(eventName, properties)
    if (!payload) return
    window.gtag('event', 'conversion', payload)
  } catch {
    // Google Ads must never break the product flow.
  }
}

export function trackEvent(name: string, properties: AnalyticsProperties = {}) {
  try {
    const safeProperties = Object.fromEntries(
      Object.entries(properties).filter(([, value]) => value !== undefined && value !== null)
    ) as Record<string, string | number | boolean>

    track(name, safeProperties)
    trackGoogleAdsConversion(name, safeProperties)
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
