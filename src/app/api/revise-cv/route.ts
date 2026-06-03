import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildRevisionSystemPrompt, normalizeOutputLanguage } from '@/lib/cv-rules'
import { validateEmail } from '@/lib/input-validation'
import { getUserTokenState } from '@/lib/token-service'
import { createJsonCompletion } from '@/lib/llm-client'
import { parseJsonCompletion } from '@/lib/json-completion'

export const runtime = 'nodejs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const MAX_INSTRUCTION_LENGTH = 1200
const MAX_OPTIMIZED_CV_CHARS = 12000

function normalizeScore(value: unknown) {
  const score = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(score)) return undefined
  return Math.max(0, Math.min(100, Math.round(score)))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const optimizedCV = body?.optimizedCV
    const revisionInstruction = String(body?.revisionInstruction || '').trim()
    const email = String(body?.email || '').trim().toLowerCase()
    const outputLanguage = normalizeOutputLanguage(body?.outputLanguage)

    const emailError = validateEmail(email)
    if (emailError) {
      return NextResponse.json({ error: 'invalid_email', message: emailError }, { status: 400 })
    }

    let userState
    try {
      userState = await getUserTokenState(supabaseAdmin, email)
    } catch (err: any) {
      console.error('Revision user check error:', err?.message || err)
      return NextResponse.json(
        { error: 'db_error', message: 'No pude validar tu usuario para aplicar el ajuste. Intenta de nuevo en unos minutos.' },
        { status: 503 }
      )
    }

    if (!userState.exists || (!userState.free_used && userState.tokens <= 0)) {
      return NextResponse.json(
        { error: 'revision_not_allowed', message: 'Primero genera un CV desde la app antes de pedir ajustes con IA.' },
        { status: 403 }
      )
    }

    if (!optimizedCV) {
      return NextResponse.json({ error: 'optimizedCV is required' }, { status: 400 })
    }

    const optimizedCvJson = JSON.stringify(optimizedCV)
    if (optimizedCvJson.length > MAX_OPTIMIZED_CV_CHARS) {
      return NextResponse.json(
        {
          error: 'optimizedCV is too large',
          message: 'El CV es muy largo para aplicar ajustes automáticos. Edita los campos manualmente o descarga el DOCX.',
        },
        { status: 400 }
      )
    }

    if (!revisionInstruction) {
      return NextResponse.json({ error: 'revisionInstruction is required' }, { status: 400 })
    }

    if (revisionInstruction.length > MAX_INSTRUCTION_LENGTH) {
      return NextResponse.json(
        {
          error: 'revisionInstruction is too long',
          message: 'El ajuste es muy largo. Escríbelo en máximo 1.200 caracteres.',
        },
        { status: 400 }
      )
    }

    const userPrompt = JSON.stringify({
      revisionInstruction,
      outputLanguage,
      currentOptimizedCV: optimizedCV,
      analysisContext: {
        jobDescription: String(body?.jobDescription || '').slice(0, 5000),
        currentCompatibilityScore: normalizeScore(body?.currentCompatibilityScore),
        matchBreakdown: body?.matchBreakdown || null,
        gaps: Array.isArray(body?.gaps) ? body.gaps.slice(0, 12) : [],
        keywordsToInclude: Array.isArray(body?.keywordsToInclude) ? body.keywordsToInclude.slice(0, 20) : [],
        honestyWarnings: Array.isArray(body?.honestyWarnings) ? body.honestyWarnings.slice(0, 12) : [],
        applicationDecision: body?.applicationDecision || null,
      },
    })

    const completion = await createJsonCompletion(
      buildRevisionSystemPrompt(outputLanguage),
      userPrompt,
      { task: 'cv_revision', temperature: 0.2, maxTokens: 4200 }
    )

    const rawText = completion.text || '{}'
    let parsed: any
    try {
      parsed = parseJsonCompletion(rawText)
    } catch {
      return NextResponse.json(
        { error: 'invalid_ai_response', message: 'No pude aplicar el ajuste. Intenta escribirlo más específico.' },
        { status: 502 }
      )
    }

    const revisedCv = parsed.optimizedCV || parsed
    if (!revisedCv || typeof revisedCv !== 'object') {
      return NextResponse.json(
        { error: 'invalid_ai_response', message: 'No pude aplicar el ajuste. Intenta de nuevo.' },
        { status: 502 }
      )
    }

    const revisedScore = normalizeScore(parsed.revisedCompatibilityScore)

    return NextResponse.json({
      optimizedCV: revisedCv,
      revisedCompatibilityScore: revisedScore,
      revisionScoreExplanation: typeof parsed.revisionScoreExplanation === 'string' ? parsed.revisionScoreExplanation : '',
      revisionNotes: Array.isArray(parsed.revisionNotes) ? parsed.revisionNotes : [],
      blockedChanges: Array.isArray(parsed.blockedChanges) ? parsed.blockedChanges : [],
    })
  } catch (error: any) {
    console.error('CV revision error:', error)
    return NextResponse.json(
      { error: error.message || 'Error revising CV' },
      { status: 500 }
    )
  }
}
