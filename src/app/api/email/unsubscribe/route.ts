import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { unsubscribeAnalysisEmails } from '@/lib/analysis-email-sequence-service'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const result = await unsubscribeAnalysisEmails(supabaseAdmin, {
      email: url.searchParams.get('email') || '',
      sequenceId: url.searchParams.get('sequence_id') || '',
      token: url.searchParams.get('token') || '',
    })
    return new NextResponse(result.message, { status: result.status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (error: any) {
    console.error('Unsubscribe error:', error?.message || error)
    return new NextResponse('No pudimos procesar la baja en este momento.', { status: 500 })
  }
}
