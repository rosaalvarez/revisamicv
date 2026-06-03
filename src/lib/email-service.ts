import { createMagicDashboardLink } from './auth-token'
import { SUPPORT_EMAIL } from './support'

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'RevisaMiCV <soporte@revisamicv.lat>'

type SendEmailInput = {
  to: string
  subject: string
  html: string
  text: string
}

function isEmailEnabled() {
  return Boolean(process.env.RESEND_API_KEY)
}

export async function sendEmail({ to, subject, html, text }: SendEmailInput) {
  if (!isEmailEnabled()) {
    console.log(`[email disabled] ${subject} -> ${to}`)
    return { ok: false, disabled: true }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html, text, reply_to: SUPPORT_EMAIL }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Resend failed: ${res.status} ${body}`)
  }

  return { ok: true, disabled: false }
}

function layout(title: string, body: string) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:28px;color:#0f172a">
      <div style="max-width:620px;margin:0 auto;background:white;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden">
        <div style="background:#120d18;color:white;padding:24px">
          <div style="font-weight:800;font-size:18px">RevisaMiCV</div>
          <div style="color:#d8b4fe;font-size:13px;margin-top:4px">CVs adaptados a vacantes reales, sin inventar experiencia</div>
        </div>
        <div style="padding:28px">
          <h1 style="font-size:24px;line-height:1.2;margin:0 0 16px">${title}</h1>
          ${body}
          <p style="font-size:13px;color:#64748b;line-height:1.6;margin-top:26px">Si tienes problemas, responde este correo o escribe a <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
        </div>
      </div>
    </div>`
}

function button(label: string, href: string) {
  return `<p style="margin:24px 0"><a href="${href}" style="display:inline-block;background:#b24aed;color:white;text-decoration:none;font-weight:700;padding:14px 20px;border-radius:999px">${label}</a></p>`
}

export async function sendMagicLinkEmail(email: string) {
  const link = createMagicDashboardLink(email)
  return sendEmail({
    to: email,
    subject: 'Entra a tu dashboard de RevisaMiCV',
    html: layout('Entra a tu dashboard', `
      <p style="line-height:1.7;color:#334155">Usa este enlace para ver tus créditos, historial y CVs generados. No necesitas contraseña.</p>
      ${button('Entrar a mi dashboard', link)}
      <p style="font-size:13px;color:#64748b;line-height:1.6">Por seguridad, el enlace vence en 7 días. Si no pediste este correo, puedes ignorarlo.</p>
    `),
    text: `Entra a tu dashboard de RevisaMiCV: ${link}\n\nEl enlace vence en 7 días. Soporte: ${SUPPORT_EMAIL}`,
  })
}

export async function sendAnalysisReadyEmail(email: string, score?: number | null) {
  const link = createMagicDashboardLink(email)
  const scoreText = typeof score === 'number' ? ` Score estimado: ${Math.round(score)}/100.` : ''
  return sendEmail({
    to: email,
    subject: 'Tu CV optimizado está listo en RevisaMiCV',
    html: layout('Tu CV optimizado está listo', `
      <p style="line-height:1.7;color:#334155">Terminamos tu análisis.${scoreText} Puedes volver al dashboard para recuperar el resultado y descargar tu CV otra vez.</p>
      ${button('Ver y descargar mi CV', link)}
      <p style="font-size:13px;color:#64748b;line-height:1.6">Guarda este correo: te sirve como acceso de recuperación si cierras la página o se interrumpe la conexión.</p>
    `),
    text: `Tu CV optimizado está listo.${scoreText}\nVer y descargar: ${link}\nSoporte: ${SUPPORT_EMAIL}`,
  })
}

export async function sendPurchaseConfirmedEmail(email: string, credits: number, totalCredits?: number) {
  const link = createMagicDashboardLink(email)
  const total = typeof totalCredits === 'number' ? ` Créditos disponibles ahora: ${totalCredits}.` : ''
  return sendEmail({
    to: email,
    subject: 'Pago confirmado: tus créditos de RevisaMiCV están listos',
    html: layout('Pago confirmado', `
      <p style="line-height:1.7;color:#334155">Acreditamos ${credits} análisis a tu cuenta.${total} Entra con este enlace para usar tus créditos o revisar tu historial.</p>
      ${button('Entrar a mi dashboard', link)}
      <p style="font-size:13px;color:#64748b;line-height:1.6">Usa siempre este mismo email para compras, historial y soporte.</p>
    `),
    text: `Pago confirmado. Acreditamos ${credits} análisis.${total}\nDashboard: ${link}\nSoporte: ${SUPPORT_EMAIL}`,
  })
}
