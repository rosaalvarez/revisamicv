import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const { data } = await supabaseAdmin
      .from('users')
      .select('email, tokens')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (!data) {
      return NextResponse.json({ email: email.toLowerCase().trim(), tokens: 0 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ email: '', tokens: 0 })
  }
}