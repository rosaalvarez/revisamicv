/* eslint-disable */
'use client'

import { useEffect, useState, useRef } from 'react'
import type { ReactNode } from 'react'
import { UploadIcon, SparklesIcon, ArrowRightIcon } from '@/components/icons'
import EditableCvForm from '@/components/EditableCvForm'
import { getFriendlyApiError, validateCvFile, validateEmail, validateJobDescription, MIN_JOB_DESCRIPTION_CHARS } from '@/lib/input-validation'
import { getFileExtensionForAnalytics, getFileSizeBucket, trackEvent } from '@/lib/analytics'
import { optimizedCvToPlainText } from '@/lib/cv-formatters'
import { buildRiskyRevisionPrompt, buildLowScoreCoachingPrompt, coachBlockedChange, summarizeCvChanges } from '@/lib/result-ux'

type ClarificationPrompt = {
  question: string
  options?: string[]
  freeTextLabel?: string
}

type ProcessResult = {
  compatibilityScore?: number
  revisedCompatibilityScore?: number
  revisionScoreExplanation?: string
  matchBreakdown?: Record<string, { score?: number; summary?: string } | number | string>
  fitVerdict?: string
  positioningAngle?: string
  applicationDecision?: 'optimize' | 'optimize_with_caution' | 'needs_clarification' | 'not_recommended'
  decisionReason?: string
  clarificationQuestions?: Array<string | ClarificationPrompt>
  strengths?: string[]
  gaps?: string[]
  keywordsToInclude?: string[]
  honestyWarnings?: string[]
  optimizedCV?: any
  coverLetter?: string
  rawText?: string
  tokens_remaining?: number
  auth_token?: string
  dashboard_url?: string
}

const languageOptions = [
  { value: 'english', label: 'English', helper: 'Para USA, Canadá, remoto global o vacantes en inglés' },
  { value: 'spanish', label: 'Español', helper: 'Para España, LATAM o vacantes en español' },
] as const

const decisionCopy = {
  optimize: {
    label: 'Podemos optimizar con buena base',
    title: 'Hay suficiente evidencia para adaptar el CV',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  },
  optimize_with_caution: {
    label: 'Optimizar con cuidado',
    title: 'Hay puente, pero conviene revisar brechas antes de aplicar',
    tone: 'border-amber-200 bg-amber-50 text-amber-950',
  },
  needs_clarification: {
    label: 'Faltan datos críticos',
    title: 'Responde estas preguntas antes de decidir si esta vacante conviene',
    tone: 'border-[var(--color-primary)] bg-orange-50 text-[var(--color-ink)]',
  },
  not_recommended: {
    label: 'No recomendado para este perfil',
    title: 'La vacante exige evidencia que el CV no demuestra',
    tone: 'border-red-200 bg-red-50 text-red-950',
  },
} as const

const analysisProgressSteps = [
  { pct: 12, label: 'Subiendo y leyendo tu CV...' },
  { pct: 24, label: 'Extrayendo experiencia, skills y fechas...' },
  { pct: 38, label: 'Leyendo requisitos de la vacante...' },
  { pct: 52, label: 'Comparando tu CV base contra la vacante...' },
  { pct: 68, label: 'Detectando brechas y oportunidades transferibles...' },
  { pct: 82, label: 'Redactando propuesta optimizada sin inventar experiencia...' },
  { pct: 94, label: 'Última parte: armando diagnóstico y descargas. Puede tardar hasta 1 minuto...' },
]

const revisionProgressSteps = [
  { pct: 20, label: 'Leyendo tu instrucción...' },
  { pct: 40, label: 'Validando qué se puede agregar sin inventar...' },
  { pct: 62, label: 'Actualizando skills, perfil y bullets...' },
  { pct: 82, label: 'Revisando coherencia con la vacante...' },
  { pct: 94, label: 'Preparando resumen de cambios...' },
]

const fallbackClarificationOptions = ['Sí, tengo experiencia relacionada', 'No directamente', 'Parcialmente o en un proyecto puntual', 'Otro: escribir mi caso']

function buildDownloadFilename(cv: any, format: 'pdf' | 'docx' | 'txt') {
  const rawName = typeof cv === 'object' ? (cv?.candidateName || cv?.name || 'candidato') : 'candidato'
  const rawTarget = typeof cv === 'object' ? (cv?.targetTitle || cv?.headline || 'cv') : 'cv'
  const safe = `${rawName}-${rawTarget}-revisamicv`
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()

  return `${safe || 'cv-revisamicv'}.${format}`
}

function uniqueCleanList(items: unknown[]) {
  return Array.from(new Set(items.map((item) => String(item || '').trim()).filter(Boolean)))
}

function collectCvSkills(cv: any) {
  if (!cv || typeof cv !== 'object') return []
  return uniqueCleanList([
    ...(cv.coreCompetencies || []),
    ...(cv.skills || []),
    ...(cv.technicalSkills || []),
    ...(cv.tools || []),
  ])
}

function getAddedSkills(beforeCv: any, afterCv: any) {
  const before = new Set(collectCvSkills(beforeCv).map((item) => item.toLowerCase()))
  return collectCvSkills(afterCv).filter((item) => !before.has(item.toLowerCase())).slice(0, 12)
}

function normalizeClarificationPrompts(value: ProcessResult['clarificationQuestions']) {
  if (!Array.isArray(value)) return []
  return value
    .map((item): ClarificationPrompt | null => {
      if (typeof item === 'string') {
        const question = item.trim()
        return question ? { question, options: fallbackClarificationOptions, freeTextLabel: 'Escribe tu caso con tus palabras' } : null
      }
      if (item && typeof item === 'object') {
        const question = String(item.question || '').trim()
        const options = Array.isArray(item.options)
          ? item.options.map((option) => String(option || '').trim()).filter(Boolean).slice(0, 4)
          : []
        return question ? {
          question,
          options: options.length ? options : fallbackClarificationOptions,
          freeTextLabel: item.freeTextLabel || 'Otro: escribe tu caso',
        } : null
      }
      return null
    })
    .filter(Boolean)
    .slice(0, 3) as ClarificationPrompt[]
}

function buildClarificationInstruction(prompts: ClarificationPrompt[], answers: Record<number, { option: string; detail: string }>) {
  const lines = prompts.map((prompt, index) => {
    const answer = answers[index]
    return `${index + 1}. Pregunta: ${prompt.question}\nOpción seleccionada: ${answer?.option || 'Sin seleccionar'}\nDetalle del usuario: ${answer?.detail || 'Sin detalle adicional'}`
  })

  return `Usa estas respuestas de aclaración para ajustar el CV a la vacante. Agrega solo skills, enfoque o evidencia que estén soportados por las respuestas del usuario. Si una respuesta dice no, no estoy segura o no da evidencia suficiente, no inventes; deja una nota de seguridad.\n\n${lines.join('\n\n')}`
}

function renderList(title: string, items?: string[]) {
  if (!items?.length) return null
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="font-bold text-slate-900 mb-3">{title}</h3>
      <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
        {items.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    </section>
  )
}

const matchBreakdownLabels: Record<string, string> = {
  requiredSkills: 'Skills obligatorias',
  preferredSkills: 'Skills deseables',
  keywordMatch: 'Keywords de la vacante',
  experienceAlignment: 'Experiencia alineada',
  educationCertification: 'Educación / certificaciones',
  atsFormattingRisk: 'Formato ATS seguro',
  honestyRisk: 'Veracidad / riesgo de inventar',
}

function getScoreTone(score?: number) {
  if (typeof score !== 'number') {
    return {
      label: 'Diagnóstico pendiente',
      action: 'Genera el análisis para ver prioridad de aplicación.',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      bar: 'bg-slate-400',
    }
  }

  if (score >= 85) {
    return {
      label: 'Aplicación fuerte',
      action: 'Puedes aplicar con el CV adaptado y revisar detalles finales.',
      bg: 'bg-green-100',
      text: 'text-green-800',
      bar: 'bg-green-500',
    }
  }

  if (score >= 70) {
    return {
      label: 'Buena oportunidad',
      action: 'Conviene aplicar después de reforzar keywords y brechas menores.',
      bg: 'bg-orange-100',
      text: 'text-[var(--color-primary-deep)]',
      bar: 'bg-[var(--color-primary)]',
    }
  }

  if (score >= 55) {
    return {
      label: 'Aplicación estratégica',
      action: 'Aplica solo si puedes explicar bien la transición y revisar brechas.',
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      bar: 'bg-amber-500',
    }
  }

  return {
    label: 'Aplicar con cuidado',
    action: 'La vacante parece lejana. Evita inventar experiencia y evalúa otra opción.',
    bg: 'bg-red-100',
    text: 'text-red-800',
    bar: 'bg-red-500',
  }
}

function normalizeScore(value: unknown) {
  const score = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(score)) return undefined
  return Math.max(0, Math.min(100, Math.round(score)))
}

function looksLikeRiskyHonestySummary(summary?: string) {
  if (!summary) return false
  const text = summary.toLowerCase()
  return /deshonesto|no está presente|no esta presente|fuera del perfil|requiere experiencia|sin experiencia|inventar|no soportad|salto profesional|brecha/.test(text)
}

function getBreakdownDisplayScore(key: string, score?: number, summary?: string) {
  if (score === undefined) return undefined
  if (key === 'honestyRisk' && score >= 70 && looksLikeRiskyHonestySummary(summary)) {
    return Math.max(0, Math.min(100, 100 - score))
  }
  return score
}

function renderMatchBreakdown(breakdown?: ProcessResult['matchBreakdown']) {
  if (!breakdown || typeof breakdown !== 'object') return null

  const entries = Object.entries(breakdown)
    .map(([key, value]) => {
      if (typeof value === 'number' || typeof value === 'string') {
        const rawScore = normalizeScore(value)
        return { key, label: matchBreakdownLabels[key] || key, score: getBreakdownDisplayScore(key, rawScore, ''), summary: '' }
      }
      const summary = value?.summary || ''
      const rawScore = normalizeScore(value?.score)
      return {
        key,
        label: matchBreakdownLabels[key] || key,
        score: getBreakdownDisplayScore(key, rawScore, summary),
        summary,
      }
    })
    .filter((item) => item.score !== undefined || item.summary)

  if (!entries.length) return null

  return (
    <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-2)] p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary-deep)]">Diagnóstico por categorías</p>
        <h3 className="text-xl font-bold text-slate-950">Dónde encaja tu CV y dónde hay brechas</h3>
        <p className="text-sm text-slate-600 mt-1">Esto explica el score como lo haría un ATS/reclutador: requisitos, keywords, experiencia, formato y riesgos.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {entries.map((item) => {
          const tone = getScoreTone(item.score)
          const width = typeof item.score === 'number' ? `${item.score}%` : '0%'

          return (
            <div key={item.key} className="rounded-xl bg-white border border-[var(--color-line)] p-4 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-900 text-sm">{item.label}</p>
                {item.score !== undefined && <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tone.bg} ${tone.text}`}>{item.score}/100</span>}
              </div>
              {item.score !== undefined && (
                <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${tone.bar}`} style={{ width }} />
                </div>
              )}
              {item.summary && <p className="text-xs text-slate-600 mt-2 leading-relaxed">{item.summary}</p>}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function renderActionPlan(result: ProcessResult) {
  const topKeywords = result.keywordsToInclude?.slice(0, 6) || []
  const firstGap = result.gaps?.[0]
  const firstWarning = result.honestyWarnings?.[0]

  const actions = [
    topKeywords.length ? `Refuerza estas keywords en el CV adaptado: ${topKeywords.join(', ')}.` : 'Revisa que las keywords principales de la vacante estén reflejadas de forma natural.',
    firstGap ? `Revisa esta brecha antes de enviar: ${firstGap}` : 'Valida que el perfil, skills y experiencia estén alineados con el cargo objetivo.',
    firstWarning ? `Chequeo de honestidad: ${firstWarning}` : 'Haz una lectura final para confirmar que todo lo generado está soportado por tu experiencia real.',
  ]

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Plan de acción</p>
      <h3 className="text-xl font-bold text-slate-950 mt-1">Qué hacer antes de aplicar</h3>
      <div className="mt-4 grid gap-3">
        {actions.map((action, index) => (
          <div key={action} className="flex gap-3 rounded-xl bg-[var(--color-paper-2)] border border-slate-100 p-3 text-sm text-slate-700">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-[var(--color-ink)]">{index + 1}</span>
            <p className="leading-relaxed">{action}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function renderDecisionGate(result: ProcessResult, onOpenQuestions?: () => void) {
  const decision = result.applicationDecision
  const questions = normalizeClarificationPrompts(result.clarificationQuestions)
  if (!decision && !questions.length && !result.decisionReason) return null

  const copy = decision ? decisionCopy[decision] : decisionCopy.optimize_with_caution
  const shouldShowQuestions = questions.length > 0 && (decision === 'needs_clarification' || decision === 'optimize_with_caution' || decision === 'not_recommended')

  return (
    <section className={`rounded-2xl border p-5 shadow-sm ${copy.tone}`}>
      <p className="text-xs font-bold uppercase tracking-wide opacity-70">Filtro inteligente de evidencia</p>
      <h3 className="mt-1 text-xl font-bold">{copy.title}</h3>
      <p className="mt-2 inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-bold">{copy.label}</p>
      {result.decisionReason && <p className="mt-3 text-sm leading-6 opacity-90">{result.decisionReason}</p>}
      {shouldShowQuestions && (
        <div className="mt-4 rounded-2xl bg-white/70 p-4">
          <p className="text-sm font-bold">Máximo 3 preguntas para no adivinar:</p>
          <ol className="mt-3 space-y-2 text-sm leading-6">
            {questions.map((prompt, index) => (
              <li key={prompt.question} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">{index + 1}</span>
                <span>{prompt.question}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs opacity-75">Si estas respuestas no existen en tu experiencia real, es mejor probar otra vacante más alineada.</p>
          {onOpenQuestions && (
            <button
              type="button"
              onClick={onOpenQuestions}
              className="mt-4 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-[var(--color-primary-deep)]"
            >
              Responder preguntas y ajustar con IA
            </button>
          )}
        </div>
      )}
    </section>
  )
}

function renderOptimizationSummary(result: ProcessResult, cv: any) {
  const score = normalizeScore(result.compatibilityScore)
  const baseScore = score ? Math.max(35, Math.min(score - 18, Math.round(score * 0.62))) : undefined
  const scoreLift = score && baseScore ? score - baseScore : undefined
  const targetTitle = typeof cv === 'object' ? (cv?.targetTitle || cv?.headline) : undefined
  const topKeywords = result.keywordsToInclude?.slice(0, 7) || []
  const gaps = result.gaps?.slice(0, 3) || []
  const warnings = result.honestyWarnings?.slice(0, 2) || []
  const summaryChanged = typeof cv === 'object' && Boolean(cv?.summary)
  const hasExperience = typeof cv === 'object' && Array.isArray(cv?.experience) && cv.experience.length > 0
  const hasProjects = typeof cv === 'object' && Array.isArray(cv?.featuredProjects || cv?.projects) && (cv.featuredProjects || cv.projects).length > 0

  const changes = [
    {
      title: 'Reposicionamos el perfil profesional',
      before: 'El CV base suele contar la experiencia de forma general.',
      after: targetTitle
        ? `La propuesta apunta el perfil hacia “${targetTitle}” y lo conecta con la vacante.`
        : 'La propuesta abre con una narrativa más enfocada en la vacante.',
      why: result.positioningAngle || 'Un reclutador necesita entender en segundos por qué este perfil encaja con el cargo.',
      show: summaryChanged,
    },
    {
      title: 'Alineamos keywords ATS',
      before: 'Las palabras importantes pueden estar ausentes, dispersas o con nombres distintos.',
      after: topKeywords.length
        ? `Se priorizan keywords como: ${topKeywords.join(', ')}.`
        : 'Se reorganizan skills para que el ATS y el reclutador lean mejor el encaje.',
      why: 'Esto mejora lectura automática y humana sin meter habilidades que no estén soportadas por la experiencia.',
      show: true,
    },
    {
      title: 'Convertimos experiencia en evidencia',
      before: 'Responsabilidades sueltas o bullets poco conectados con la vacante.',
      after: 'Los logros quedan escritos como evidencia de impacto, herramientas, alcance y responsabilidades reales.',
      why: 'El CV no solo debe decir qué hiciste; debe demostrar por qué eres una buena apuesta para este rol.',
      show: hasExperience,
    },
    {
      title: 'Protegimos la honestidad del perfil',
      before: 'Un optimizador genérico puede exagerar o inventar experiencia.',
      after: warnings.length
        ? `Marcamos puntos sensibles: ${warnings.join(' ')}`
        : 'La propuesta evita inventar cargos, empresas, certificaciones, fechas o métricas no soportadas.',
      why: 'Queremos subir el score sin crear riesgos en entrevista o verificación.',
      show: true,
    },
    {
      title: 'Preservamos proyectos con valor',
      before: 'Muchos CVs esconden proyectos propios, open-source o métricas públicas.',
      after: 'Los proyectos relevantes quedan destacados como evidencia adicional para la vacante.',
      why: 'En perfiles técnicos, producto o growth, los proyectos pueden pesar tanto como un cargo formal.',
      show: hasProjects,
    },
  ].filter((item) => item.show)

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-br from-[var(--color-block)] via-[var(--color-block)] to-slate-950 p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-paper)]">Qué cambió y por qué</p>
        <div className="mt-3 grid gap-5 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">No solo reescribimos tu CV: lo orientamos a esta vacante.</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--color-paper)]/90">
              Este resumen muestra el valor de la optimización para que sepas qué aceptar, qué revisar y por qué el score puede subir.
            </p>
          </div>
          {score !== undefined && baseScore !== undefined && (
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <div className="flex items-center justify-between text-sm"><span>CV base estimado</span><strong>~{baseScore}/100</strong></div>
              <div className="mt-2 h-2 rounded-full bg-white/15"><div className="h-full rounded-full bg-white/50" style={{ width: `${baseScore}%` }} /></div>
              <div className="mt-4 flex items-center justify-between text-sm"><span>Con RevisaMiCV</span><strong className="text-emerald-300">{score}/100</strong></div>
              <div className="mt-2 h-2 rounded-full bg-white/15"><div className="h-full rounded-full bg-emerald-300" style={{ width: `${score}%` }} /></div>
              {scoreLift !== undefined && <p className="mt-3 text-xs font-semibold text-emerald-200">+{scoreLift} puntos de mejora estimada por adaptación.</p>}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 p-5">
        {changes.map((change, index) => (
          <div key={change.title} className="rounded-2xl border border-slate-200 bg-[var(--color-paper-2)] p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-[var(--color-ink)]">{index + 1}</span>
              <div className="flex-1">
                <h4 className="font-bold text-slate-950">{change.title}</h4>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Antes</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{change.before}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Después</p>
                    <p className="mt-1 text-sm leading-6 text-emerald-900">{change.after}</p>
                  </div>
                </div>
                <p className="mt-3 rounded-xl bg-white p-3 text-sm leading-6 text-slate-700"><span className="font-bold text-slate-950">Por qué importa: </span>{change.why}</p>
              </div>
            </div>
          </div>
        ))}

        {gaps.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-bold text-amber-950">Todavía conviene revisar antes de enviar</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-amber-900">
              {gaps.map((gap, index) => <li key={index}>{gap}</li>)}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

function getCvTitle(cv: any) {
  if (typeof cv === 'object' && cv) {
    const title = cv.targetTitle || cv.headline || 'CV adaptado'
    return `CV_${String(title).replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 36)}_adaptado`
  }
  return 'CV_adaptado'
}

function getCvPreviewBullets(cv: any, limit = 3) {
  if (typeof cv === 'string') {
    return cv.split('\n').map((line) => line.trim()).filter((line) => line.length > 30).slice(0, limit)
  }
  const bullets: string[] = []
  if (cv?.summary) bullets.push(cv.summary)
  const roles = Array.isArray(cv?.experience) ? cv.experience : []
  for (const role of roles) {
    for (const bullet of role?.bullets || []) {
      if (bullet) bullets.push(String(bullet))
      if (bullets.length >= limit) break
    }
    if (bullets.length >= limit) break
  }
  const projects = Array.isArray(cv?.featuredProjects || cv?.projects) ? (cv.featuredProjects || cv.projects) : []
  for (const project of projects) {
    for (const bullet of project?.bullets || project?.achievements || []) {
      if (bullet) bullets.push(String(bullet))
      if (bullets.length >= limit) break
    }
    if (bullets.length >= limit) break
  }
  return bullets.slice(0, limit)
}

function ResultHero({ result, cv }: { result: ProcessResult; cv: any }) {
  const originalScore = normalizeScore(result.compatibilityScore)
  const revisedScore = normalizeScore(result.revisedCompatibilityScore)
  const score = revisedScore ?? originalScore
  const scoreValue = score ?? 0
  const role = typeof cv === 'object' && cv ? (cv.targetTitle || cv.headline || 'Vacante objetivo') : 'Vacante objetivo'
  const keywordScore = getBreakdownDisplayScore('keywords', normalizeScore((result.matchBreakdown?.keywords as any)?.score ?? result.matchBreakdown?.keywords), (result.matchBreakdown?.keywords as any)?.summary || '')
  const experienceScore = getBreakdownDisplayScore('experience', normalizeScore((result.matchBreakdown?.experience as any)?.score ?? result.matchBreakdown?.experience), (result.matchBreakdown?.experience as any)?.summary || '')
  const gapsClosed = Math.min(2, Math.max(0, result.gaps?.length || result.keywordsToInclude?.length ? 2 : 0))

  return (
    <section className="overflow-hidden rounded-[28px] bg-[var(--color-block)] p-7 text-[var(--color-paper)] shadow-[var(--shadow-screen)] md:p-9">
      <div className="grid gap-8 md:grid-cols-[1.35fr_0.65fr] md:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-secondary)]">{String(role).slice(0, 44)}</p>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-tight md:text-5xl">
            {scoreValue >= 75 ? <>Tu experiencia encaja. <em className="text-[var(--color-primary)]">Tu CV no lo estaba mostrando.</em></> : <>Tu CV puede pelear mejor esta vacante. <em className="text-[var(--color-primary)]">Hay que mostrar mejor la evidencia.</em></>}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#DDE8E5]">Cruzamos tu CV real contra esta vacante y reescribimos lo que ya hiciste en el lenguaje que la oferta busca. Sin inventar nada.</p>
        </div>
        <div className="grid justify-center text-center">
          <div className="grid h-40 w-40 place-items-center rounded-full" style={{ background: `conic-gradient(var(--color-primary) ${scoreValue * 3.6}deg, rgba(255,255,255,.13) 0deg)` }}>
            <div className="grid h-28 w-28 place-items-center rounded-full bg-[var(--color-block)]">
              <div><div className="font-display text-5xl font-bold text-[var(--color-primary)]">{score ?? '—'}</div><div className="text-xs text-[#AFC6C0]">/100 compatible</div></div>
            </div>
          </div>
          {revisedScore !== undefined && originalScore !== undefined ? <p className="mt-4 text-sm text-[#B9CDC8]">Tu versión original marcaba {originalScore}/100 para esta vacante.</p> : <p className="mt-4 text-sm text-[#B9CDC8]">Compatibilidad estimada para esta vacante.</p>}
        </div>
      </div>
      <div className="mt-8 grid gap-4 border-t border-white/15 pt-6 md:grid-cols-3">
        {[['Keywords de la vacante', keywordScore], ['Experiencia relevante', experienceScore], ['Brechas cerradas', gapsClosed ? `${gapsClosed} de ${Math.max(gapsClosed, Math.min(4, (result.gaps?.length || 2)))}` : '—']].map(([label, value]) => (
          <div key={label as string}>
            <div className="flex items-center justify-between text-sm text-[#DDE8E5]"><span>{label}</span><strong>{typeof value === 'number' ? `${value}%` : value}</strong></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: typeof value === 'number' ? `${value}%` : value !== '—' ? '100%' : '12%' }} /></div>
          </div>
        ))}
      </div>
    </section>
  )
}

function FindingsSection({ result }: { result: ProcessResult }) {
  const strengths = (result.strengths?.length ? result.strengths : ['Tu experiencia tiene señales que se pueden presentar con más fuerza para esta vacante.']).slice(0, 3)
  const gaps = (result.gaps?.length ? result.gaps : ['Faltaban palabras o evidencia explícita que la vacante espera leer.']).slice(0, 3)
  const keywords = result.keywordsToInclude?.slice(0, 8) || []
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-secondary-deep)]">Lo que encontramos</p>
        <h2 className="font-display text-3xl font-semibold text-[var(--color-ink)]">Tus fortalezas y tus brechas para esta vacante.</h2>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl border border-[var(--color-line)] bg-white p-6">
          <h3 className="text-xl font-bold text-[var(--color-ink)]"><span className="mr-2 text-[var(--color-secondary-deep)]">●</span>Ya tienes fuerte</h3>
          <div className="mt-5 space-y-4">
            {strengths.map((item, index) => <div key={index} className="flex gap-3"><span className="font-bold text-[var(--color-secondary-deep)]">✓</span><p className="text-sm leading-6 text-[var(--color-ink)]">{item}</p></div>)}
          </div>
        </div>
        <div className="rounded-3xl border border-[var(--color-line)] bg-white p-6">
          <h3 className="text-xl font-bold text-[var(--color-ink)]"><span className="mr-2 text-[var(--color-primary)]">●</span>Brechas que cerramos</h3>
          <div className="mt-5 space-y-4">
            {gaps.map((item, index) => <div key={index} className="flex gap-3"><span className="font-bold text-[var(--color-primary)]">↯</span><p className="text-sm leading-6 text-[var(--color-ink)]">{item}</p></div>)}
          </div>
        </div>
      </div>
      {keywords.length > 0 && <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-2)] p-5"><p className="text-sm font-bold text-[var(--color-ink)]">Keywords de la vacante que ahora están presentes en tu CV:</p><div className="mt-4 flex flex-wrap gap-2">{keywords.map((kw) => <span key={kw} className="rounded-full border border-[rgba(15,181,160,.35)] bg-[rgba(15,181,160,.12)] px-3 py-2 text-xs font-bold text-[var(--color-secondary-deep)]">{kw}</span>)}</div></div>}
    </section>
  )
}

function ChangeSection({ result, cv }: { result: ProcessResult; cv: any }) {
  const score = normalizeScore(result.revisedCompatibilityScore ?? result.compatibilityScore)
  const baseScore = score ? Math.max(35, Math.min(score - 18, Math.round(score * 0.65))) : undefined
  const adapted = getCvPreviewBullets(cv, 3)
  const original = ['El CV original contaba responsabilidades de forma general.', 'Varias keywords de la vacante no estaban visibles.', 'La evidencia estaba dispersa o poco conectada con el cargo.']
  return (
    <section className="space-y-5 py-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end"><p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-secondary-deep)]">El cambio</p><h2 className="font-display text-3xl font-semibold text-[var(--color-ink)]">Tus mismos logros, contados para esta vacante.</h2></div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl border border-[var(--color-line)] bg-[#EDE8DC] p-6 opacity-80"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">Tu CV original</p>{baseScore && <span className="font-bold text-[var(--color-ink-soft)]">{baseScore}%</span>}</div><ul className="mt-5 space-y-4 text-sm leading-6 text-[var(--color-ink-soft)]">{original.map((item) => <li key={item}>– {item}</li>)}</ul></div>
        <div className="rounded-3xl border border-[rgba(15,181,160,.35)] bg-[rgba(15,181,160,.07)] p-6 shadow-[var(--shadow-soft)]"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-secondary-deep)]">Adaptado a la vacante</p>{score && <span className="font-bold text-[var(--color-secondary-deep)]">{score}%</span>}</div><ul className="mt-5 space-y-4 text-sm leading-6 text-[var(--color-ink)]">{adapted.length ? adapted.map((item) => <li key={item}>↗ <strong>{item}</strong></li>) : <li>↗ <strong>CV adaptado con lenguaje más cercano a la vacante.</strong></li>}</ul></div>
      </div>
    </section>
  )
}

function renderChipList(items?: string[]) {
  if (!items?.length) return null
  return <p className="text-sm text-slate-800 leading-relaxed">{items.join(', ')}</p>
}

function renderSimpleSection(title: string, items?: string[]) {
  if (!items?.length) return null
  return (
    <div className="border-t border-slate-200 pt-4">
      <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wide text-xs">{title}</h4>
      <ul className="list-disc pl-5 space-y-1 text-sm text-slate-800">
        {items.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    </div>
  )
}

function ResultAccordion({ title, summary, defaultOpen = false, children }: { title: string; summary?: string; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details open={defaultOpen} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
        <div>
          <h3 className="font-bold text-slate-950">{title}</h3>
          {summary && <p className="mt-1 text-sm leading-6 text-slate-500">{summary}</p>}
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 group-open:bg-orange-100 group-open:text-[var(--color-primary-deep)]">
          <span className="group-open:hidden">Abrir</span><span className="hidden group-open:inline">Cerrar</span>
        </span>
      </summary>
      <div className="border-t border-slate-100 p-5 pt-4">{children}</div>
    </details>
  )
}

function renderOptimizedCV(cv: any) {
  if (!cv) return null
  if (typeof cv === 'string') {
    return <pre className="whitespace-pre-wrap text-sm text-slate-800 font-sans">{cv}</pre>
  }

  const contact = typeof cv.contact === 'object' && cv.contact
    ? [cv.contact.email, cv.contact.phone, cv.contact.location, cv.contact.linkedin, cv.contact.portfolio].filter(Boolean).join(' | ')
    : cv.contact

  return (
    <section className="rounded-2xl border border-[var(--color-primary)] bg-white p-6">
      <div className="text-center border-b border-slate-200 pb-4 mb-5">
        <h3 className="font-bold text-slate-950 text-2xl">{cv.candidateName || cv.name || 'CV adaptado ATS'}</h3>
        {contact && <p className="text-sm text-slate-700 mt-1">{contact}</p>}
        {(cv.targetTitle || cv.headline) && <p className="text-sm font-semibold text-slate-900 mt-2">{cv.targetTitle || cv.headline}</p>}
      </div>

      <div className="space-y-5">
        {cv.summary && (
          <div>
            <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wide text-xs">Professional Summary</h4>
            <p className="text-sm text-slate-800 leading-relaxed">{cv.summary}</p>
          </div>
        )}

        {(cv.coreCompetencies?.length > 0 || cv.skills?.length > 0) && (
          <div className="border-t border-slate-200 pt-4">
            <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wide text-xs">Skills</h4>
            {renderChipList([...(cv.coreCompetencies || []), ...(cv.skills || [])])}
          </div>
        )}

        {cv.technicalSkills?.length > 0 && (
          <div className="border-t border-slate-200 pt-4">
            <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wide text-xs">Technical Skills</h4>
            {renderChipList(cv.technicalSkills)}
          </div>
        )}

        {cv.experience?.length > 0 && (
          <div className="space-y-4 border-t border-slate-200 pt-4">
            <h4 className="font-bold text-slate-900 uppercase tracking-wide text-xs">Professional Experience</h4>
            {cv.experience.map((role: any, index: number) => (
              <div key={index}>
                <p className="font-semibold text-slate-950">{role.title}</p>
                <p className="text-sm text-slate-600">{[role.company, role.location, role.dates].filter(Boolean).join(' | ')}</p>
                {role.techStack?.length > 0 && <p className="mt-2 text-xs text-slate-700"><span className="font-bold">Tech Stack:</span> {role.techStack.join(', ')}</p>}
                {role.tools?.length > 0 && <p className="mt-1 text-xs text-slate-700"><span className="font-bold">Tools:</span> {role.tools.join(', ')}</p>}
                <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-slate-800">
                  {role.bullets?.map((bullet: string, bulletIndex: number) => <li key={bulletIndex}>{bullet}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        {((cv.featuredProjects || cv.projects)?.length > 0) && (
          <div className="space-y-4 border-t border-slate-200 pt-4">
            <h4 className="font-bold text-slate-900 uppercase tracking-wide text-xs">Featured Projects</h4>
            {(cv.featuredProjects || cv.projects).map((project: any, index: number) => (
              <div key={index}>
                <p className="font-semibold text-slate-950">{project.name}</p>
                <p className="text-sm text-slate-600">{[project.description, project.role, project.dates].filter(Boolean).join(' | ')}</p>
                {project.techStack?.length > 0 && <p className="mt-2 text-xs text-slate-700"><span className="font-bold">Tech Stack:</span> {project.techStack.join(', ')}</p>}
                {project.tools?.length > 0 && <p className="mt-1 text-xs text-slate-700"><span className="font-bold">Tools:</span> {project.tools.join(', ')}</p>}
                <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-slate-800">
                  {(project.bullets || project.achievements)?.map((bullet: string, bulletIndex: number) => <li key={bulletIndex}>{bullet}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        {renderSimpleSection('Education', cv.education)}
        {renderSimpleSection('Certifications', cv.certifications)}
        {cv.tools?.length > 0 && <div className="border-t border-slate-200 pt-4"><h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wide text-xs">Tools</h4>{renderChipList(cv.tools)}</div>}
        {renderSimpleSection('Languages', cv.languages)}
      </div>
    </section>
  )
}

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [jobFile, setJobFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [outputLanguage, setOutputLanguage] = useState<'english' | 'spanish'>('spanish')
  const [loading, setLoading] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisStepIndex, setAnalysisStepIndex] = useState(0)
  const [result, setResult] = useState<ProcessResult | null>(null)
  const [editableCv, setEditableCv] = useState<any | null>(null)
  const [error, setError] = useState('')
  const [downloadLoading, setDownloadLoading] = useState<'pdf' | 'docx' | 'txt' | null>(null)
  const [revisionInstruction, setRevisionInstruction] = useState('')
  const [revisionLoading, setRevisionLoading] = useState(false)
  const [revisionProgress, setRevisionProgress] = useState(0)
  const [revisionStepIndex, setRevisionStepIndex] = useState(0)
  const [revisionAddedSkills, setRevisionAddedSkills] = useState<string[]>([])
  const [revisionChanges, setRevisionChanges] = useState<Array<{ label: string; detail: string }>>([])
  const [revisionNotes, setRevisionNotes] = useState<string[]>([])
  const [blockedChanges, setBlockedChanges] = useState<string[]>([])
  const [clarificationModalOpen, setClarificationModalOpen] = useState(false)
  const [manualClarificationPrompts, setManualClarificationPrompts] = useState<ClarificationPrompt[]>([])
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<number, { option: string; detail: string }>>({})
  const [copySuccess, setCopySuccess] = useState('')
  const [clarificationError, setClarificationError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const jobFileRef = useRef<HTMLInputElement>(null)
  const [cvPreviewOpen, setCvPreviewOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const normalizedEmailForLinks = email.trim().toLowerCase()
  const dashboardHref = result?.dashboard_url || `/dashboard?email=${encodeURIComponent(normalizedEmailForLinks)}${result?.auth_token ? `&auth=${encodeURIComponent(result.auth_token)}` : ''}`

  useEffect(() => {
    const savedEmail = window.localStorage.getItem('revisamicv_email')
    const savedJob = window.localStorage.getItem('revisamicv_job_description')
    const savedLanguage = window.localStorage.getItem('revisamicv_output_language') as 'english' | 'spanish' | null
    if (savedEmail) setEmail(savedEmail)
    if (savedJob) setJobDescription(savedJob)
    if (savedLanguage === 'english' || savedLanguage === 'spanish') setOutputLanguage(savedLanguage)
    trackEvent('signup_view')
  }, [])

  useEffect(() => {
    if (!loading) return
    setAnalysisProgress(8)
    setAnalysisStepIndex(0)
    const interval = window.setInterval(() => {
      setAnalysisProgress((current) => {
        const next = Math.min(94, current + (current < 55 ? 4 : current < 82 ? 3 : 1))
        const nextIndex = analysisProgressSteps.reduce((lastIndex, step, index) => next >= step.pct ? index : lastIndex, 0)
        setAnalysisStepIndex(Math.max(0, nextIndex))
        return next
      })
    }, 900)
    return () => window.clearInterval(interval)
  }, [loading])

  useEffect(() => {
    if (!loading) return
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = 'El análisis sigue en proceso. Si recargas, tendrás que volver a subir el archivo.'
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [loading])

  useEffect(() => {
    if (!revisionLoading) return
    setRevisionProgress(12)
    setRevisionStepIndex(0)
    const interval = window.setInterval(() => {
      setRevisionProgress((current) => {
        const next = Math.min(94, current + (current < 62 ? 6 : 3))
        const nextIndex = revisionProgressSteps.reduce((lastIndex, step, index) => next >= step.pct ? index : lastIndex, 0)
        setRevisionStepIndex(Math.max(0, nextIndex))
        return next
      })
    }, 700)
    return () => window.clearInterval(interval)
  }, [revisionLoading])

  const setAndRememberEmail = (value: string) => {
    const cleaned = value.replace(/\s+/g, '').slice(0, 254)
    setEmail(cleaned)
    if (cleaned.trim()) window.localStorage.setItem('revisamicv_email', cleaned.trim().toLowerCase())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const emailError = validateEmail(email)
    if (emailError) {
      trackEvent('analysis_validation_error', { field: 'email' })
      return setError(emailError)
    }

    const fileError = validateCvFile(file)
    if (fileError) {
      trackEvent('analysis_validation_error', { field: 'cv_file', extension: getFileExtensionForAnalytics(file?.name), size: getFileSizeBucket(file?.size) })
      return setError(fileError)
    }
    const selectedFile = file as File

    const jobError = jobFile ? '' : validateJobDescription(jobDescription)
    if (jobError) {
      trackEvent('analysis_validation_error', { field: 'job_description', chars: jobDescription.trim().length })
      return setError(jobError)
    }

    trackEvent('analysis_started', {
      language: outputLanguage,
      extension: getFileExtensionForAnalytics(selectedFile.name),
      size: getFileSizeBucket(selectedFile.size),
      job_chars_bucket: jobDescription.length < 1000 ? '<1k' : jobDescription.length < 4000 ? '1-4k' : '4k+',
      job_file: jobFile ? getFileExtensionForAnalytics(jobFile.name) : 'none',
    })

    setLoading(true)
    setAnalysisProgress(8)
    setAnalysisStepIndex(0)
    setError('')

    try {
      const formData = new FormData()
      formData.append('email', email.trim().toLowerCase())
      formData.append('cv', selectedFile)
      formData.append('jobDescription', jobDescription)
      if (jobFile) formData.append('jobFile', jobFile)
      formData.append('outputLanguage', outputLanguage)

      const res = await fetch('/api/process-cv', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(getFriendlyApiError(data.message || data.error, 'No pude procesar el CV. Intenta de nuevo.'))
      setAnalysisProgress(100)
      window.localStorage.setItem('revisamicv_email', email.trim().toLowerCase())
      if (data.auth_token) window.localStorage.setItem('revisamicv_auth_token', data.auth_token)
      window.localStorage.setItem('revisamicv_output_language', outputLanguage)
      trackEvent('analysis_completed', {
        language: outputLanguage,
        score: typeof data.compatibilityScore === 'number' ? Math.round(data.compatibilityScore) : -1,
        decision: data.applicationDecision || 'unknown',
        tokens_remaining: typeof data.tokens_remaining === 'number' ? data.tokens_remaining : -1,
      })
      setResult(data)
      setEditableCv(data.optimizedCV || null)
      setCopySuccess('Te enviamos un enlace por email para volver a descargar este CV desde tu dashboard si cierras la página.')
      setRevisionInstruction('')
      setRevisionNotes([])
      setBlockedChanges([])
      setRevisionAddedSkills([])
      setRevisionChanges([])
      const modelPrompts = Array.isArray(data.clarificationQuestions) ? data.clarificationQuestions : []
      const lowScorePrompt = modelPrompts.length ? null : buildLowScoreCoachingPrompt(data.compatibilityScore)
      setManualClarificationPrompts(lowScorePrompt ? [lowScorePrompt] : [])
      setClarificationAnswers({})
      setClarificationModalOpen(modelPrompts.length > 0 || Boolean(lowScorePrompt))
      if (lowScorePrompt) trackEvent('low_score_coaching_prompt_shown', { score: normalizeScore(data.compatibilityScore) ?? -1 })
    } catch (err: any) {
      trackEvent('analysis_failed', { message: String(err.message || '').slice(0, 80) })
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const openEditor = () => {
    setCvPreviewOpen(false)
    setEditorOpen(true)
    setTimeout(() => document.getElementById('cv-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const downloadFile = async (format: 'pdf' | 'docx' | 'txt') => {
    const cvForDownload = editableCv || result?.optimizedCV
    if (!cvForDownload) return setError('Primero genera un CV adaptado')

    trackEvent('download_started', { format })
    setDownloadLoading(format)
    setError('')
    setCopySuccess('')

    try {
      const res = await fetch(`/api/generate-${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optimizedCV: cvForDownload,
          outputLanguage,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(getFriendlyApiError(data.message || data.error, `No pude generar el archivo ${format.toUpperCase()}`))
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = buildDownloadFilename(cvForDownload, format)
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      trackEvent('download_completed', { format })
    } catch (err: any) {
      trackEvent('download_failed', { format, message: String(err.message || '').slice(0, 80) })
      setError(err.message)
    } finally {
      setDownloadLoading(null)
    }
  }

  const copyCvText = async () => {
    const cvForCopy = editableCv || result?.optimizedCV || result?.rawText
    if (!cvForCopy) return setError('Primero genera un CV adaptado')

    try {
      await navigator.clipboard.writeText(typeof cvForCopy === 'string' ? cvForCopy : optimizedCvToPlainText(cvForCopy, outputLanguage))
      trackEvent('cv_copied')
      setCopySuccess('CV copiado al portapapeles')
      setError('')
    } catch {
      setError('No pude copiar el CV. Intenta descargar el TXT.')
    }
  }

  const copyCoverLetter = async () => {
    if (!result?.coverLetter) return setError('No hay cover letter para copiar')
    try {
      await navigator.clipboard.writeText(result.coverLetter)
      trackEvent('cover_letter_copied')
      setCopySuccess('Cover letter copiada. Pégala en el email, LinkedIn o portal de aplicación.')
      setError('')
    } catch {
      setError('No pude copiar la cover letter. Selecciona el texto y cópialo manualmente.')
    }
  }

  const submitClarificationAnswers = async () => {
    const questions = manualClarificationPrompts.length
      ? manualClarificationPrompts
      : normalizeClarificationPrompts(result?.clarificationQuestions)
    if (!questions.length) return setClarificationModalOpen(false)

    const missing = questions.findIndex((_, index) => {
      const answer = clarificationAnswers[index]
      if (!answer?.option) return true
      const optionNeedsDetail = !/^no|no directamente|no tengo/i.test(answer.option)
      return optionNeedsDetail && answer.detail.trim().length < 20
    })

    if (missing >= 0) {
      setClarificationError(`En la pregunta ${missing + 1}, elige una opción y escribe una frase concreta con lo que sí sabes/hiciste. Así la IA no inventa.`)
      return
    }

    setClarificationError('')
    setClarificationModalOpen(false)
    setManualClarificationPrompts([])
    setCopySuccess('Estoy aplicando tus respuestas. Te muestro el CV ajustado en unos segundos.')
    await applyRevisionInstruction(buildClarificationInstruction(questions, clarificationAnswers))
  }

  const applyRevisionInstruction = async (instructionOverride?: string) => {
    const cvToRevise = editableCv || result?.optimizedCV
    const instruction = (instructionOverride || revisionInstruction).trim()
    if (!cvToRevise) return setError('Primero genera un CV adaptado')
    if (!instruction) return setError('Escribe qué cambio quieres aplicar')

    if (!instructionOverride) {
      const prompt = buildRiskyRevisionPrompt(instruction)
      if (prompt) {
        setManualClarificationPrompts([prompt])
        setClarificationAnswers({})
        setClarificationModalOpen(true)
        setCopySuccess('Te hago 3 preguntas rápidas para ajustar sin inventar y sin enredarte.')
        trackEvent('revision_clarification_prompted', { source: 'manual' })
        return
      }
    }

    trackEvent('revision_started', { source: instructionOverride ? 'clarification' : 'manual' })
    setRevisionLoading(true)
    setRevisionProgress(12)
    setRevisionStepIndex(0)
    setError('')
    setCopySuccess('')
    setRevisionNotes([])
    setBlockedChanges([])
    setRevisionAddedSkills([])
    setRevisionChanges([])

    try {
      const beforeCv = cvToRevise
      const res = await fetch('/api/revise-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          optimizedCV: cvToRevise,
          revisionInstruction: instruction,
          outputLanguage,
          jobDescription,
          currentCompatibilityScore: result?.revisedCompatibilityScore ?? result?.compatibilityScore,
          matchBreakdown: result?.matchBreakdown,
          gaps: result?.gaps,
          keywordsToInclude: result?.keywordsToInclude,
          honestyWarnings: result?.honestyWarnings,
          applicationDecision: result?.applicationDecision,
        }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(getFriendlyApiError(data.message || data.error, 'No pude aplicar el ajuste. Intenta de nuevo.'))
      setRevisionProgress(100)
      const revisedScore = normalizeScore(data.revisedCompatibilityScore)
      setEditableCv(data.optimizedCV)
      setResult((current) => current ? {
        ...current,
        optimizedCV: data.optimizedCV,
        ...(revisedScore !== undefined ? { revisedCompatibilityScore: revisedScore } : {}),
        ...(typeof data.revisionScoreExplanation === 'string' ? { revisionScoreExplanation: data.revisionScoreExplanation } : {}),
      } : current)
      const addedSkills = getAddedSkills(beforeCv, data.optimizedCV)
      setRevisionAddedSkills(addedSkills)
      setRevisionChanges(summarizeCvChanges(beforeCv, data.optimizedCV))
      setRevisionNotes(Array.isArray(data.revisionNotes) ? data.revisionNotes : [])
      setBlockedChanges(Array.isArray(data.blockedChanges) ? data.blockedChanges.map(coachBlockedChange) : [])
      setRevisionInstruction('')
      setManualClarificationPrompts([])
      setClarificationModalOpen(false)
      trackEvent('revision_completed', { added_skills: addedSkills.length, blocked_changes: Array.isArray(data.blockedChanges) ? data.blockedChanges.length : 0 })
      setCopySuccess('Listo. Te muestro qué cambió y qué dejamos como recomendación para cuidar tu credibilidad.')
    } catch (err: any) {
      trackEvent('revision_failed', { message: String(err.message || '').slice(0, 80) })
      setError(err.message)
    } finally {
      setRevisionLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)]">
      <nav className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-[rgba(251,248,242,.92)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <a href="/" className="flex items-center gap-2 font-display text-lg font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-primary)] text-sm font-bold text-white">R</span>
            RevisaMiCV
          </a>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden rounded-full border border-[rgba(14,140,125,.35)] bg-[rgba(15,181,160,.12)] px-3 py-1.5 font-semibold text-[var(--color-secondary-deep)] md:inline-flex">● 1 análisis gratis</span>
            <a href="/dashboard" className="font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">Dashboard</a>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-5 pb-12">
        <div className="py-10 text-center md:py-12">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--color-secondary-deep)]">{result ? 'Resultado de tu análisis' : 'Paso 1 de 2 · Tu análisis'}</p>
          <h1 className="mx-auto mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            {result ? 'Tu CV ya está cruzado contra esta vacante.' : 'Analiza tu CV contra esta vacante.'}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-[var(--color-ink-soft)]">
            {result
              ? 'Revisa compatibilidad, brechas, keywords y descarga una versión adaptada sin inventar experiencia.'
              : 'Sube tu CV, pega la vacante y en minutos sabes qué tan compatible eres. Si encaja, recibes una versión adaptada lista para descargar.'}
          </p>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="mx-auto mb-8 grid max-w-xl grid-cols-3 text-center">
              {[['1','Tu CV'], ['2','La vacante'], ['3','Resultado']].map(([num, label], index) => (
                <div key={label} className="relative flex flex-col items-center gap-2 text-xs font-semibold text-[var(--color-ink-soft)]">
                  {index < 2 && <span className="absolute left-1/2 top-4 h-0.5 w-full bg-[var(--color-line)]" />}
                  <span className={`relative z-10 grid h-8 w-8 place-items-center rounded-full border-2 ${index < 2 ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-silence)]'}`}>{num}</span>
                  <span className={index < 2 ? 'text-[var(--color-ink)]' : ''}>{label}</span>
                </div>
              ))}
            </div>

            <section className="rounded-2xl border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-soft)] md:p-6">
              <label className="text-sm font-bold text-[var(--color-ink)]">Tu email</label>
              <input
                type="text"
                inputMode="email"
                autoComplete="email"
                maxLength={254}
                value={email}
                onChange={(e) => setAndRememberEmail(e.target.value)}
                placeholder="tu@email.com"
                className="mt-2 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-2)] px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-orange-100"
                required
              />
              <p className="mt-2 text-xs text-[var(--color-ink-soft)]">Lo usamos para tu prueba gratis, guardar créditos y recuperar tus resultados.</p>
            </section>

            <div className="grid gap-5 md:grid-cols-2">
              <section className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-soft)]">
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--color-ink)] text-xs font-bold text-[var(--color-primary)]">1</span>
                  <h2 className="font-display text-2xl font-semibold">Tu CV</h2>
                </div>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="cursor-pointer rounded-xl border-2 border-dashed border-[var(--color-line)] bg-[var(--color-paper-2)] px-5 py-10 text-center transition hover:border-[var(--color-primary)] hover:bg-orange-50"
                >
                  <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-orange-100 text-[var(--color-primary-deep)]">
                    <UploadIcon className="h-6 w-6" />
                  </div>
                  {file ? (
                    <p className="font-bold text-[var(--color-primary-deep)]">{file.name}</p>
                  ) : (
                    <>
                      <p className="font-bold">Arrastra tu CV o haz clic para subirlo</p>
                      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Tal como lo tienes hoy. En español o en inglés.</p>
                    </>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => {
                      const selected = e.target.files?.[0] || null
                      setFile(selected)
                      if (selected) trackEvent('cv_file_selected', { extension: getFileExtensionForAnalytics(selected.name), size: getFileSizeBucket(selected.size) })
                    }}
                    className="hidden"
                  />
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-semibold text-[var(--color-ink-soft)]">
                  <span className="rounded-md border border-[var(--color-line)] bg-[var(--color-paper-2)] px-3 py-1">PDF</span>
                  <span className="rounded-md border border-[var(--color-line)] bg-[var(--color-paper-2)] px-3 py-1">Word .docx</span>
                  <span className="rounded-md border border-[var(--color-line)] bg-[var(--color-paper-2)] px-3 py-1">TXT</span>
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-soft)]">
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--color-ink)] text-xs font-bold text-[var(--color-primary)]">2</span>
                  <h2 className="font-display text-2xl font-semibold">La vacante</h2>
                </div>
                <textarea
                  value={jobDescription}
                  onChange={(e) => {
                    const value = e.target.value
                    setJobDescription(value)
                    window.localStorage.setItem('revisamicv_job_description', value)
                  }}
                  rows={9}
                  placeholder="Pega aquí la vacante completa: responsabilidades, requisitos, salario si aparece, skills y contexto del cargo. No la resumas."
                  className="w-full resize-y rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-2)] p-4 text-sm leading-6 text-[var(--color-ink)] outline-none transition placeholder:text-[#A8A294] focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-orange-100"
                  required={!jobFile}
                />
                <div className="mt-3 rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-paper-2)] p-3">
                  <input
                    ref={jobFileRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => {
                      const selected = e.target.files?.[0] || null
                      setJobFile(selected)
                      if (selected) trackEvent('job_file_selected', { extension: getFileExtensionForAnalytics(selected.name), size: getFileSizeBucket(selected.size) })
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => jobFileRef.current?.click()}
                    className="w-full rounded-lg border border-[var(--color-line)] bg-white px-4 py-3 text-left text-sm font-bold text-[var(--color-ink)] hover:border-[var(--color-primary)]"
                  >
                    {jobFile ? `Vacante adjunta: ${jobFile.name}` : 'O también sube la vacante en PDF, Word o TXT'}
                  </button>
                  {jobFile && (
                    <button type="button" onClick={() => setJobFile(null)} className="mt-2 text-xs font-bold text-[var(--color-primary-deep)]">Quitar archivo de vacante</button>
                  )}
                </div>
                <p className={`mt-2 text-xs ${!jobFile && jobDescription.trim().length > 0 && jobDescription.trim().length < MIN_JOB_DESCRIPTION_CHARS ? 'font-semibold text-amber-700' : 'text-[var(--color-ink-soft)]'}`}>
                  {jobDescription.trim().length} caracteres escritos. Necesitamos mínimo {MIN_JOB_DESCRIPTION_CHARS} si no adjuntas archivo; máximo 12.000. Puedes pegar mucho más de 120 caracteres.
                </p>
              </section>            </div>

            <section className="flex flex-col gap-4 rounded-2xl border border-[var(--color-line)] bg-white p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-bold">Idioma del CV adaptado</p>
                <p className="text-sm text-[var(--color-ink-soft)]">El diagnóstico y la versión descargable salen en este idioma.</p>
              </div>
              <div className="inline-flex rounded-full border border-[var(--color-line)] bg-[var(--color-paper-2)] p-1">
                {languageOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setOutputLanguage(option.value)
                      trackEvent('language_selected', { language: option.value })
                      window.localStorage.setItem('revisamicv_output_language', option.value)
                    }}
                    className={`rounded-full px-5 py-2 text-sm font-bold transition ${outputLanguage === option.value ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            {error && <p className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

            {loading && (
              <section className="mx-auto max-w-2xl rounded-3xl bg-[var(--color-block)] p-7 text-[var(--color-paper)] shadow-[var(--shadow-screen)]">
                <h3 className="text-center font-display text-2xl font-semibold text-white">Cruzando tu CV con la vacante…</h3>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary-deep)] to-[var(--color-primary)] transition-all duration-700" style={{ width: `${analysisProgress}%` }} />
                </div>
                <p className="mt-4 text-center text-sm text-[#CFE3DE]">{analysisProgressSteps[analysisStepIndex]?.label || 'Procesando...'}</p>
                <p className="mt-3 text-center text-xs leading-5 text-[#8FA9A4]">Si llega a 94%, no está trabado: la IA sigue terminando el CV final. No cierres esta pestaña.</p>
              </section>
            )}

            <div className="py-4 text-center">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-10 text-lg font-bold text-[var(--color-ink)] shadow-[var(--shadow-cta)] transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-deep)] hover:text-white disabled:opacity-50"
              >
                {loading ? <span>{analysisProgressSteps[analysisStepIndex]?.label || 'Analizando compatibilidad...'}</span> : <><SparklesIcon className="h-5 w-5" /> Analizar compatibilidad →</>}
              </button>
              <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-[var(--color-ink-soft)]">
                <span>✓ Gratis</span><span>✓ Sin tarjeta</span><span>✓ ~3 minutos</span>
              </div>
              <p className="mt-2 text-sm text-[var(--color-ink-soft)]">No inventamos experiencia. Tú editas todo antes de descargar.</p>
            </div>
          </form>        ) : (
          <div className="space-y-5">
            {clarificationModalOpen && (manualClarificationPrompts.length || result.clarificationQuestions?.length) ? (
              <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-4 backdrop-blur-sm md:items-center">
                <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary-deep)]">Filtro inteligente de evidencia</p>
                      <h2 className="mt-1 text-2xl font-bold text-slate-950">Aclaremos esto antes de ajustar tu CV</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">Responde rápido. La IA usará estas respuestas solo si son experiencia real; si no hay evidencia suficiente, no inventará.</p>
                    </div>
                    <button onClick={() => { setClarificationModalOpen(false); setManualClarificationPrompts([]) }} className="rounded-full border border-slate-200 px-3 py-1 text-sm font-bold text-slate-500 hover:bg-[var(--color-paper-2)]">Cerrar</button>
                  </div>
                  <div className="mt-5 space-y-4">
                    {(manualClarificationPrompts.length ? manualClarificationPrompts : normalizeClarificationPrompts(result.clarificationQuestions)).map((prompt, index) => {
                      const answer = clarificationAnswers[index] || { option: '', detail: '' }
                      const options = prompt.options?.length ? prompt.options : fallbackClarificationOptions
                      return (
                        <div key={prompt.question} className="rounded-2xl border border-slate-200 bg-[var(--color-paper-2)] p-4">
                          <p className="font-bold text-slate-950">{index + 1}. {prompt.question}</p>
                          <div className="mt-3 grid gap-2">
                            {options.map((option, optionIndex) => (
                              <button
                                key={`${prompt.question}-${optionIndex}`}
                                type="button"
                                onClick={() => setClarificationAnswers((current) => ({ ...current, [index]: { ...answer, option } }))}
                                className={`rounded-2xl border px-3 py-3 text-left text-sm font-semibold leading-5 transition ${answer.option === option ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-ink)]' : 'border-slate-200 bg-white text-slate-700 hover:border-[var(--color-primary)]'}`}
                              >
                                <span className="mr-2 text-xs opacity-70">Opción {optionIndex + 1}</span>{option}
                              </button>
                            ))}
                          </div>
                          <label className="mt-4 block text-sm font-bold text-slate-950">
                            Ahora escribe el contexto real: qué hiciste, cuánto tiempo, herramienta, proyecto, resultado o ejemplo.
                          </label>
                          <textarea
                            value={answer.detail}
                            onChange={(e) => setClarificationAnswers((current) => ({ ...current, [index]: { ...answer, detail: e.target.value } }))}
                            rows={3}
                            placeholder={prompt.freeTextLabel || 'Ej: Sí usé esa herramienta en el proyecto X durante 6 meses; hice A, B y C. No tengo certificación, pero sí experiencia práctica...'}
                            className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-950 placeholder:text-slate-400 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                          />
                          {answer.option && !/^no\b|no directamente|no tengo/i.test(answer.option) && answer.detail.trim().length < 20 && (
                            <p className="mt-2 text-xs font-semibold text-amber-700">Escribe al menos una frase concreta para que la IA pueda ajustar sin inventar.</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {clarificationError && <p className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">{clarificationError}</p>}
                  <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <p className="text-xs leading-5 text-slate-500">No necesitas escribir perfecto. Responde como puedas; el sistema lo traduce a lenguaje profesional si es verdadero.</p>
                      {revisionLoading && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs font-bold text-[var(--color-primary-deep)]">
                            <span>{revisionProgressSteps[revisionStepIndex]?.label || 'Aplicando respuestas...'}</span>
                            <span>{revisionProgress}%</span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-orange-50">
                            <div className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-700" style={{ width: `${revisionProgress}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={submitClarificationAnswers}
                      disabled={revisionLoading}
                      className="rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-[var(--color-ink)] hover:bg-[var(--color-primary-deep)] disabled:opacity-50"
                    >
                      {revisionLoading ? 'Aplicando respuestas...' : 'Usar respuestas para ajustar mi CV'}
                    </button>
                  </div>
                </section>
              </div>
            ) : null}
            <ResultHero result={result} cv={editableCv || result.optimizedCV || result.rawText} />

            <section className="rounded-[18px] border border-[rgba(15,181,160,.35)] bg-[rgba(15,181,160,.07)] p-5 shadow-sm md:flex md:items-center md:justify-between md:gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-secondary-deep)]">Tu panel ya quedó listo</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-[var(--color-ink)]">Guarda este análisis en tu dashboard.</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--color-ink-soft)]">Ahí recuperas este CV, ves tus créditos y analizas otra vacante sin repetir todo desde cero.</p>
              </div>
              <a href={dashboardHref} className="mt-4 inline-flex items-center justify-center rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-bold text-[var(--color-ink)] shadow-[var(--shadow-cta)] transition hover:bg-[var(--color-primary-deep)] hover:text-white md:mt-0">
                Ir a mi dashboard <ArrowRightIcon className="ml-2 h-4 w-4" />
              </a>
            </section>

            <FindingsSection result={result} />

            {renderDecisionGate(result, () => setClarificationModalOpen(true))}

            <ChangeSection result={result} cv={editableCv || result.optimizedCV || result.rawText} />

            <section className="space-y-5 py-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-end">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-secondary-deep)]">Tu CV adaptado</p>
                <h2 className="font-display text-3xl font-semibold text-[var(--color-ink)]">Listo para enviar. Y para editar antes.</h2>
              </div>
              <div className="rounded-[18px] border border-[var(--color-line)] bg-white p-7 shadow-sm">
                <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="flex gap-4">
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-2)] before:absolute before:left-3 before:right-3 before:top-3 before:h-[3px] before:rounded before:bg-[var(--color-ink)] after:absolute after:bottom-3 after:left-3 after:right-5 after:top-6 after:bg-[repeating-linear-gradient(var(--color-line)_0_3px,transparent_3px_9px)]" />
                    <div>
                      <h3 className="font-display text-xl font-semibold text-[var(--color-ink)]">{getCvTitle(editableCv || result.optimizedCV || result.rawText)}</h3>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-ink-soft)]">Versión adaptada a esta vacante, en {outputLanguage === 'spanish' ? 'español' : 'inglés'}. Tú tienes la última palabra.</p>
                      <button type="button" onClick={openEditor} className="mt-2 inline-block text-sm font-bold text-[var(--color-primary-deep)] underline">✎ Editar antes de descargar</button>
                    </div>
                  </div>
                  <div className="grid min-w-[180px] gap-3">
                    <button type="button" onClick={() => setCvPreviewOpen(true)} className="rounded-xl border border-[var(--color-secondary)] bg-[rgba(15,181,160,.08)] px-5 py-3 text-sm font-bold text-[var(--color-secondary-deep)] transition hover:bg-[rgba(15,181,160,.16)]">👁 Ver CV completo</button>
                    <button onClick={() => downloadFile('pdf')} disabled={!!downloadLoading || !(editableCv || result.optimizedCV)} className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-[var(--color-ink)] transition hover:bg-[var(--color-primary-deep)] hover:text-white disabled:opacity-50">{downloadLoading === 'pdf' ? 'Generando PDF...' : 'Descargar PDF'}</button>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => downloadFile('docx')} disabled={!!downloadLoading || !(editableCv || result.optimizedCV)} className="rounded-xl border border-[var(--color-ink)] px-4 py-3 text-sm font-bold disabled:opacity-50">DOCX</button>
                      <button onClick={() => downloadFile('txt')} disabled={!!downloadLoading || !(editableCv || result.optimizedCV)} className="rounded-xl border border-[var(--color-ink)] px-4 py-3 text-sm font-bold disabled:opacity-50">TXT</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {cvPreviewOpen && (
              <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(15,20,15,.62)] px-4 py-8 backdrop-blur-sm" onClick={() => setCvPreviewOpen(false)}>
                <div className="my-auto w-full max-w-3xl overflow-hidden rounded-[18px] bg-white shadow-[0_40px_90px_-30px_rgba(0,0,0,.55)]" onClick={(e) => e.stopPropagation()}>
                  <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-[var(--color-line)] bg-white px-5 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-[var(--color-ink)]">Tu CV adaptado</h3>
                      <p className="text-xs font-semibold text-[var(--color-secondary-deep)]">Vista previa completa antes de descargar</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={openEditor} className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-bold text-[var(--color-ink)]">✎ Editar</button>
                      <button type="button" onClick={() => downloadFile('pdf')} disabled={!!downloadLoading || !(editableCv || result.optimizedCV)} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-[var(--color-ink)] disabled:opacity-50">PDF</button>
                      <button type="button" onClick={() => setCvPreviewOpen(false)} className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-bold text-[var(--color-ink-soft)]">Cerrar</button>
                    </div>
                  </div>
                  <div className="max-h-[76vh] overflow-y-auto px-5 py-6 md:px-10">
                    {renderOptimizedCV(editableCv || result.optimizedCV || result.rawText)}
                  </div>
                  <div className="border-t border-[var(--color-line)] bg-[var(--color-paper-2)] px-5 py-3 text-center text-xs text-[var(--color-ink-soft)]">Esta es una vista previa. Puedes editar antes de descargar. Nada de lo que ves fue inventado.</div>
                </div>
              </div>
            )}

            {editorOpen && (
              <section id="cv-editor" className="rounded-2xl border border-[var(--color-line)] bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-secondary-deep)]">Editor</p>
                    <h3 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Edita tu CV antes de descargar</h3>
                    <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Cambia campos, bullets o skills y luego descarga PDF, DOCX o TXT.</p>
                  </div>
                  <button type="button" onClick={() => setEditorOpen(false)} className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-bold text-[var(--color-ink-soft)]">Ocultar editor</button>
                </div>
                <EditableCvForm
                  cv={editableCv}
                  onChange={setEditableCv}
                  score={normalizeScore(result.revisedCompatibilityScore ?? result.compatibilityScore)}
                  gaps={result.gaps}
                  keywords={result.keywordsToInclude}
                  honestyWarnings={result.honestyWarnings}
                />
              </section>
            )}

            <section className="rounded-[32px] bg-[#F4EFE7] p-7 text-center shadow-sm md:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-secondary-deep)]">Para tu próxima vacante</p>
              <h2 className="mt-4 font-display text-3xl font-semibold text-[var(--color-ink)] md:text-4xl">Cada vacante merece su propio CV.</h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[var(--color-ink-soft)]">Este análisis fue gratis. Si tienes más ofertas en la mira, compra créditos una sola vez. Sin suscripción, sin vencimiento.</p>
              <div className="mx-auto mt-8 grid max-w-4xl gap-5 md:grid-cols-3">
                {[
                  { key: 'basic', name: 'Básico', price: '$5', desc: '5 análisis · $1 c/u' },
                  { key: 'pro', name: 'Pro', price: '$12', desc: '15 análisis · $0.80 c/u', featured: true },
                  { key: 'premium', name: 'Premium', price: '$19', desc: '30 análisis · $0.63 c/u' },
                ].map((plan) => (
                  <div key={plan.key} className={`relative rounded-2xl border bg-white p-6 ${plan.featured ? 'border-[var(--color-primary)] shadow-[var(--shadow-soft)]' : 'border-[var(--color-line)]'}`}>
                    {plan.featured && <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-primary)] px-4 py-1 text-xs font-bold text-[var(--color-ink)]">MÁS ELEGIDO</span>}
                    <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
                    <p className="mt-4 font-display text-4xl font-bold">{plan.price}<span className="ml-1 text-sm font-semibold">USD</span></p>
                    <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{plan.desc}</p>
                    <a href={`/dashboard?intent=checkout&pack=${plan.key}&email=${encodeURIComponent(email.trim().toLowerCase())}`} className={`mt-6 block rounded-xl border-2 px-4 py-3 text-sm font-bold ${plan.featured ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-ink)]' : 'border-[var(--color-ink)] text-[var(--color-ink)] hover:bg-[var(--color-paper-2)]'}`}>Comprar</a>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs text-[var(--color-ink-soft)]">Tu primer análisis ya es tuyo. Pagas solo si quieres seguir.</p>
            </section>

            <p className="mx-auto max-w-2xl text-center text-sm leading-6 text-[var(--color-ink-soft)]">No inventamos empleadores, cargos, títulos ni métricas. Solo reescribimos lo que ya es tuyo. <strong className="text-[var(--color-ink)]">La credibilidad en la entrevista la pones tú; nosotros la protegemos.</strong></p>

            <div className="flex flex-col md:flex-row gap-4">
              <button
                onClick={() => { setResult(null); setEditableCv(null); setFile(null); setJobFile(null); setJobDescription(''); window.localStorage.removeItem('revisamicv_job_description'); setCopySuccess(''); setRevisionInstruction(''); setRevisionNotes([]); setRevisionAddedSkills([]); setRevisionChanges([]); setBlockedChanges([]); setManualClarificationPrompts([]); setClarificationModalOpen(false); setClarificationAnswers({}); setCvPreviewOpen(false); setEditorOpen(false) }}
                className="flex-1 py-3 rounded-full font-semibold border-2 border-slate-200 hover:bg-[var(--color-paper-2)] transition"
              >
                Analizar otra vacante
              </button>
              <a
                href={dashboardHref}
                className="flex-1 flex items-center justify-center gap-2 bg-[var(--color-primary)] text-[var(--color-ink)] py-3 rounded-full font-semibold hover:bg-[var(--color-primary-deep)] transition"
              >
                Ir a mi dashboard <ArrowRightIcon className="w-4 h-4" />
              </a>
              <a
                href={`/dashboard?intent=checkout&pack=pro&email=${encodeURIComponent(normalizedEmailForLinks)}${result?.auth_token ? `&auth=${encodeURIComponent(result.auth_token)}` : ''}`}
                className="flex-1 flex items-center justify-center gap-2 border-2 border-[var(--color-primary)] text-[var(--color-primary-deep)] py-3 rounded-full font-semibold hover:bg-orange-50 transition"
              >
                Comprar más créditos
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
