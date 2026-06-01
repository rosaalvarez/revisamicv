import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserTokenState } from '@/lib/token-service'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const user = await getUserTokenState(supabaseAdmin, email)
    return NextResponse.json({
      email: user.email,
      tokens: user.tokens,
      free_used: user.free_used,
      has_free_cv: !user.free_used,
    })
  } catch (error: any) {
    console.error('User lookup error:', error?.message || error)
    return NextResponse.json(
      { error: 'db_error', message: 'No pude consultar los tokens del usuario.' },
      { status: 503 }
    )
  }
}
