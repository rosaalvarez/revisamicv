import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { listCvHistory } from '@/lib/history-service'
import { verifyAuthToken } from '@/lib/auth-token'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, auth_token } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
    verifyAuthToken(auth_token, email)

    const history = await listCvHistory(supabaseAdmin, email)
    return NextResponse.json({ history })
  } catch (error: any) {
    console.error('History lookup error:', error?.message || error)
    if (String(error?.message || '').toLowerCase().includes('auth token')) {
      return NextResponse.json(
        { error: 'auth_required', message: 'Entra desde el enlace seguro enviado a tu email.' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'db_error', message: 'No pude consultar tu historial de CVs.' },
      { status: 503 }
    )
  }
}
