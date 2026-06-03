'use client'

import { useEffect, useState, useRef } from 'react'
import { UploadIcon, SparklesIcon, ArrowRightIcon } from '@/components/icons'
import EditableCvForm from '@/components/EditableCvForm'
import { getFriendlyApiError, validateCvFile, validateEmail, validateJobDescription } from '@/lib/input-validation'
import { getFileExtensionForAnalytics, getFileSizeBucket, trackEvent } from '@/lib/analytics'
import { optimizedCvToPlainText } from '@/lib/cv-formatters'

type ClarificationPrompt = {
  question: string
  options?: string[]
  freeTextLabel?: string
}

type ProcessResult = {
  compatibilityScore?: number
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
    tone: 'border-purple-200 bg-purple-50 text-purple-950',
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
  { pct: 94, label: 'Preparando diagnóstico, editor y descargas...' },
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
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      bar: 'bg-purple-500',
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
    <section className="rounded-2xl border border-purple-100 bg-purple-50/70 p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wide text-purple-700">Diagnóstico por categorías</p>
        <h3 className="text-xl font-bold text-slate-950">Dónde encaja tu CV y dónde hay brechas</h3>
        <p className="text-sm text-slate-600 mt-1">Esto explica el score como lo haría un ATS/reclutador: requisitos, keywords, experiencia, formato y riesgos.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {entries.map((item) => {
          const tone = getScoreTone(item.score)
          const width = typeof item.score === 'number' ? `${item.score}%` : '0%'

          return (
            <div key={item.key} className="rounded-xl bg-white border border-purple-100 p-4 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
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
          <div key={action} className="flex gap-3 rounded-xl bg-slate-50 border border-slate-100 p-3 text-sm text-slate-700">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">{index + 1}</span>
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
              className="mt-4 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700"
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
      <div className="bg-gradient-to-br from-violet-700 via-purple-700 to-slate-950 p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-100">Qué cambió y por qué</p>
        <div className="mt-3 grid gap-5 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">No solo reescribimos tu CV: lo orientamos a esta vacante.</h3>
            <p className="mt-2 text-sm leading-6 text-violet-100/90">
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
          <div key={change.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">{index + 1}</span>
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

function renderOptimizedCV(cv: any) {
  if (!cv) return null
  if (typeof cv === 'string') {
    return <pre className="whitespace-pre-wrap text-sm text-slate-800 font-sans">{cv}</pre>
  }

  const contact = typeof cv.contact === 'object' && cv.contact
    ? [cv.contact.email, cv.contact.phone, cv.contact.location, cv.contact.linkedin, cv.contact.portfolio].filter(Boolean).join(' | ')
    : cv.contact

  return (
    <section className="rounded-2xl border border-purple-200 bg-white p-6">
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
  const [jobDescription, setJobDescription] = useState('')
  const [outputLanguage, setOutputLanguage] = useState<'english' | 'spanish'>('english')
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
  const [revisionNotes, setRevisionNotes] = useState<string[]>([])
  const [blockedChanges, setBlockedChanges] = useState<string[]>([])
  const [clarificationModalOpen, setClarificationModalOpen] = useState(false)
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<number, { option: string; detail: string }>>({})
  const [copySuccess, setCopySuccess] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

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
    setEmail(value)
    if (value.trim()) window.localStorage.setItem('revisamicv_email', value.trim().toLowerCase())
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

    const jobError = validateJobDescription(jobDescription)
    if (jobError) {
      trackEvent('analysis_validation_error', { field: 'job_description', chars: jobDescription.trim().length })
      return setError(jobError)
    }

    trackEvent('analysis_started', {
      language: outputLanguage,
      extension: getFileExtensionForAnalytics(selectedFile.name),
      size: getFileSizeBucket(selectedFile.size),
      job_chars_bucket: jobDescription.length < 1000 ? '<1k' : jobDescription.length < 4000 ? '1-4k' : '4k+',
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
      formData.append('outputLanguage', outputLanguage)

      const res = await fetch('/api/process-cv', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(getFriendlyApiError(data.message || data.error, 'No pude procesar el CV. Intenta de nuevo.'))
      setAnalysisProgress(100)
      window.localStorage.setItem('revisamicv_email', email.trim().toLowerCase())
      window.localStorage.setItem('revisamicv_output_language', outputLanguage)
      trackEvent('analysis_completed', {
        language: outputLanguage,
        score: typeof data.compatibilityScore === 'number' ? Math.round(data.compatibilityScore) : -1,
        decision: data.applicationDecision || 'unknown',
        tokens_remaining: typeof data.tokens_remaining === 'number' ? data.tokens_remaining : -1,
      })
      setResult(data)
      setEditableCv(data.optimizedCV || null)
      setRevisionInstruction('')
      setRevisionNotes([])
      setBlockedChanges([])
      setRevisionAddedSkills([])
      setClarificationAnswers({})
      setClarificationModalOpen(Array.isArray(data.clarificationQuestions) && data.clarificationQuestions.length > 0)
    } catch (err: any) {
      trackEvent('analysis_failed', { message: String(err.message || '').slice(0, 80) })
      setError(err.message)
    } finally {
      setLoading(false)
    }
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
    const questions = normalizeClarificationPrompts(result?.clarificationQuestions)
    if (!questions.length) return setClarificationModalOpen(false)
    await applyRevisionInstruction(buildClarificationInstruction(questions, clarificationAnswers))
  }

  const applyRevisionInstruction = async (instructionOverride?: string) => {
    const cvToRevise = editableCv || result?.optimizedCV
    const instruction = (instructionOverride || revisionInstruction).trim()
    if (!cvToRevise) return setError('Primero genera un CV adaptado')
    if (!instruction) return setError('Escribe qué cambio quieres aplicar')

    trackEvent('revision_started', { source: instructionOverride ? 'clarification' : 'manual' })
    setRevisionLoading(true)
    setRevisionProgress(12)
    setRevisionStepIndex(0)
    setError('')
    setCopySuccess('')
    setRevisionNotes([])
    setBlockedChanges([])
    setRevisionAddedSkills([])

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
        }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(getFriendlyApiError(data.message || data.error, 'No pude aplicar el ajuste. Intenta de nuevo.'))
      setRevisionProgress(100)
      setEditableCv(data.optimizedCV)
      setRevisionAddedSkills(getAddedSkills(beforeCv, data.optimizedCV))
      setRevisionNotes(Array.isArray(data.revisionNotes) ? data.revisionNotes : [])
      setBlockedChanges(Array.isArray(data.blockedChanges) ? data.blockedChanges : [])
      setRevisionInstruction('')
      setClarificationModalOpen(false)
      trackEvent('revision_completed', { added_skills: getAddedSkills(beforeCv, data.optimizedCV).length, blocked_changes: Array.isArray(data.blockedChanges) ? data.blockedChanges.length : 0 })
      setCopySuccess('Cambios aplicados. Abajo te muestro qué se agregó o qué se bloqueó por seguridad.')
    } catch (err: any) {
      trackEvent('revision_failed', { message: String(err.message || '').slice(0, 80) })
      setError(err.message)
    } finally {
      setRevisionLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-4xl mx-auto py-10">
        <nav className="mb-6 flex flex-wrap items-center justify-center gap-3 text-sm">
          <a href="/" className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">Inicio</a>
          <a href="/#pricing" className="rounded-full border border-purple-200 bg-white px-4 py-2 font-semibold text-purple-700 hover:bg-purple-50">Ver planes</a>
          <a href="/dashboard" className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">Dashboard</a>
        </nav>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {result ? '✅ Resultado de compatibilidad' : 'Adapta tu CV a una vacante real'}
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            {result
              ? 'Analizamos tu CV real contra la vacante y generamos una versión adaptada sin inventar experiencia.'
              : 'Sube tu CV, pega la vacante, elige idioma y recibe score + CV adaptado. Primer intento gratis.'}
          </p>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tu email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setAndRememberEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full border border-slate-300 rounded-xl bg-white p-3 text-sm text-slate-950 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 outline-none"
                required
              />
              <p className="text-xs text-slate-400 mt-1">Lo usamos para darte 1 prueba gratis y manejar tus tokens.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">¿En qué idioma quieres el CV final?</label>
              <div className="grid md:grid-cols-2 gap-3">
                {languageOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setOutputLanguage(option.value)
                      trackEvent('language_selected', { language: option.value })
                      window.localStorage.setItem('revisamicv_output_language', option.value)
                    }}
                    className={`rounded-2xl border-2 p-4 text-left transition ${
                      outputLanguage === option.value ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-purple-200'
                    }`}
                  >
                    <p className="font-bold text-slate-900">{option.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{option.helper}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tu CV actual</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 transition"
              >
                <UploadIcon className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                {file ? (
                  <p className="text-purple-600 font-semibold">{file.name}</p>
                ) : (
                  <>
                    <p className="text-slate-600 font-medium">Haz clic para subir</p>
                    <p className="text-sm text-slate-400 mt-1">PDF, Word (.docx) o TXT. Máximo 8 MB.</p>
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
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Vacante objetivo</label>
              <textarea
                value={jobDescription}
                onChange={(e) => {
                  const value = e.target.value
                  setJobDescription(value)
                  window.localStorage.setItem('revisamicv_job_description', value)
                }}
                rows={8}
                placeholder="Pega la descripción completa del trabajo al que quieres aplicar..."
                className="w-full border border-slate-300 rounded-xl bg-white p-4 text-sm text-slate-950 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                required
              />
              <p className="text-xs text-slate-400 mt-1">El score se calcula cruzando tu CV real contra esta vacante específica.</p>
            </div>

            {error && <p className="text-red-700 bg-red-50 border border-red-100 rounded-xl p-3 text-sm">{error}</p>}

            {loading && (
              <section className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-purple-950">Analizando tu CV</p>
                    <p className="mt-1 text-xs text-purple-700">{analysisProgressSteps[analysisStepIndex]?.label || 'Procesando...'}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-purple-700">{analysisProgress}%</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-purple-600 transition-all duration-700" style={{ width: `${analysisProgress}%` }} />
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  No cierres ni recargues esta página. Guardamos el email y la vacante, pero por seguridad del navegador tendrías que volver a subir el archivo si recargas.
                </p>
              </section>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-4 rounded-full font-semibold text-lg hover:bg-purple-700 transition disabled:opacity-50"
            >
              {loading ? <span>{analysisProgressSteps[analysisStepIndex]?.label || 'Analizando compatibilidad...'}</span> : <><SparklesIcon className="w-5 h-5" /> Analizar y adaptar mi CV</>}
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            {clarificationModalOpen && result.clarificationQuestions?.length ? (
              <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-4 backdrop-blur-sm md:items-center">
                <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-purple-700">Filtro inteligente de evidencia</p>
                      <h2 className="mt-1 text-2xl font-bold text-slate-950">Aclaremos esto antes de ajustar tu CV</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">Responde rápido. La IA usará estas respuestas solo si son experiencia real; si no hay evidencia suficiente, no inventará.</p>
                    </div>
                    <button onClick={() => setClarificationModalOpen(false)} className="rounded-full border border-slate-200 px-3 py-1 text-sm font-bold text-slate-500 hover:bg-slate-50">Cerrar</button>
                  </div>
                  <div className="mt-5 space-y-4">
                    {normalizeClarificationPrompts(result.clarificationQuestions).map((prompt, index) => {
                      const answer = clarificationAnswers[index] || { option: '', detail: '' }
                      const options = prompt.options?.length ? prompt.options : fallbackClarificationOptions
                      return (
                        <div key={prompt.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="font-bold text-slate-950">{index + 1}. {prompt.question}</p>
                          <div className="mt-3 grid gap-2">
                            {options.map((option, optionIndex) => (
                              <button
                                key={`${prompt.question}-${optionIndex}`}
                                type="button"
                                onClick={() => setClarificationAnswers((current) => ({ ...current, [index]: { ...answer, option } }))}
                                className={`rounded-2xl border px-3 py-3 text-left text-sm font-semibold leading-5 transition ${answer.option === option ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-purple-300'}`}
                              >
                                <span className="mr-2 text-xs opacity-70">Opción {optionIndex + 1}</span>{option}
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={answer.detail}
                            onChange={(e) => setClarificationAnswers((current) => ({ ...current, [index]: { ...answer, detail: e.target.value } }))}
                            rows={3}
                            placeholder={prompt.freeTextLabel || 'Opción libre: escribe tu caso con tus palabras...'}
                            className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-950 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 outline-none"
                          />
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <p className="text-xs leading-5 text-slate-500">No necesitas escribir perfecto. Responde como puedas; el sistema lo traduce a lenguaje profesional si es verdadero.</p>
                      {revisionLoading && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs font-bold text-purple-700">
                            <span>{revisionProgressSteps[revisionStepIndex]?.label || 'Aplicando respuestas...'}</span>
                            <span>{revisionProgress}%</span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-purple-50">
                            <div className="h-full rounded-full bg-purple-600 transition-all duration-700" style={{ width: `${revisionProgress}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={submitClarificationAnswers}
                      disabled={revisionLoading}
                      className="rounded-full bg-purple-600 px-5 py-3 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      {revisionLoading ? 'Aplicando respuestas...' : 'Usar respuestas para ajustar mi CV'}
                    </button>
                  </div>
                </section>
              </div>
            ) : null}
            <section className="rounded-3xl bg-slate-900 text-white p-6 shadow-xl shadow-slate-200">
              {(() => {
                const score = normalizeScore(result.compatibilityScore)
                const tone = getScoreTone(score)

                return (
                  <>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <p className="text-slate-300 text-sm mb-2">Compatibilidad estimada</p>
                        <div className="flex items-end gap-3">
                          <span className="text-6xl font-bold text-purple-300">{score ?? '—'}</span>
                          {score !== undefined && <span className="text-2xl mb-2">/100</span>}
                        </div>
                      </div>
                      <div className={`rounded-2xl px-4 py-3 ${tone.bg} ${tone.text} md:max-w-xs`}>
                        <p className="text-sm font-bold">{tone.label}</p>
                        <p className="text-xs mt-1 leading-relaxed">{tone.action}</p>
                      </div>
                    </div>
                    {score !== undefined && (
                      <div className="mt-5 h-3 rounded-full bg-slate-700 overflow-hidden">
                        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${score}%` }} />
                      </div>
                    )}
                    {result.fitVerdict && <p className="mt-4 text-lg">{result.fitVerdict}</p>}
                    {result.positioningAngle && <p className="mt-2 text-sm text-slate-300">{result.positioningAngle}</p>}
                  </>
                )
              })()}
            </section>

            {renderMatchBreakdown(result.matchBreakdown)}

            {renderDecisionGate(result, () => setClarificationModalOpen(true))}

            {renderActionPlan(result)}

            {renderOptimizationSummary(result, editableCv || result.optimizedCV || result.rawText)}

            <div className="grid md:grid-cols-2 gap-5">
              {renderList('Fortalezas para esta vacante', result.strengths)}
              {renderList('Fechas, brechas o datos para revisar', result.gaps)}
              {renderList('Keywords que debe incluir', result.keywordsToInclude)}
              {renderList('Recomendaciones de honestidad antes de enviar', result.honestyWarnings)}
            </div>

            <EditableCvForm
              cv={editableCv}
              onChange={setEditableCv}
              score={normalizeScore(result.compatibilityScore)}
              gaps={result.gaps}
              keywords={result.keywordsToInclude}
              honestyWarnings={result.honestyWarnings}
            />

            <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Ajuste con IA</p>
                <h3 className="text-xl font-bold text-slate-950">Pídele un cambio específico antes de descargar</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Úsalo para cambios puntuales: actualizar ciudad/email, ajustar formato de fechas, quitar algo, reescribir el perfil o desglosar responsabilidades reales en skills más claras. La idea es hacerlo robusto sin inventar experiencia.
                </p>
              </div>
              <textarea
                value={revisionInstruction}
                onChange={(e) => setRevisionInstruction(e.target.value)}
                rows={4}
                maxLength={1200}
                placeholder="Ej: cambia mi ciudad a Bogotá, normaliza mis fechas, marca si alguna fecha no coincide, reescribe el perfil más orientado a ventas SaaS, desglosa mi trabajo de administrador de plataformas en skills reales..."
                className="w-full rounded-xl border border-amber-200 bg-white p-3 text-sm text-slate-950 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 outline-none"
              />
              {revisionLoading && (
                <div className="rounded-2xl border border-amber-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">Aplicando cambios con IA</p>
                      <p className="mt-1 text-xs text-slate-500">{revisionProgressSteps[revisionStepIndex]?.label || 'Procesando ajuste...'}</p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700">{revisionProgress}%</span>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-amber-50">
                    <div className="h-full rounded-full bg-amber-500 transition-all duration-700" style={{ width: `${revisionProgress}%` }} />
                  </div>
                </div>
              )}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <p className="text-xs text-slate-500">{revisionInstruction.length}/1200 caracteres</p>
                <button
                  onClick={() => applyRevisionInstruction()}
                  disabled={revisionLoading || !revisionInstruction.trim()}
                  className="w-full md:w-auto px-5 py-3 rounded-full font-semibold bg-amber-500 text-white hover:bg-amber-600 transition disabled:opacity-50"
                >
                  {revisionLoading ? 'Aplicando ajuste...' : 'Aplicar cambio con IA'}
                </button>
              </div>
              {revisionAddedSkills.length > 0 && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-900">
                  <p className="font-bold mb-2">Skills agregadas o reforzadas por la IA:</p>
                  <div className="flex flex-wrap gap-2">
                    {revisionAddedSkills.map((skill) => <span key={skill} className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-emerald-700">{skill}</span>)}
                  </div>
                </div>
              )}
              {revisionNotes.length > 0 && (
                <div className="rounded-xl bg-white border border-amber-100 p-3 text-sm text-slate-700">
                  <p className="font-bold text-slate-900 mb-1">Notas del ajuste:</p>
                  <ul className="list-disc pl-5 space-y-1">{revisionNotes.map((note, index) => <li key={index}>{note}</li>)}</ul>
                </div>
              )}
              {blockedChanges.length > 0 && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-800">
                  <p className="font-bold mb-1">Cambios no aplicados por seguridad:</p>
                  <ul className="list-disc pl-5 space-y-1">{blockedChanges.map((change, index) => <li key={index}>{change}</li>)}</ul>
                </div>
              )}
            </section>

            {renderOptimizedCV(editableCv || result.optimizedCV || result.rawText)}

            {result.coverLetter && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Mensaje para aplicar</p>
                    <h3 className="font-bold text-slate-900">Mini cover letter</h3>
                    <p className="mt-1 text-sm text-slate-500">Esta parte no se descarga con el CV. Cópiala y pégala en el email, LinkedIn o el portal donde vas a aplicar.</p>
                  </div>
                  <button
                    onClick={copyCoverLetter}
                    className="rounded-full border-2 border-purple-200 px-4 py-2 text-sm font-bold text-purple-700 hover:bg-purple-50"
                  >
                    Copiar cover letter
                  </button>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{result.coverLetter}</p>
              </section>
            )}

            {copySuccess && <p className="text-green-700 bg-green-50 border border-green-100 rounded-xl p-3 text-sm">{copySuccess}</p>}
            {error && <p className="text-red-700 bg-red-50 border border-red-100 rounded-xl p-3 text-sm">{error}</p>}

            <div className="grid md:grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <button
                onClick={() => downloadFile('pdf')}
                disabled={!!downloadLoading || !(editableCv || result.optimizedCV)}
                className="py-3 rounded-full font-semibold bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-50"
              >
                {downloadLoading === 'pdf' ? 'Generando PDF...' : 'Descargar PDF'}
              </button>
              <button
                onClick={() => downloadFile('docx')}
                disabled={!!downloadLoading || !(editableCv || result.optimizedCV)}
                className="py-3 rounded-full font-semibold bg-purple-600 text-white hover:bg-purple-700 transition disabled:opacity-50"
              >
                {downloadLoading === 'docx' ? 'Generando Word...' : 'Descargar Word DOCX'}
              </button>
              <button
                onClick={() => downloadFile('txt')}
                disabled={!!downloadLoading || !(editableCv || result.optimizedCV)}
                className="py-3 rounded-full font-semibold border-2 border-slate-200 hover:bg-slate-50 transition disabled:opacity-50"
              >
                {downloadLoading === 'txt' ? 'Generando TXT...' : 'Descargar TXT ATS'}
              </button>
              <button
                onClick={copyCvText}
                className="md:col-span-3 py-3 rounded-full font-semibold border-2 border-purple-200 text-purple-700 hover:bg-purple-50 transition"
              >
                Copiar CV al portapapeles
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <button
                onClick={() => { setResult(null); setEditableCv(null); setFile(null); setJobDescription(''); window.localStorage.removeItem('revisamicv_job_description'); setCopySuccess(''); setRevisionInstruction(''); setRevisionNotes([]); setRevisionAddedSkills([]); setBlockedChanges([]); setClarificationModalOpen(false); setClarificationAnswers({}) }}
                className="flex-1 py-3 rounded-full font-semibold border-2 border-slate-200 hover:bg-slate-50 transition"
              >
                Analizar otra vacante
              </button>
              <a
                href={`/dashboard?email=${encodeURIComponent(email.trim().toLowerCase())}`}
                className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-full font-semibold hover:bg-purple-700 transition"
              >
                Ver mi dashboard <ArrowRightIcon className="w-4 h-4" />
              </a>
              <a
                href="/#pricing"
                className="flex-1 flex items-center justify-center gap-2 border-2 border-purple-200 text-purple-700 py-3 rounded-full font-semibold hover:bg-purple-50 transition"
              >
                Comprar más tokens
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
