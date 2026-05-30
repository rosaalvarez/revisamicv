import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    app_url: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
    has_stripe_key: !!process.env.STRIPE_SECRET_KEY,
    has_webhook_secret: !!process.env.STRIPE_WEBHOOK_SECRET,
    has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    has_openai_key: !!process.env.OPENAI_API_KEY,
  })
}