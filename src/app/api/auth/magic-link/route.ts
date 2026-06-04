import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateEmail } from '@/lib/input-validation'
import { normalizeEmail } from '@/lib/token-rules'
import { sendMagicLinkEmail } from '@/lib/email-service'
import { enforceRateLimits, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    const normalizedEmail = normalizeEmail(email || '')
    const emailError = validateEmail(normalizedEmail)
    if (emailError) return NextResponse.json({ error: 'invalid_email', message: emailError }, { status: 400 })

    const limitCheck = await enforceRateLimits(supabaseAdmin, [
      { scope: 'magic_link_email', identifier: normalizedEmail, limit: 3, windowSeconds: 3600 },
      { scope: 'magic_link_ip', identifier: getClientIp(req), limit: 10, windowSeconds: 3600 },
    ])
    if (!limitCheck.allowed) {
      const limited = rateLimitResponse('Demasiadas solicitudes. Intenta de nuevo en 1 hora o revisa tu correo.', {
        resetSeconds: limitCheck.result?.resetSeconds,
      })
      return NextResponse.json(limited.body, { status: limited.status })
    }

    await sendMagicLinkEmail(normalizedEmail)
    return NextResponse.json({ ok: true, message: 'Te enviamos un enlace seguro para entrar a tu dashboard.' })
  } catch (error: any) {
    console.error('Magic link email failed:', error?.message || error)
    return NextResponse.json(
      { error: 'magic_link_failed', message: 'No pude enviar el enlace de acceso. Intenta de nuevo o escribe a soporte@revisamicv.lat.' },
      { status: 500 }
    )
  }
}
