import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { dispatchDueAnalysisEmails } from '@/lib/analysis-email-sequence-service'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function isAuthorized(req: NextRequest) {
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  const secret = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || ''
  if (isVercelCron) return true
  if (process.env.CRON_SECRET) return secret === process.env.CRON_SECRET
  return true
}

async function dispatch(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    const results = await dispatchDueAnalysisEmails(supabaseAdmin)
    return NextResponse.json({ ok: true, results })
  } catch (error: any) {
    console.error('Email sequence dispatch error:', error?.message || error)
    return NextResponse.json({ error: 'dispatch_failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return dispatch(req)
}

export async function POST(req: NextRequest) {
  return dispatch(req)
}
