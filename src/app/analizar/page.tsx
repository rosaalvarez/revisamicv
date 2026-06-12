/* eslint-disable */
'use client'

import { useEffect, useState, useRef } from 'react'
import type { ReactNode } from 'react'
import { UploadIcon, SparklesIcon, ShieldCheckIcon, CheckIcon, ArrowRightIcon, AlertCircleIcon, TrendingUpIcon, UserIcon } from '@/components/icons'
import EditableCvForm from '@/components/EditableCvForm'
import { getFriendlyApiError, validateCvFile, validateEmail, validateJobDescription, MIN_JOB_DESCRIPTION_CHARS } from '@/lib/input-validation'
import { getFileExtensionForAnalytics, getFileSizeBucket, trackEvent } from '@/lib/analytics'
import { optimizedCvToPlainText, getCvLabels } from '@/lib/cv-formatters'
import { buildRiskyRevisionPrompt, buildLowScoreCoachingPrompt, coachBlockedChange, summarizeCvChanges } from '@/lib/result-ux'
import { buildGapRecoveryQuestions, buildKeyRequirementRows, buildScoreBreakdownRows, getQuestionProjectedLift, normalizeUserDeclarations, sanitizeDocumentFraming } from '@/lib/result-phase2'
import { createAnalysisDraftKey, getEvidenceStepState, getInitialResultStep, getResultWizardSteps, shouldShowEvidenceQuestions } from '@/lib/analysis-flow'
import { getSmartPackDefault, incrementStoredAnalysisCount, shouldShowLastCreditNotice } from '@/lib/conversion-triggers'

type ClarificationPrompt = {
  question: string
  options?: string[]
  freeTextLabel?: string
  requirement_id?: string
  requirement_text?: string
  current_status?: string
  projected_lift?: number
}

type ProcessResult = {
  compatibilityScore?: number
  original_score?: number
  adapted_score?: number
  score_breakdown?: Record<string, number | null>
  revisedCompatibilityScore?: number
  revisionScoreExplanation?: string
  matchBreakdown?: Record<string, { score?: number; summary?: string } | number | string>
  requirements_table?: any[]
  original_match_results?: any[]
  adapted_match_results?: any[]
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
  coverLetterShort?: string
  coverLetterFormal?: string
  rawText?: string
  tokens_remaining?: number
  saved_cv_text?: string
  auth_token?: string
  dashboard_url?: string
  vacancy_title?: string
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
    label: 'Evidencia insuficiente con lo visible',
    title: 'La vacante pide evidencia que tu CV todavía no muestra',
    tone: 'border-orange-200 bg-orange-50 text-orange-950',
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
  { pct: 94, label: 'Generando el CV final. Si faltan datos, te haré preguntas concretas.' },
]

const fallbackClarificationOptions = ['Sí, la tengo', 'Tengo algo básico', 'No']
const evidenceSourceOptions = ['Proyectos personales', 'Freelance', 'Empleo anterior', 'Estudios o cursos', 'Voluntariado']

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
          requirement_id: item.requirement_id,
          requirement_text: item.requirement_text,
          current_status: item.current_status,
        } : null
      }
      return null
    })
    .filter(Boolean)
    .slice(0, 4) as ClarificationPrompt[]
}

function buildClarificationInstruction(prompts: ClarificationPrompt[], answers: Record<number, { option: string; detail: string; source?: string }>) {
  const lines = prompts.map((prompt, index) => {
    const answer = answers[index]
    return `${index + 1}. Pregunta: ${prompt.question}\nOpción seleccionada: ${answer?.option || 'Sin seleccionar'}\nFuente de evidencia: ${answer?.source || 'Sin fuente'}\nDetalle del usuario: ${answer?.detail || 'Sin detalle adicional'}`
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
      bg: 'bg-green-100',
      text: 'text-green-800',
      bar: 'bg-green-500',
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
    action: 'La vacante pide evidencia que todavía no está visible. Responde solo con experiencia real o deja esas brechas sin agregar.',
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    bar: 'bg-orange-500',
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
          const numericScore = typeof item.score === 'number' ? item.score : undefined
          const barWidth = numericScore !== undefined ? (numericScore === 0 ? '3%' : `${numericScore}%`) : '0%'

          return (
            <div key={item.key} className="rounded-xl bg-white border border-[var(--color-line)] p-4 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-900 text-sm">{item.label}</p>
                {item.score !== undefined && <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tone.bg} ${tone.text}`}>{item.score}/100</span>}
              </div>
              {item.score !== undefined && (
                <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${tone.bar}`} style={{ width: barWidth }} />
                </div>
              )}
              {numericScore !== undefined && numericScore === 0 && <p className="text-xs text-orange-600 mt-1.5 font-medium">Sin evidencia aún</p>}
              {item.summary && <p className="text-xs text-slate-600 mt-2 leading-relaxed">{item.summary}</p>}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function getResultVacancyTitle(result?: ProcessResult | null, fallback = '') {
  const explicit = String(result?.vacancy_title || result?.optimizedCV?.targetTitle || result?.optimizedCV?.headline || fallback || '').trim()
  return explicit || 'esta vacante'
}

function getScoreLift(result?: ProcessResult | null) {
  const before = normalizeScore(result?.original_score ?? result?.compatibilityScore)
  const after = normalizeScore(result?.revisedCompatibilityScore ?? result?.adapted_score ?? result?.compatibilityScore)
  if (before === undefined || after === undefined) return undefined
  return Math.max(0, after - before)
}

function getProjectedEvidenceLift(result?: ProcessResult | null) {
  const base = normalizeScore(result?.adapted_score ?? result?.compatibilityScore ?? result?.original_score)
  if (base === undefined) return undefined
  const gapCount = buildGapRecoveryQuestions(result?.requirements_table, result?.adapted_match_results || result?.original_match_results).length
  if (!gapCount) return undefined
  return Math.min(100, base + Math.min(12, gapCount * 4))
}

function HighlightedText({ text, keywords = [] }: { text?: string; keywords?: string[] }) {
  const clean = String(text || '')
  const relevant = uniqueCleanList(keywords).filter((keyword) => keyword.length >= 3).slice(0, 8)
  if (!clean || !relevant.length) return <>{clean}</>
  const escaped = relevant.map((keyword) => keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi')
  return <>{clean.split(pattern).map((part, index) => relevant.some((keyword) => keyword.toLowerCase() === part.toLowerCase()) ? <mark key={`${part}-${index}`}>{part}</mark> : part)}</>
}

function renderScoreBreakdown(scoreBreakdown?: ProcessResult['score_breakdown']) {
  const rows = buildScoreBreakdownRows(scoreBreakdown)
  if (!rows.length) return null

  return (
    <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-2)] p-5 shadow-sm text-left">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary-deep)]">Desglose del score</p>
        <h3 className="text-xl font-bold text-slate-950">Sub-scores del documento</h3>
        <p className="text-sm text-slate-600 mt-1">Mide qué tan bien el CV demuestra cada grupo de requisitos. Si una categoría no aplica, no la mostramos.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((item: any) => {
          const tone = getScoreTone(item.score)
          return (
            <div key={item.key} className="rounded-xl bg-white border border-[var(--color-line)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-900 text-sm">{item.label}</p>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tone.bg} ${tone.text}`}>{item.score}/100</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${item.score}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function capitalizeRequirementTitle(value: string) {
  const clean = String(value || '').trim()
  return clean ? `${clean.charAt(0).toUpperCase()}${clean.slice(1)}` : clean
}

function renderKeyRequirements(result: ProcessResult) {
  const rows = buildKeyRequirementRows(result.requirements_table, result.adapted_match_results || result.original_match_results, 6)
  if (!rows.length) return null

  const badgeClass: Record<string, string> = {
    match: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    partial: 'bg-amber-50 text-amber-800 border-amber-200',
    gap: 'bg-slate-50 text-slate-700 border-slate-200',
  }
  const statusLabel: Record<string, string> = { match: 'Visible', partial: 'Parcial', gap: 'No visible' }
  const typeBadgeClass: Record<string, string> = {
    must_have: 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]',
    nice_to_have: 'bg-white text-[var(--color-secondary-deep)] border-[var(--color-secondary)]',
  }
  const typeLabel: Record<string, string> = { must_have: 'Obligatorio', nice_to_have: 'Deseable' }

  return (
    <section className="rounded-2xl border border-[var(--color-line)] bg-white p-5 shadow-sm text-left">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-secondary-deep)]">Requisitos clave</p>
        <h3 className="text-xl font-bold text-slate-950">Qué pide la vacante y qué muestra el CV</h3>
        <p className="text-sm text-slate-600 mt-1">Esto juzga el documento, no a ti. Si tu experiencia existe pero no aparece, la puedes agregar en el siguiente paso.</p>
      </div>
      <div className="space-y-3">
        {rows.map((row: any) => (
          <div key={row.id} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-2)] p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={`w-fit rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${typeBadgeClass[row.type] || typeBadgeClass.nice_to_have}`}>{typeLabel[row.type] || row.type_label || 'Deseable'}</span>
                </div>
                <p className="font-bold text-[var(--color-ink)]">{capitalizeRequirementTitle(row.requirement)}</p>
                <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{sanitizeDocumentFraming(row.copy)}</p>
              </div>
              <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-bold ${badgeClass[row.status] || badgeClass.gap}`}>{statusLabel[row.status] || row.status}</span>
            </div>
            {row.quote ? <blockquote className="mt-3 rounded-lg border-l-4 border-[var(--color-primary)] bg-white px-3 py-2 text-sm leading-6 text-slate-700">{row.quote}</blockquote> : null}
            {row.evidence_source === 'user_declared' ? <p className="mt-2 text-xs font-semibold text-[var(--color-secondary-deep)]">Evidencia agregada por ti en “Tu experiencia”.</p> : null}
            {row.note && !row.quote ? <p className="mt-2 text-xs text-slate-500">{sanitizeDocumentFraming(row.note)}</p> : null}
          </div>
        ))}
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
      <p className="text-xs font-bold uppercase tracking-wide opacity-70">Antes de descargar</p>
      <h3 className="mt-1 text-xl font-bold">Necesito confirmar datos para completar el CV.</h3>
      <p className="mt-2 text-sm leading-6 opacity-90">El score muestra qué tanto encaja tu CV con esta vacante. Si falta evidencia, no voy a inventarla: puedes responder preguntas rápidas para mejorar el CV con información real.</p>
      {result.decisionReason && <p className="mt-3 rounded-xl bg-white/70 p-3 text-sm leading-6 opacity-90">{result.decisionReason}</p>}
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
          <p className="mt-3 text-xs opacity-75">Si estas respuestas no existen en tu experiencia real, déjalas sin agregar. El CV debe quedar defendible en entrevista.</p>
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
  const score = normalizeScore(result.adapted_score ?? result.compatibilityScore)
  const baseScore = normalizeScore(result.original_score)
  const scoreLift = score !== undefined && baseScore !== undefined ? score - baseScore : undefined
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
              <div className="flex items-center justify-between text-sm"><span>CV base medido</span><strong>{baseScore}/100</strong></div>
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


function hasDownloadableCv(cv: any) {
  if (typeof cv === 'string') return cv.trim().length >= 40
  if (!cv || typeof cv !== 'object') return false
  const featuredProjects = cv.featuredProjects || cv.projects
  return Boolean(
    cv.candidateName ||
    cv.name ||
    cv.targetTitle ||
    cv.headline ||
    (typeof cv.summary === 'string' && cv.summary.trim().length >= 40) ||
    (Array.isArray(cv.coreCompetencies) && cv.coreCompetencies.length) ||
    (Array.isArray(cv.skills) && cv.skills.length) ||
    (Array.isArray(cv.technicalSkills) && cv.technicalSkills.length) ||
    (Array.isArray(cv.experience) && cv.experience.some((role: any) => role?.title || role?.company || role?.bullets?.length)) ||
    (Array.isArray(featuredProjects) && featuredProjects.some((project: any) => project?.name || project?.description || project?.bullets?.length)) ||
    (Array.isArray(cv.education) && cv.education.length) ||
    (Array.isArray(cv.certifications) && cv.certifications.length) ||
    (Array.isArray(cv.tools) && cv.tools.length) ||
    (Array.isArray(cv.languages) && cv.languages.length)
  )
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

function getScoreVerdict(score?: number) {
  if (score === undefined) return 'Compatibilidad estimada para esta vacante'
  if (score >= 80) return 'Encaje fuerte para esta vacante'
  if (score >= 60) return 'Buen potencial, conviene afinar evidencia'
  if (score >= 40) return 'El documento tiene señales útiles, falta contexto'
  return 'Falta evidencia visible en el CV antes de aplicar'
}

function ResultHero({ result }: { result: ProcessResult; cv: any }) {
  const originalScore = normalizeScore(result.original_score)
  const adaptedScore = normalizeScore(result.adapted_score ?? result.compatibilityScore)
  const revisedScore = normalizeScore(result.revisedCompatibilityScore)
  const score = revisedScore ?? adaptedScore ?? originalScore
  const scoreValue = score ?? 0
  const strengths = (result.strengths?.length ? result.strengths : ['Tu experiencia tiene señales que se pueden presentar con más fuerza para esta vacante.']).slice(0, 3)
  const keywords = result.keywordsToInclude?.slice(0, 8) || []
  const circumference = 2 * Math.PI * 86
  const dashOffset = circumference - (scoreValue / 100) * circumference

  return (
    <section className="text-center">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--color-primary)]">Paso 3 de 4</p>
      <h1 className="mx-auto mt-2 max-w-[620px] text-balance font-display text-[clamp(1.5rem,4.4vw,2rem)] font-semibold leading-[1.16] text-[var(--color-ink)]">{(() => {
        if (score === undefined) return 'Diagnóstico claro de tu CV'
        if (scoreValue <= 30) return 'Esta vacante pide un perfil distinto al que tu CV muestra hoy. Veamos qué se puede hacer.'
        return `Tu CV quedó en ${score}% para esta vacante`
      })()}</h1>
      <div className="mt-8 flex flex-col items-center">
        <div className="relative h-[200px] w-[200px]">
          <svg width="200" height="200" className="-rotate-90">
            <circle cx="100" cy="100" r="86" fill="none" stroke="#DEE7F5" strokeWidth="16" />
            <circle cx="100" cy="100" r="86" fill="none" stroke="var(--color-primary)" strokeWidth="16" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-[3.4rem] font-bold leading-none text-[var(--color-primary-deep)]">{score ?? '—'}</span>
            <span className="mt-1 text-xs text-[var(--color-ink-soft)]">/100 · encaje</span>
          </div>
        </div>
        <p className="mt-4 font-display text-xl font-semibold text-[var(--color-ink)]"><span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle ${scoreValue <= 30 ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-seen)]'}`} />{getScoreVerdict(score)}</p>
        {revisedScore !== undefined && originalScore !== undefined && revisedScore !== originalScore ? <p className="mt-2 text-sm text-[var(--color-ink-soft)]">Tu versión original marcaba {originalScore}/100 para esta vacante.</p> : null}
      </div>

      <details className="mx-auto mt-3 max-w-xl border-0 bg-transparent text-center [&>summary::-webkit-details-marker]:hidden">
        <summary className="cursor-pointer list-none px-4 py-2 text-sm font-semibold text-[var(--color-secondary-deep)]">¿Qué significa este número? ▾</summary>
        <p className="px-4 pb-3 text-sm leading-6 text-[var(--color-ink-soft)]">No mide tu valor profesional. Mide qué tan bien tu CV actual demuestra lo que esta vacante pide. Si hay experiencia real que no aparece, puedes agregarla sin inventar.</p>
      </details>

      <div className="mt-5 space-y-3 text-left">
        <details className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-white [&>summary::-webkit-details-marker]:hidden">
          <summary style={{ listStyle: 'none' }} className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold text-[var(--color-ink)] [&::-webkit-details-marker]:hidden"><span>Lo que ya tienes fuerte</span><span className="text-[var(--color-primary)]">+</span></summary>
          <div className="border-t border-[var(--color-line)] px-5 py-4">
            <ul className="space-y-3 text-sm leading-6 text-[var(--color-ink-soft)]">
              {strengths.map((item, index) => <li key={index} className="flex gap-3"><span className="font-bold text-[var(--color-seen)]">✓</span><span>{item}</span></li>)}
            </ul>
          </div>
        </details>
        {keywords.length > 0 ? (
          <details className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-white [&>summary::-webkit-details-marker]:hidden">
            <summary style={{ listStyle: 'none' }} className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold text-[var(--color-ink)] [&::-webkit-details-marker]:hidden"><span>Keywords de la vacante que ya están en tu CV</span><span className="text-[var(--color-primary)]">+</span></summary>
            <div className="border-t border-[var(--color-line)] px-5 py-4">
              <div className="flex flex-wrap gap-2">{keywords.map((kw) => <span key={kw} className="rounded-full border border-[#CDE9E3] bg-[#E7F4F1] px-3 py-1.5 text-xs font-bold text-[var(--color-secondary-deep)]">{kw}</span>)}</div>
            </div>
          </details>
        ) : null}
      </div>
    </section>
  )
}

function GapTriagePlan({ result, questionCount }: { result: ProcessResult; questionCount: number }) {
  const score = normalizeScore(result.revisedCompatibilityScore ?? result.adapted_score ?? result.compatibilityScore)
  if (score === undefined || score >= 50) return null
  const firstGaps = result.gaps?.slice(0, 2) || []
  return (
    <section className="rounded-2xl border border-orange-200 bg-orange-50 p-5 text-left shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-orange-700">Plan para subir</p>
      <h3 className="mt-1 text-xl font-bold text-orange-950">Antes de descargar, revisemos la evidencia crítica.</h3>
      <p className="mt-2 text-sm leading-6 text-orange-900">Con score menor a 50, no conviene forzar el CV. Primero confirmamos si existe experiencia real que todavía no aparece; si no existe, dejamos la brecha sin inventar.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-white/80 p-3 text-sm text-orange-950"><strong>1. Detectar brechas</strong><br />Vemos qué requisitos pesan más.</div>
        <div className="rounded-xl bg-white/80 p-3 text-sm text-orange-950"><strong>2. Confirmar evidencia</strong><br />{questionCount || 'Unas'} preguntas, una por una.</div>
        <div className="rounded-xl bg-white/80 p-3 text-sm text-orange-950"><strong>3. Ajustar sin inventar</strong><br />Solo agregamos lo que puedas defender.</div>
      </div>
      {firstGaps.length ? <p className="mt-3 text-xs leading-5 text-orange-800">Brechas visibles: {firstGaps.join(' · ')}</p> : null}
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
  const originalScore = normalizeScore(result.original_score)
  const adaptedScore = normalizeScore(result.adapted_score ?? result.compatibilityScore)
  const score = normalizeScore(result.revisedCompatibilityScore ?? adaptedScore)
  const baseScore = originalScore
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

function renderOptimizedCV(cv: any, outputLanguage: 'english' | 'spanish' = 'spanish', keywords: string[] = []) {
  if (!cv) return null
  if (typeof cv === 'string') {
    return <pre className="whitespace-pre-wrap text-sm text-slate-800 font-sans">{cv}</pre>
  }

  const labels = getCvLabels(outputLanguage)

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
            <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wide text-xs">{labels.summary}</h4>
            <p className="text-sm text-slate-800 leading-relaxed"><HighlightedText text={cv.summary} keywords={keywords} /></p>
          </div>
        )}

        {(cv.coreCompetencies?.length > 0 || cv.skills?.length > 0) && (
          <div className="border-t border-slate-200 pt-4">
            <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wide text-xs">{labels.skills}</h4>
            {renderChipList([...(cv.coreCompetencies || []), ...(cv.skills || [])])}
          </div>
        )}

        {cv.technicalSkills?.length > 0 && (
          <div className="border-t border-slate-200 pt-4">
            <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wide text-xs">{labels.technicalSkills}</h4>
            {renderChipList(cv.technicalSkills)}
          </div>
        )}

        {cv.experience?.length > 0 && (
          <div className="space-y-4 border-t border-slate-200 pt-4">
            <h4 className="font-bold text-slate-900 uppercase tracking-wide text-xs">{labels.experience}</h4>
            {cv.experience.map((role: any, index: number) => (
              <div key={index}>
                <p className="font-semibold text-slate-950">{role.title}</p>
                <p className="text-sm text-slate-600">{[role.company, role.location, role.dates].filter(Boolean).join(' | ')}</p>
                {role.techStack?.length > 0 && <p className="mt-2 text-xs text-slate-700"><span className="font-bold">{labels.roleTechStack}:</span> {role.techStack.join(', ')}</p>}
                {role.tools?.length > 0 && <p className="mt-1 text-xs text-slate-700"><span className="font-bold">{labels.roleTools}:</span> {role.tools.join(', ')}</p>}
                <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-slate-800">
                  {role.bullets?.map((bullet: string, bulletIndex: number) => <li key={bulletIndex}><HighlightedText text={bullet} keywords={keywords} /></li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        {((cv.featuredProjects || cv.projects)?.length > 0) && (
          <div className="space-y-4 border-t border-slate-200 pt-4">
            <h4 className="font-bold text-slate-900 uppercase tracking-wide text-xs">{labels.featuredProjects}</h4>
            {(cv.featuredProjects || cv.projects).map((project: any, index: number) => (
              <div key={index}>
                <p className="font-semibold text-slate-950">{project.name}</p>
                <p className="text-sm text-slate-600">{[project.description, project.role, project.dates].filter(Boolean).join(' | ')}</p>
                {project.techStack?.length > 0 && <p className="mt-2 text-xs text-slate-700"><span className="font-bold">{labels.roleTechStack}:</span> {project.techStack.join(', ')}</p>}
                {project.tools?.length > 0 && <p className="mt-1 text-xs text-slate-700"><span className="font-bold">{labels.roleTools}:</span> {project.tools.join(', ')}</p>}
                <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-slate-800">
                  {(project.bullets || project.achievements)?.map((bullet: string, bulletIndex: number) => <li key={bulletIndex}><HighlightedText text={bullet} keywords={keywords} /></li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        {renderSimpleSection(labels.education, cv.education)}
        {renderSimpleSection(labels.certifications, cv.certifications)}
        {cv.tools?.length > 0 && <div className="border-t border-slate-200 pt-4"><h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wide text-xs">{labels.tools}</h4>{renderChipList(cv.tools)}</div>}
        {renderSimpleSection(labels.languages, cv.languages)}
      </div>
    </section>
  )
}

function FlowStepper({ activeStage, completedStages = [], onStageChange }: { activeStage: 'cv-base' | 'vacancy' | 'diagnosis' | 'ready'; completedStages?: string[]; onStageChange?: (stage: 'cv-base' | 'vacancy' | 'diagnosis' | 'ready') => void }) {
  const stages = [
    { id: 'cv-base', number: 1, label: 'CV base' },
    { id: 'vacancy', number: 2, label: 'Vacante' },
    { id: 'diagnosis', number: 3, label: 'Diagnóstico claro' },
    { id: 'ready', number: 4, label: 'Listo para enviar' },
  ] as const

  return (
    <nav aria-label="Progreso" className="mx-auto w-full max-w-[920px] px-1 py-5">
      <div className="grid grid-cols-4 gap-1">
        {stages.map((stage) => {
          const isActive = activeStage === stage.id
          const isCompleted = completedStages.includes(stage.id)
          const isClickable = Boolean(onStageChange) && (isActive || isCompleted)
          const isReached = isActive || isCompleted
          return (
            <button
              key={stage.id}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStageChange?.(stage.id)}
              className={`relative min-h-[54px] text-center text-[10px] font-bold transition md:text-xs ${isReached ? 'text-[var(--color-primary)]' : 'text-[#6F7890]'} ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {stage.id !== 'ready' ? (
                <span className={`absolute left-[calc(50%+22px)] top-[13px] h-0.5 w-[calc(100%-44px)] ${isReached ? 'bg-[var(--color-primary)]' : 'bg-[#D9E1EF]'}`} />
              ) : null}
              <span className={`relative z-10 mx-auto mb-1.5 grid h-7 w-7 place-items-center rounded-full border-2 text-xs font-extrabold ${isReached ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-[0_0_0_5px_rgba(45,107,224,.12)]' : 'border-[#CCD5E3] bg-white text-[#7C8799]'}`}>{stage.number}</span>
              <span className="relative z-10 block leading-tight">{stage.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [jobFile, setJobFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [savedCvText, setSavedCvText] = useState('')
  const [useSavedCv, setUseSavedCv] = useState(false)
  const [userCredits, setUserCredits] = useState<number | null>(null)
  const [downloadedVacancyTitle, setDownloadedVacancyTitle] = useState('')
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
  const [manualClarificationPrompts, setManualClarificationPrompts] = useState<ClarificationPrompt[]>([])
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<number, { option: string; detail: string; source?: string }>>({})
  const [copySuccess, setCopySuccess] = useState('')
  const [clarificationError, setClarificationError] = useState('')
  const [activeClarificationIndex, setActiveClarificationIndex] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const jobFileRef = useRef<HTMLInputElement>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [coverLetterFormat, setCoverLetterFormat] = useState<'short' | 'formal'>('short')
  const [setupStep, setSetupStep] = useState<'cv-base' | 'vacancy'>('cv-base')
  const [activeResultStep, setActiveResultStep] = useState<'evidence' | 'context' | 'cv'>('evidence')
  const normalizedEmailForLinks = email.trim().toLowerCase()
  const dashboardHref = result?.dashboard_url || `/dashboard?email=${encodeURIComponent(normalizedEmailForLinks)}${result?.auth_token ? `&auth=${encodeURIComponent(result.auth_token)}` : ''}`
  const cvForActions = editableCv || result?.optimizedCV
  const canDownloadCv = hasDownloadableCv(cvForActions)
  const evidenceStep = result ? getEvidenceStepState(result) : null
  const phase2GapPrompts = result ? buildGapRecoveryQuestions(result.requirements_table, result.adapted_match_results || result.original_match_results) as ClarificationPrompt[] : []
  const activeClarificationPrompts = manualClarificationPrompts.length
    ? manualClarificationPrompts
    : (phase2GapPrompts.length ? phase2GapPrompts : normalizeClarificationPrompts(result?.clarificationQuestions))
  const shouldRenderEvidenceQuestions = !!result && activeClarificationPrompts.length > 0 && (manualClarificationPrompts.length > 0 || phase2GapPrompts.length > 0 || shouldShowEvidenceQuestions(result))
  const hasContextAnswers = Object.values(clarificationAnswers).some((answer) => Boolean(answer?.option || answer?.detail?.trim()))
  const contextComplete = !shouldRenderEvidenceQuestions || revisionChanges.length > 0
  const resultWizardSteps = result ? getResultWizardSteps(result, { canDownloadCv, contextComplete }) : []
  const canOpenCvStep = contextComplete
  const cvProvided = Boolean(file || (useSavedCv && savedCvText.trim().length >= 200))
  const showLastCreditNotice = shouldShowLastCreditNotice({ credits: userCredits, moment: 'analysis_start' })
  const lifetimeAnalyses = typeof window === 'undefined' ? 0 : Number(window.localStorage.getItem('revisamicv_lifetime_analyses') || 0)
  const anotherVacancyHref = result?.tokens_remaining === 0
    ? `/dashboard?email=${encodeURIComponent(normalizedEmailForLinks)}${result?.auth_token ? `&auth=${encodeURIComponent(result.auth_token)}` : ''}&pack=${getSmartPackDefault(lifetimeAnalyses)}#comprar`
    : '/analizar'

  useEffect(() => {
    const savedEmail = window.localStorage.getItem('revisamicv_email')
    const savedJob = window.localStorage.getItem('revisamicv_job_description')
    const savedLanguage = window.localStorage.getItem('revisamicv_output_language') as 'english' | 'spanish' | null
    const storedCvText = window.localStorage.getItem('revisamicv_latest_cv_text') || ''
    const storedCredits = window.localStorage.getItem('revisamicv_tokens_remaining')
    const lastDraftKey = window.localStorage.getItem('revisamicv:last-analysis-draft-key')
    if (savedEmail) setEmail(savedEmail)
    if (savedJob) setJobDescription(savedJob)
    if (storedCvText.trim().length >= 200) {
      setSavedCvText(storedCvText)
      setUseSavedCv(true)
    }
    if (storedCredits !== null) setUserCredits(Number(storedCredits))
    if (savedLanguage === 'english' || savedLanguage === 'spanish') setOutputLanguage(savedLanguage)
    if (lastDraftKey) {
      try {
        const draft = JSON.parse(window.localStorage.getItem(lastDraftKey) || 'null')
        if (draft?.result) {
          setResult(draft.result)
          setEditableCv(draft.editableCv || draft.result.optimizedCV || null)
          if (draft.email) setEmail(draft.email)
          if (draft.jobDescription) setJobDescription(draft.jobDescription)
          if (draft.outputLanguage === 'english' || draft.outputLanguage === 'spanish') setOutputLanguage(draft.outputLanguage)
          if (draft.clarificationAnswers && typeof draft.clarificationAnswers === 'object') setClarificationAnswers(draft.clarificationAnswers)
          if (draft.activeResultStep === 'evidence' || draft.activeResultStep === 'context' || draft.activeResultStep === 'cv') setActiveResultStep(draft.activeResultStep)
          setCopySuccess('Recuperé tu análisis anterior. Puedes continuar sin gastar otro crédito.')
        }
      } catch {}
    }
    trackEvent('signup_view')
  }, [])

  useEffect(() => {
    if (!result) return
    try {
      const draftKey = createAnalysisDraftKey(email)
      window.localStorage.setItem(draftKey, JSON.stringify({
        result,
        editableCv,
        email: email.trim().toLowerCase(),
        jobDescription,
        outputLanguage,
        clarificationAnswers,
        activeResultStep,
        savedAt: new Date().toISOString(),
      }))
      window.localStorage.setItem('revisamicv:last-analysis-draft-key', draftKey)
    } catch {}
  }, [result, editableCv, email, jobDescription, outputLanguage, clarificationAnswers, activeResultStep])

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

  const goToVacancyStep = () => {
    const emailError = validateEmail(email)
    if (emailError) {
      trackEvent('analysis_validation_error', { field: 'email' })
      setError(emailError)
      return
    }
    const fileError = cvProvided ? '' : validateCvFile(file)
    if (fileError) {
      trackEvent('analysis_validation_error', { field: 'cv_file', extension: getFileExtensionForAnalytics(file?.name), size: getFileSizeBucket(file?.size) })
      setError(fileError)
      return
    }
    setError('')
    setSetupStep('vacancy')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const emailError = validateEmail(email)
    if (emailError) {
      trackEvent('analysis_validation_error', { field: 'email' })
      return setError(emailError)
    }

    const fileError = cvProvided ? '' : validateCvFile(file)
    if (fileError) {
      trackEvent('analysis_validation_error', { field: 'cv_file', extension: getFileExtensionForAnalytics(file?.name), size: getFileSizeBucket(file?.size) })
      return setError(fileError)
    }
    const selectedFile = file as File | null

    const jobError = jobFile ? '' : validateJobDescription(jobDescription)
    if (jobError) {
      trackEvent('analysis_validation_error', { field: 'job_description', chars: jobDescription.trim().length })
      return setError(jobError)
    }

    trackEvent('analysis_started', {
      language: outputLanguage,
      extension: selectedFile ? getFileExtensionForAnalytics(selectedFile.name) : 'saved_cv',
      size: selectedFile ? getFileSizeBucket(selectedFile.size) : 'saved_cv',
      job_chars_bucket: jobDescription.length < 1000 ? '<1k' : jobDescription.length < 4000 ? '1-4k' : '4k+',
      job_file: jobFile ? getFileExtensionForAnalytics(jobFile.name) : 'none',
    })

    setLoading(true)
    setAnalysisProgress(8)
    setAnalysisStepIndex(0)
    setError('')

    try {
      let res: Response
      if (selectedFile) {
        const uploadFile = selectedFile as File
        const formData = new FormData()
        formData.append('email', email.trim().toLowerCase())
        formData.append('cv', uploadFile)
        formData.append('jobDescription', jobDescription)
        if (jobFile) formData.append('jobFile', jobFile)
        formData.append('outputLanguage', outputLanguage)
        res = await fetch('/api/process-cv', { method: 'POST', body: formData })
      } else {
        res = await fetch('/api/process-cv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            cv_text: savedCvText,
            job_description: jobDescription,
            outputLanguage,
          }),
        })
      }
      const data = await res.json()

      if (!res.ok) throw new Error(getFriendlyApiError(data.message || data.error, 'No pude procesar el CV. Intenta de nuevo.'))
      setAnalysisProgress(100)
      window.localStorage.setItem('revisamicv_email', email.trim().toLowerCase())
      if (data.auth_token) window.localStorage.setItem('revisamicv_auth_token', data.auth_token)
      if (typeof data.tokens_remaining === 'number') {
        setUserCredits(data.tokens_remaining)
        window.localStorage.setItem('revisamicv_tokens_remaining', String(data.tokens_remaining))
      }
      if (typeof data.saved_cv_text === 'string' && data.saved_cv_text.trim().length >= 200) {
        setSavedCvText(data.saved_cv_text)
        window.localStorage.setItem('revisamicv_latest_cv_text', data.saved_cv_text)
      }
      incrementStoredAnalysisCount(window.localStorage)
      window.localStorage.setItem('revisamicv_output_language', outputLanguage)
      trackEvent('analysis_completed', {
        language: outputLanguage,
        score: typeof data.compatibilityScore === 'number' ? Math.round(data.compatibilityScore) : -1,
        decision: data.applicationDecision || 'unknown',
        tokens_remaining: typeof data.tokens_remaining === 'number' ? data.tokens_remaining : -1,
      })
      setResult(data)
      setActiveResultStep(getInitialResultStep(data, { canDownloadCv: hasDownloadableCv(data.optimizedCV) }) as 'evidence' | 'context' | 'cv')
      setEditableCv(data.optimizedCV || null)
      setCopySuccess('Tu análisis está listo. Si el score es bajo, responde las preguntas para completar el CV antes de descargarlo.')
      setRevisionInstruction('')
      setRevisionNotes([])
      setBlockedChanges([])
      setRevisionAddedSkills([])
      setRevisionChanges([])
      const modelPrompts = Array.isArray(data.clarificationQuestions) ? data.clarificationQuestions : []
      const lowScorePrompt = modelPrompts.length ? null : buildLowScoreCoachingPrompt(data.compatibilityScore)
      setManualClarificationPrompts(lowScorePrompt ? [lowScorePrompt] : [])
      setClarificationAnswers({})
      if (lowScorePrompt) trackEvent('low_score_coaching_prompt_shown', { score: normalizeScore(data.compatibilityScore) ?? -1 })
    } catch (err: any) {
      trackEvent('analysis_failed', { message: String(err.message || '').slice(0, 80) })
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const openEditor = () => {
    setEditorOpen(true)
    setTimeout(() => document.getElementById('cv-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const downloadFile = async (format: 'pdf' | 'docx' | 'txt') => {
    const cvForDownload = editableCv || result?.optimizedCV
    if (!hasDownloadableCv(cvForDownload)) return setError('Todavía no hay un CV adaptado listo para descargar. Responde las preguntas rápidas o usa “Editar antes de descargar” para completar la información.')

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
      setDownloadedVacancyTitle(getResultVacancyTitle(result, jobDescription))
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
    const text = coverLetterFormat === 'short'
      ? (result?.coverLetterShort || result?.coverLetter || '')
      : (result?.coverLetterFormal || result?.coverLetterShort || result?.coverLetter || '')
    if (!text) return setError('No hay carta de presentación para copiar')
    try {
      await navigator.clipboard.writeText(text)
      trackEvent('cover_letter_copied', { format: coverLetterFormat })
      setCopySuccess(coverLetterFormat === 'short'
        ? 'Mensaje corto copiado. Pégalo en LinkedIn, chat o portal.'
        : 'Carta formal copiada. Pégala en el email o formulario de postulación.')
      setError('')
    } catch {
      setError('No pude copiar la carta. Selecciona el texto y cópialo manualmente.')
    }
  }

  const submitClarificationAnswers = async () => {
    const questions = activeClarificationPrompts
    if (!questions.length) return

    const normalizedAnswers = questions.reduce((acc, _question, index) => {
      const answer = clarificationAnswers[index] || { option: '', detail: '', source: '' }
      const source = String(answer.source || '').trim()
      const detailLine = answer.detail.trim()
      const detail = [source ? `Fuente: ${source}.` : '', detailLine].filter(Boolean).join(' ')
      acc[index] = { option: answer.option || (detail ? 'Sí, la tengo' : 'No aplica'), detail, source }
      return acc
    }, {} as Record<number, { option: string; detail: string; source?: string }>)

    const missing = questions.findIndex((_, index) => {
      const answer = normalizedAnswers[index]
      const optionNeedsEvidence = !/^no\b|no directamente|no tengo|no aplica/i.test(answer.option)
      return optionNeedsEvidence && answer.detail.trim().length < 20
    })

    if (missing >= 0) {
      setClarificationError(`En la pregunta ${missing + 1}, elige una fuente de evidencia o escribe una línea concreta. Así podemos ajustar sin inventar.`)
      setActiveClarificationIndex(missing)
      return
    }

    setClarificationError('')
    setManualClarificationPrompts([])
    setActiveResultStep('cv')
    setCopySuccess('Estoy aplicando tus respuestas. Te muestro el CV ajustado en unos segundos.')
    const userDeclaredEvidence = normalizeUserDeclarations(questions.map((question, index) => ({
      requirement_id: question.requirement_id,
      requirement_text: question.requirement_text || question.question,
      option: normalizedAnswers[index]?.option,
      detail: normalizedAnswers[index]?.detail,
    })))
    await applyRevisionInstruction(buildClarificationInstruction(questions, normalizedAnswers), userDeclaredEvidence)
  }

  const applyRevisionInstruction = async (instructionOverride?: string, userDeclaredEvidence: any[] = []) => {
    const cvToRevise = editableCv || result?.optimizedCV
    const instruction = (instructionOverride || revisionInstruction).trim()
    if (!cvToRevise) return setError('Primero genera un CV adaptado')
    if (!instruction) return setError('Escribe qué cambio quieres aplicar')

    if (!instructionOverride) {
      const prompt = buildRiskyRevisionPrompt(instruction)
      if (prompt) {
        setManualClarificationPrompts([prompt])
        setActiveResultStep('context')
        setClarificationAnswers({})
        setCopySuccess('Te hago preguntas rápidas aquí mismo para ajustar sin inventar y sin enredarte.')
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
          currentCompatibilityScore: result?.revisedCompatibilityScore ?? result?.adapted_score ?? result?.compatibilityScore,
          matchBreakdown: result?.matchBreakdown,
          requirementsTable: result?.requirements_table,
          originalMatchResults: result?.original_match_results,
          adaptedMatchResults: result?.adapted_match_results,
          userDeclaredEvidence,
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
        ...(revisedScore !== undefined ? { revisedCompatibilityScore: revisedScore, adapted_score: data.adapted_score ?? revisedScore } : {}),
        ...(Array.isArray(data.adapted_match_results) ? { adapted_match_results: data.adapted_match_results } : {}),
        ...(data.score_breakdown ? { score_breakdown: data.score_breakdown } : {}),
        ...(typeof data.revisionScoreExplanation === 'string' ? { revisionScoreExplanation: data.revisionScoreExplanation } : {}),
      } : current)
      const addedSkills = getAddedSkills(beforeCv, data.optimizedCV)
      setRevisionAddedSkills(addedSkills)
      setRevisionChanges(summarizeCvChanges(beforeCv, data.optimizedCV))
      setRevisionNotes(Array.isArray(data.revisionNotes) ? data.revisionNotes : [])
      setBlockedChanges(Array.isArray(data.blockedChanges) ? data.blockedChanges.map(coachBlockedChange) : [])
      setRevisionInstruction('')
      setManualClarificationPrompts([])
      setActiveResultStep('cv')
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
      <nav className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <a href="/" className="flex items-center gap-2 font-display text-lg font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-primary)] text-sm font-bold text-white">R</span>
            RevisaMiCV
          </a>
          <div className="flex items-center gap-3 text-sm">
            <a href="/analizar" className="font-semibold text-[var(--color-ink)]">Analizar</a>
            <a href="/blog" className="hidden font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] sm:inline-flex">Blog</a>
            <a href="/#precios" className="hidden font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] sm:inline-flex">Precios</a>
            <a href="/dashboard" aria-label="Mi panel" className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-3 py-1.5 font-semibold text-[var(--color-ink-soft)] hover:border-[var(--color-primary)] hover:text-[var(--color-ink)]">
              <UserIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Mi panel</span>
            </a>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-[960px] px-5 pb-12 pt-4">

        {!result ? (
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <FlowStepper
              activeStage={setupStep}
              completedStages={setupStep === 'vacancy' ? ['cv-base'] : []}
              onStageChange={(stage) => {
                if (stage === 'cv-base') setSetupStep('cv-base')
                if (stage === 'vacancy' && cvProvided && email.trim()) setSetupStep('vacancy')
              }}
            />

            {setupStep === 'cv-base' ? (
              <section className="mx-auto max-w-[920px] overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-[var(--shadow-soft)]">
                <div className="grid items-center gap-10 p-6 md:grid-cols-[1fr_180px] md:p-8">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--color-primary)]">Paso 1 · CV base</p>
                    <h2 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight text-[var(--color-ink)]">Sube tu CV base</h2>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--color-ink-soft)]">Usa el CV que ya tienes. No tiene que estar perfecto: lo comparamos con la vacante y luego te ayudamos a mejorarlo sin inventar experiencia.</p>

                    <div className="mt-6 max-w-xl">
                      <label className="text-sm font-bold text-[var(--color-ink)]">Tu email</label>
                      <input
                        type="text"
                        inputMode="email"
                        autoComplete="email"
                        maxLength={254}
                        value={email}
                        onChange={(e) => setAndRememberEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="mt-2 w-full rounded-[10px] border border-[#BFC9D8] bg-white px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10"
                        required
                      />
                      <p className="mt-2 text-xs text-[var(--color-ink-soft)]">Lo usamos para guardar tu prueba gratis, créditos y recuperar tus resultados.</p>
                    </div>

                    {savedCvText ? (
                      <div className="mt-5 rounded-2xl border border-[#CFE0FF] bg-[#F6FAFF] p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-bold text-[var(--color-ink)]">Tu CV base ya está guardado</p>
                            <p className="mt-1 text-xs leading-5 text-[var(--color-ink-soft)]">Puedes saltar la subida y usar el último CV que analizaste. Si quieres, también puedes subir uno nuevo.</p>
                          </div>
                          <button type="button" onClick={() => { setUseSavedCv(true); setFile(null); setError('') }} className={`rounded-xl px-4 py-2 text-sm font-bold ${useSavedCv ? 'bg-[var(--color-primary)] text-white' : 'border border-[var(--color-line)] bg-white text-[var(--color-ink)] hover:border-[var(--color-primary)]'}`}>Usar mi CV guardado</button>
                        </div>
                      </div>
                    ) : null}

                    <div
                      onClick={() => fileRef.current?.click()}
                      className="mt-5 grid h-[164px] cursor-pointer place-items-center rounded-2xl border-[1.5px] border-dashed border-[#C8D2E1] bg-[linear-gradient(180deg,#FFFFFF,#FBFDFF)] px-5 text-center transition hover:border-[var(--color-primary)]"
                    >
                      <UploadIcon className="mx-auto mb-2 h-[38px] w-[38px] text-[var(--color-primary)]" />
                      {file ? (
                        <>
                          <p className="font-bold text-[var(--color-primary)]">{file.name}</p>
                          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Puedes hacer clic para cambiar el archivo.</p>
                        </>
                      ) : (
                        <>
                          <p className="text-[17px] font-bold text-[var(--color-ink)]">Arrastra tu archivo aquí</p>
                          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">PDF o Word</p>
                        </>
                      )}
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={(e) => {
                          const selected = e.target.files?.[0] || null
                          setFile(selected)
                          if (selected) setUseSavedCv(false)
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
                  </div>

                  <aside className="rounded-2xl border border-[#CFE0FF] bg-[linear-gradient(180deg,#F8FBFF,#F1F7FF)] p-5 text-sm leading-6 text-[#2A3B5F]">
                    <ShieldCheckIcon className="mb-3 h-7 w-7 text-[var(--color-primary)]" />
                    Tu información se usa solo para analizar tu postulación.
                  </aside>
                </div>

                <div className="flex flex-col gap-3 border-t border-[var(--color-line)] bg-white px-6 py-5 text-center md:flex-row md:items-center md:justify-between md:text-left">
                  <span className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[#BDE8D0] bg-[#F2FBF6] px-3 py-2 text-sm font-bold text-[#0C6F49] md:justify-start"><ShieldCheckIcon className="h-4 w-4" /> Sin registro</span>
                  <button type="button" onClick={goToVacancyStep} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-bold text-white transition hover:bg-[var(--color-primary-deep)]">Continuar <ArrowRightIcon className="h-4 w-4" /></button>
                </div>
              </section>
            ) : (
              <section className="mx-auto max-w-[920px] overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-[var(--shadow-soft)]">
                <div className="p-6 md:p-8">
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--color-primary)]">Paso 2 · Vacante real</p>
                  <h2 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight text-[var(--color-ink)]">Pega la vacante real</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-ink-soft)]">Cada oferta pide cosas distintas. Pega la descripción completa o sube el archivo de la vacante para detectar qué necesita leer esa empresa.</p>
                  {showLastCreditNotice ? (
                    <div className="mt-4 rounded-xl border border-[#CFE0FF] bg-[#F6FAFF] p-3 text-sm font-semibold text-[#2A3B5F]">Este es tu último análisis disponible.</div>
                  ) : null}

                  <textarea
                    value={jobDescription}
                    onChange={(e) => {
                      const value = e.target.value
                      setJobDescription(value)
                      if (value.trim().length >= MIN_JOB_DESCRIPTION_CHARS || jobFile) setError('')
                      window.localStorage.setItem('revisamicv_job_description', value)
                    }}
                    rows={11}
                    placeholder={`Buscamos un/a Especialista en Marketing Digital para liderar campañas pagadas en Meta Ads y Google Ads. Deberá planificar, ejecutar y optimizar campañas que generen resultados medibles.

Responsabilidades:
• Crear y gestionar campañas en Meta Ads y Google Ads.
• Analizar métricas y proponer optimizaciones basadas en datos.
• Trabajar con el equipo de contenido y diseño para testear creatividades.
• Reportar resultados y ROI de campañas.

Requisitos:
• 2+ años de experiencia en marketing digital.
• Manejo de Meta Ads, Google Ads y análisis de métricas.
• Comunicación clara y capacidad para priorizar.`}
                    className="mt-6 h-[180px] w-full resize-none rounded-[10px] border border-[#BFC9D8] bg-white p-5 text-sm leading-6 text-[var(--color-ink)] outline-none transition placeholder:text-[#8B95A5] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10"
                    required={!jobFile}
                  />
                  <p className="mt-2 text-xs font-semibold text-[var(--color-ink-soft)]">Una vacante puede recibir cientos de CVs. El tuyo tiene segundos para decir lo correcto.</p>

                  <div className="mt-4 rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-paper-2)] p-3">
                    <input
                      ref={jobFileRef}
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={(e) => {
                        const selected = e.target.files?.[0] || null
                        setJobFile(selected)
                        if (selected) setError('')
                        if (selected) trackEvent('job_file_selected', { extension: getFileExtensionForAnalytics(selected.name), size: getFileSizeBucket(selected.size) })
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => jobFileRef.current?.click()}
                      className="w-full rounded-xl border border-[var(--color-line)] bg-white px-4 py-3 text-left text-sm font-bold text-[var(--color-ink)] hover:border-[var(--color-primary)]"
                    >
                      {jobFile ? `Vacante adjunta: ${jobFile.name}` : 'O también sube la vacante en PDF, Word o TXT'}
                    </button>
                    {jobFile && (
                      <button type="button" onClick={() => setJobFile(null)} className="mt-2 text-xs font-bold text-[var(--color-primary-deep)]">Quitar archivo de vacante</button>
                    )}
                  </div>

                  <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-[var(--color-line)] bg-white p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-bold text-[var(--color-ink)]">Idioma del CV adaptado</p>
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
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[var(--color-ink-soft)]">
                    <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-paper-2)] px-3 py-1.5">✓ CV cargado</span>
                    <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-paper-2)] px-3 py-1.5">✓ Sin inventar experiencia</span>
                    <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-paper-2)] px-3 py-1.5">✓ PDF, DOCX y TXT</span>
                  </div>

                  <p className={`mt-3 text-xs ${!jobFile && jobDescription.trim().length > 0 && jobDescription.trim().length < MIN_JOB_DESCRIPTION_CHARS ? 'font-semibold text-red-700' : 'text-[var(--color-ink-soft)]'}`}>
                    {jobDescription.trim().length} caracteres escritos. Necesitamos mínimo {MIN_JOB_DESCRIPTION_CHARS} si no adjuntas archivo; máximo 12.000.
                  </p>
                  {!jobFile && jobDescription.trim().length > 0 && jobDescription.trim().length < MIN_JOB_DESCRIPTION_CHARS ? (
                    <div className="mt-3 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">
                      <AlertCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
                      <p>Pega al menos {MIN_JOB_DESCRIPTION_CHARS} caracteres o adjunta el archivo de la vacante para continuar.</p>
                    </div>
                  ) : null}
                  {(jobFile || jobDescription.trim().length >= MIN_JOB_DESCRIPTION_CHARS) ? (
                    <div className="mt-3 flex gap-3 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm leading-6 text-orange-900">
                      <AlertCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
                      <p>Podemos analizar esta vacante. Mientras más completa sea la descripción, mejor detectamos requisitos y keywords.</p>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3 border-t border-[var(--color-line)] bg-white p-5 text-center md:flex-row md:items-center md:justify-between md:text-left">
                  <button type="button" onClick={() => setSetupStep('cv-base')} className="text-sm font-semibold text-[var(--color-ink-soft)] underline underline-offset-4 hover:text-[var(--color-ink)]">← Volver al CV</button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-7 text-sm font-bold text-white shadow-[var(--shadow-cta)] transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-deep)] disabled:opacity-50"
                  >
                    {loading ? <span>{analysisProgressSteps[analysisStepIndex]?.label || 'Analizando compatibilidad...'}</span> : <><SparklesIcon className="h-5 w-5" /> Analizar mi CV →</>}
                  </button>
                </div>
              </section>
            )}

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

          </form>        ) : (
          <div className="mx-auto max-w-[760px] space-y-8">
            <FlowStepper
              activeStage={activeResultStep === 'cv' ? 'ready' : 'diagnosis'}
              completedStages={activeResultStep === 'cv' ? ['cv-base', 'vacancy', 'diagnosis'] : ['cv-base', 'vacancy']}
              onStageChange={(stage) => {
                if (stage === 'diagnosis') {
                  setError('')
                  setActiveResultStep(shouldRenderEvidenceQuestions ? 'context' : 'evidence')
                }
                if (stage === 'ready') {
                  if (!canOpenCvStep) {
                    setError('Antes de descargar, afina tu evidencia para ajustar sin inventar.')
                    return
                  }
                  setError('')
                  setActiveResultStep('cv')
                }
              }}
            />

            {activeResultStep === 'evidence' ? (
              <section className="space-y-7">
                <ResultHero result={result} cv={editableCv || result.optimizedCV || result.rawText} />
                <GapTriagePlan result={result} questionCount={activeClarificationPrompts.length} />
                {renderScoreBreakdown(result.score_breakdown)}
                {renderKeyRequirements(result)}
                <div className="flex flex-col items-center justify-between gap-3 pt-2 md:flex-row">
                  <a href={dashboardHref} className="text-sm font-semibold text-[var(--color-ink-soft)] underline underline-offset-4 hover:text-[var(--color-ink)]">Guardar en mi dashboard</a>
                  <button
                    type="button"
                    onClick={() => setActiveResultStep(shouldRenderEvidenceQuestions ? 'context' : 'cv')}
                    className="inline-flex items-center justify-center rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-bold text-white transition hover:bg-[var(--color-primary-deep)]"
                  >
                    {shouldRenderEvidenceQuestions ? 'Continuar →' : 'Ver mi CV adaptado →'}
                  </button>
                </div>
              </section>
            ) : null}

            {activeResultStep === 'context' ? (
              <section className="space-y-5">
                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--color-secondary-deep)]">Tu experiencia</p>
                  <h1 className="mx-auto mt-2 max-w-[600px] text-balance font-display text-[clamp(1.5rem,4.4vw,2rem)] font-semibold leading-[1.16] text-[var(--color-ink)]">¿Algo de esto existe, pero no está en tu CV?</h1>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--color-ink-soft)]">No inventamos nada. Si esa experiencia existe y no aparece, la agregamos y reescribimos el CV en el lenguaje de la vacante. Si no aplica, sáltalo.</p>
                </div>

                {shouldRenderEvidenceQuestions ? (() => {
                  const safeQuestionIndex = Math.min(activeClarificationIndex, activeClarificationPrompts.length - 1)
                  const prompt = activeClarificationPrompts[safeQuestionIndex]
                  const answer = clarificationAnswers[safeQuestionIndex] || { option: '', detail: '', source: '' }
                  const options = prompt.options?.length ? prompt.options : fallbackClarificationOptions
                  const isNoApply = /^no\b|no directamente|no tengo|no aplica/i.test(answer.option || '')
                  const shouldShowEvidenceFields = /^(sí|si|tengo algo básico)/i.test(answer.option || '')
                  const projectedLift = prompt.projected_lift ?? getQuestionProjectedLift(result.requirements_table, result.adapted_match_results || result.original_match_results, prompt.requirement_id)

                  return (
                  <section className="space-y-4">
                    <div className={`rounded-xl border border-[var(--color-line)] bg-white p-5 transition ${isNoApply ? 'opacity-75' : ''}`}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--color-secondary-deep)]">Pregunta {safeQuestionIndex + 1} de {activeClarificationPrompts.length}</p>
                          <h3 className="mt-1 font-bold text-[var(--color-ink)]">{prompt.question}</h3>
                          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">La vacante lo pide y tu CV no lo muestra claro.</p>
                        </div>
                        {projectedLift !== undefined ? (
                          <div className="inline-flex items-center gap-2 rounded-[14px] border border-[#BDE8D0] bg-[#EAF8F0] px-3 py-2 text-xs font-extrabold text-[#0E8C5C]">
                            <TrendingUpIcon className="h-4 w-4" /> Si confirmas esta evidencia, podría subir a {projectedLift}%.
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {options.map((option, optionIndex) => {
                          const noOption = /^no\b|no directamente|no tengo|no aplica/i.test(option)
                          return (
                            <button
                              key={`${prompt.question}-${optionIndex}`}
                              type="button"
                              onClick={() => setClarificationAnswers((current) => ({ ...current, [safeQuestionIndex]: { ...answer, option, source: noOption ? '' : answer.source, detail: noOption ? '' : answer.detail } }))}
                              className={`rounded-lg border px-4 py-2 text-sm font-bold transition ${answer.option === option ? (noOption ? 'border-[var(--color-line)] bg-[var(--color-paper-2)] text-[var(--color-ink-soft)]' : 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white') : 'border-[var(--color-line)] bg-white text-[var(--color-ink)] hover:border-[var(--color-primary)]'}`}
                            >
                              {option}
                            </button>
                          )
                        })}
                      </div>

                      {shouldShowEvidenceFields ? (
                        <div className="mt-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-2)] p-4">
                          <p className="text-sm font-bold text-[var(--color-ink)]">¿De dónde sale esa evidencia?</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {evidenceSourceOptions.map((source) => (
                              <button
                                key={source}
                                type="button"
                                onClick={() => setClarificationAnswers((current) => ({ ...current, [safeQuestionIndex]: { ...answer, option: answer.option || 'Sí, la tengo', source } }))}
                                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${answer.source === source ? 'border-[var(--color-secondary)] bg-[#E7F4F1] text-[var(--color-secondary-deep)]' : 'border-[var(--color-line)] bg-white text-[var(--color-ink-soft)] hover:border-[var(--color-secondary)]'}`}
                              >
                                {source}
                              </button>
                            ))}
                          </div>
                          <input
                            value={answer.detail}
                            onChange={(e) => setClarificationAnswers((current) => ({ ...current, [safeQuestionIndex]: { ...answer, option: answer.option || 'Sí, la tengo', detail: e.target.value } }))}
                            placeholder={prompt.freeTextLabel || 'Una línea opcional con contexto real.'}
                            className="mt-3 w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-orange-100"
                          />
                          <p className="mt-2 text-xs leading-5 text-[var(--color-ink-soft)]">Opcional: una línea corta basta. No agregamos nada que no confirmes.</p>
                        </div>
                      ) : null}
                    </div>

                    {clarificationError && <p className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">{clarificationError}</p>}
                    {revisionLoading ? (
                      <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                        <div className="flex items-center justify-between text-xs font-bold text-[var(--color-primary-deep)]"><span>{revisionProgressSteps[revisionStepIndex]?.label || 'Aplicando respuestas...'}</span><span>{revisionProgress}%</span></div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-700" style={{ width: `${revisionProgress}%` }} /></div>
                      </div>
                    ) : null}
                  </section>
                  )
                })() : (
                  <section className="rounded-xl border border-[var(--color-line)] bg-white p-5 text-center">
                    <p className="font-bold text-[var(--color-ink)]">Tu CV ya muestra suficiente evidencia visible.</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">Puedes pasar directo a revisar y descargar. Este paso queda disponible por si recuerdas algo real que quieras agregar luego.</p>
                  </section>
                )}

                <div className="flex flex-col items-center justify-between gap-3 pt-2 md:flex-row">
                  <button type="button" onClick={() => setActiveResultStep('evidence')} className="text-sm font-semibold text-[var(--color-ink-soft)] underline underline-offset-4 hover:text-[var(--color-ink)]">← Volver al resultado</button>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button type="button" onClick={() => setActiveResultStep('cv')} className="rounded-xl border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-bold text-[var(--color-ink)] hover:border-[var(--color-primary)]">Mi CV ya está completo →</button>
                    {shouldRenderEvidenceQuestions ? (
                      <button type="button" onClick={() => setActiveClarificationIndex((current) => Math.min(current + 1, activeClarificationPrompts.length - 1))} disabled={revisionLoading || activeClarificationIndex >= activeClarificationPrompts.length - 1} className="rounded-xl border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-bold text-[var(--color-ink)] hover:border-[var(--color-primary)] disabled:opacity-50">Saltar esta pregunta</button>
                    ) : null}
                    {shouldRenderEvidenceQuestions ? (
                      <button type="button" onClick={() => {
                        if (activeClarificationIndex < activeClarificationPrompts.length - 1) {
                          setClarificationError('')
                          setActiveClarificationIndex(activeClarificationIndex + 1)
                        } else {
                          submitClarificationAnswers()
                        }
                      }} disabled={revisionLoading} className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white hover:bg-[var(--color-primary-deep)] disabled:opacity-50">{revisionLoading ? 'Generando...' : (activeClarificationIndex < activeClarificationPrompts.length - 1 ? 'Agregar y continuar' : 'Agregar y generar CV')}</button>
                    ) : null}
                  </div>
                </div>
                <p className="text-center text-xs leading-5 text-[var(--color-ink-soft)]">Puedes saltarte lo que no aplique. Nada de lo que no confirmes se inventará.</p>
              </section>
            ) : null}

            {activeResultStep === 'cv' ? (
              <section className="space-y-5">
                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--color-secondary-deep)]">Tu CV adaptado</p>
                  <h1 className="mx-auto mt-2 max-w-[600px] text-balance font-display text-[clamp(1.5rem,4.4vw,2rem)] font-semibold leading-[1.16] text-[var(--color-ink)]">Listo. Revisa y descarga tu CV para esta vacante.</h1>
                  {getScoreLift(result) !== undefined && getScoreLift(result)! > 0 ? (
                    <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-[14px] border border-[#BDE8D0] bg-[#EAF8F0] px-4 py-3 text-sm font-extrabold text-[#0E8C5C]">
                      <CheckIcon className="h-4 w-4" /> Subió {getScoreLift(result)} puntos con evidencia real
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  <button onClick={() => downloadFile('pdf')} disabled={!!downloadLoading || !canDownloadCv} className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--color-primary-deep)] disabled:opacity-50">{downloadLoading === 'pdf' ? 'Descargando PDF...' : 'Descargar PDF'}</button>
                  <button type="button" onClick={openEditor} className="rounded-xl border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-bold text-[var(--color-ink)] hover:border-[var(--color-primary)]">Editar</button>
                  <button onClick={() => downloadFile('docx')} disabled={!!downloadLoading || !canDownloadCv} className="rounded-xl border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-bold text-[var(--color-ink)] hover:border-[var(--color-primary)] disabled:opacity-50">DOCX</button>
                  <button onClick={() => downloadFile('txt')} disabled={!!downloadLoading || !canDownloadCv} className="rounded-xl border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-bold text-[var(--color-ink)] hover:border-[var(--color-primary)] disabled:opacity-50">TXT</button>
                </div>

                <div className="mx-auto max-w-[620px] rounded-[14px] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-soft)] md:p-10">
                  {canDownloadCv ? renderOptimizedCV(cvForActions, outputLanguage, result.keywordsToInclude || []) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">Para evitar un CV vacío o inventado, responde las preguntas rápidas o abre el editor y completa datos reales antes de descargar.</div>
                  )}
                </div>

                {downloadedVacancyTitle ? (
                  <section className="mx-auto max-w-[620px] rounded-2xl border border-[#CFE0FF] bg-[#F6FAFF] p-5 text-center shadow-sm">
                    <p className="text-sm font-semibold leading-6 text-[var(--color-ink)]">Tu CV quedó adaptado para {downloadedVacancyTitle}. Tu CV base ya está guardado — el próximo análisis toma 2 minutos.</p>
                    <a href={anotherVacancyHref} className="mt-4 inline-flex rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white hover:bg-[var(--color-primary-deep)]">Analizar otra vacante →</a>
                  </section>
                ) : (
                  <section className="mx-auto max-w-[620px] rounded-2xl border border-[var(--color-line)] bg-white p-5 text-center shadow-sm">
                    <p className="text-sm font-semibold leading-6 text-[var(--color-ink)]">Este análisis es para esta vacante. ¿A cuántas más estás aplicando esta semana?</p>
                    <a href={anotherVacancyHref} className="mt-4 inline-flex rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white hover:bg-[var(--color-primary-deep)]">Analizar otra vacante →</a>
                  </section>
                )}

                {(result?.coverLetterShort || result?.coverLetterFormal || result?.coverLetter) ? (
                  <section className="mx-auto max-w-[620px] rounded-[14px] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-soft)]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--color-secondary-deep)]">Carta de presentación</p>
                        <h3 className="font-display text-lg font-semibold text-[var(--color-ink)]">Inclúyela con tu CV</h3>
                      </div>
                      <div className="flex gap-1 rounded-lg bg-[var(--color-paper-2)] p-0.5">
                        <button
                          type="button"
                          onClick={() => setCoverLetterFormat('short')}
                          className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${coverLetterFormat === 'short' ? 'bg-white text-[var(--color-ink)] shadow-sm' : 'text-[var(--color-ink-soft)]'}`}
                        >Mensaje corto</button>
                        <button
                          type="button"
                          onClick={() => setCoverLetterFormat('formal')}
                          className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${coverLetterFormat === 'formal' ? 'bg-white text-[var(--color-ink)] shadow-sm' : 'text-[var(--color-ink-soft)]'}`}
                        >Carta formal</button>
                      </div>
                    </div>
                    <div className="mt-3 whitespace-pre-wrap rounded-lg bg-[var(--color-paper-2)] p-4 text-sm leading-6 text-[var(--color-ink)] font-[Hanken_Grotesk]">
                      {coverLetterFormat === 'short'
                        ? (result?.coverLetterShort || result?.coverLetter || '')
                        : (result?.coverLetterFormal || result?.coverLetterShort || result?.coverLetter || '')}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={copyCoverLetter} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-deep)]">Copiar al portapapeles</button>
                      <button type="button" onClick={() => { downloadFile('txt'); trackEvent('cover_letter_download', { format: coverLetterFormat }); }} className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-xs font-bold text-[var(--color-ink)] hover:border-[var(--color-primary)]">Descargar TXT</button>
                    </div>
                    <p className="mt-2 text-xs text-[var(--color-ink-soft)]">{coverLetterFormat === 'short' ? 'Ideal para LinkedIn, chat o portales con campo de texto corto.' : 'Ideal para email formal o formularios que piden carta adjunta.'}</p>
                  </section>
                ) : null}

                <details className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-white [&>summary::-webkit-details-marker]:hidden">
                  <summary style={{ listStyle: 'none' }} className="cursor-pointer list-none px-5 py-4 font-semibold text-[var(--color-ink)] [&::-webkit-details-marker]:hidden">Ver qué cambiamos y por qué</summary>
                  <div className="border-t border-[var(--color-line)] p-5"><ChangeSection result={result} cv={cvForActions} /></div>
                </details>

                {editorOpen && (
                  <section id="cv-editor" className="rounded-xl border border-[var(--color-line)] bg-white p-5 shadow-sm">
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

                <p className="mx-auto max-w-2xl text-center text-sm leading-6 text-[var(--color-ink-soft)]">No inventamos empleadores, cargos ni métricas. <strong className="text-[var(--color-ink)]">Tú tienes la última palabra antes de descargar.</strong></p>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </main>
  )
}
