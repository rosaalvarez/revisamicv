import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { listCvHistory } from '@/lib/history-service'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const history = await listCvHistory(supabaseAdmin, email)
    return NextResponse.json({ history })
  } catch (error: any) {
    console.error('History lookup error:', error?.message || error)
    return NextResponse.json(
      { error: 'db_error', message: 'No pude consultar tu historial de CVs.' },
      { status: 503 }
    )
  }
}
