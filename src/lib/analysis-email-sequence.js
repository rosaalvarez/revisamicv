import crypto from 'crypto'
import { normalizeEmail } from './token-rules.js'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://revisamicv.lat').replace(/\/$/, '')
const SECRET = process.env.MAGIC_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.STRIPE_SECRET_KEY || 'dev-only-revisamicv-secret'

export function shouldCreateSequence(existingSequences = []) {
  return !existingSequences.some((sequence) => sequence?.status === 'active')
}

export function getNextSequenceStep(sequence = {}) {
  if (!sequence.day0_sent_at) return 'day0'
  if (!sequence.day2_sent_at) return 'day2'
  if (!sequence.day6_sent_at) return 'day6'
  return null
}

function signUnsubscribe(email, sequenceId) {
  return crypto.createHmac('sha256', SECRET).update(`${normalizeEmail(email)}:${sequenceId}`).digest('hex')
}

export function verifyUnsubscribeToken(email, sequenceId, token) {
  if (!email || !sequenceId || !token) return false
  const expected = signUnsubscribe(email, sequenceId)
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(token)))
  } catch {
    return false
  }
}

export function buildUnsubscribeUrl(email, sequenceId) {
  const normalized = normalizeEmail(email)
  const token = signUnsubscribe(normalized, sequenceId)
  const params = new URLSearchParams({ email: normalized, sequence_id: String(sequenceId || ''), token })
  return `${APP_URL}/api/email/unsubscribe?${params.toString()}`
}

function scoreDelta(context) {
  const original = Math.round(Number(context.originalScore ?? context.original_score ?? 0))
  const adapted = Math.round(Number(context.adaptedScore ?? context.adapted_score ?? context.score ?? 0))
  if (Number.isFinite(original) && original > 0 && Number.isFinite(adapted) && adapted > 0) return `${original} → ${adapted}`
  if (Number.isFinite(adapted) && adapted > 0) return `${adapted}/100`
  return 'resultado listo'
}

function layout(title, body, unsubscribeUrl) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;background:#F7FAFF;padding:28px;color:#142033">
      <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #DDE8F8;border-radius:22px;overflow:hidden">
        <div style="background:#2D6BE0;color:white;padding:22px 24px">
          <div style="font-weight:800;font-size:18px">RevisaMiCV</div>
          <div style="color:#DCE9FF;font-size:13px;margin-top:4px">CVs adaptados a vacantes reales, sin inventar experiencia</div>
        </div>
        <div style="padding:28px">
          <h1 style="font-size:24px;line-height:1.2;margin:0 0 16px;color:#142033">${title}</h1>
          ${body}
          <p style="font-size:12px;color:#64748b;line-height:1.6;margin-top:26px">Recibes este correo porque hiciste un análisis en RevisaMiCV. <a href="${unsubscribeUrl}" style="color:#2D6BE0">Darse de baja</a>.</p>
        </div>
      </div>
    </div>`
}

function button(label, href) {
  return `<p style="margin:24px 0"><a href="${href}" style="display:inline-block;background:#2D6BE0;color:white;text-decoration:none;font-weight:800;padding:14px 20px;border-radius:999px">${label}</a></p>`
}

export function buildAnalysisEmail(step, context) {
  const language = context.language === 'english' ? 'english' : 'spanish'
  const delta = scoreDelta(context)
  const dashboardUrl = context.dashboardUrl || context.dashboard_url || `${APP_URL}/dashboard`
  const analyzeUrl = `${APP_URL}/analizar`
  const unsubscribeUrl = context.unsubscribeUrl || context.unsubscribe_url || buildUnsubscribeUrl(context.email, context.sequenceId || context.sequence_id || 'preview')
  const vacancyTitle = context.vacancyTitle || context.vacancy_title || 'esta vacante'

  if (language === 'english') {
    if (step === 'day2') {
      const subject = 'Did you apply with your adapted CV?'
      const paragraph = 'One quick reminder: the next vacancy asks for different things, so it deserves its own analysis instead of reusing the same CV blindly.'
      return { subject, html: layout(subject, `<p style="line-height:1.7;color:#334155">${paragraph}</p>${button('Analyze my next vacancy', analyzeUrl)}`, unsubscribeUrl), text: `${paragraph}\nAnalyze my next vacancy: ${analyzeUrl}\nUnsubscribe: ${unsubscribeUrl}` }
    }
    if (step === 'day6') {
      const subject = `Your CV went from ${delta.replace(' → ', ' to ')} for that vacancy`
      const paragraph = `For ${vacancyTitle}, your measured delta was ${delta}. Do the same with the next vacancy: each one asks for different evidence and keywords.`
      return { subject, html: layout(subject, `<p style="line-height:1.7;color:#334155">${paragraph}</p>${button('Analyze my next vacancy', analyzeUrl)}`, unsubscribeUrl), text: `${paragraph}\nAnalyze: ${analyzeUrl}\nUnsubscribe: ${unsubscribeUrl}` }
    }
    const subject = 'Your adapted CV is ready in RevisaMiCV'
    const paragraph = `Your analysis for ${vacancyTitle} is ready. Measured delta: ${delta}. You can recover the result and downloads from your dashboard.`
    return { subject, html: layout(subject, `<p style="line-height:1.7;color:#334155">${paragraph}</p>${button('Open dashboard', dashboardUrl)}`, unsubscribeUrl), text: `${paragraph}\nDashboard: ${dashboardUrl}\nUnsubscribe: ${unsubscribeUrl}` }
  }

  if (step === 'day2') {
    const subject = '¿Ya aplicaste con tu CV adaptado?'
    const paragraph = 'Un recordatorio rápido: la siguiente vacante pide cosas distintas, así que conviene analizarla por separado en vez de reutilizar el mismo CV a ciegas.'
    return { subject, html: layout(subject, `<p style="line-height:1.7;color:#334155">${paragraph}</p>${button('Analizar mi próxima vacante', analyzeUrl)}`, unsubscribeUrl), text: `${paragraph}\nAnalizar mi próxima vacante: ${analyzeUrl}\nDarse de baja: ${unsubscribeUrl}` }
  }

  if (step === 'day6') {
    const original = Math.round(Number(context.originalScore ?? context.original_score ?? 0))
    const adapted = Math.round(Number(context.adaptedScore ?? context.adapted_score ?? 0))
    const subject = original && adapted ? `Tu CV pasó de ${original} a ${adapted} para esa vacante` : 'Haz lo mismo con tu siguiente vacante'
    const paragraph = `Para ${vacancyTitle}, tu delta real fue ${delta}. Haz lo mismo con la siguiente: cada vacante pide evidencia y keywords distintas.`
    return { subject, html: layout(subject, `<p style="line-height:1.7;color:#334155">${paragraph}</p>${button('Analizar la siguiente vacante', analyzeUrl)}`, unsubscribeUrl), text: `${paragraph}\nAnalizar: ${analyzeUrl}\nDarse de baja: ${unsubscribeUrl}` }
  }

  const subject = 'Tu CV adaptado está listo en RevisaMiCV'
  const paragraph = `Terminamos tu análisis para ${vacancyTitle}. Delta real: ${delta}. Puedes volver al dashboard para recuperar el resultado y descargar tu CV otra vez.`
  return { subject, html: layout(subject, `<p style="line-height:1.7;color:#334155">${paragraph}</p>${button('Ver mi resultado', dashboardUrl)}`, unsubscribeUrl), text: `${paragraph}\nDashboard: ${dashboardUrl}\nDarse de baja: ${unsubscribeUrl}` }
}
