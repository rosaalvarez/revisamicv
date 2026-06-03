import { NextRequest, NextResponse } from 'next/server'
import { validateEmail } from '@/lib/input-validation'
import { normalizeEmail } from '@/lib/token-rules'
import { sendMagicLinkEmail } from '@/lib/email-service'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    const normalizedEmail = normalizeEmail(email || '')
    const emailError = validateEmail(normalizedEmail)
    if (emailError) return NextResponse.json({ error: 'invalid_email', message: emailError }, { status: 400 })

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
