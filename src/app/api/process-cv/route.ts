import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildOptimizerSystemPrompt, getCompatibilityBand, normalizeOutputLanguage } from '@/lib/cv-rules'
import { validateCvText, validateEmail, validateJobDescription } from '@/lib/input-validation'
import { extractDocumentText } from '@/lib/document-extraction'
import { canGenerateCv, consumeCvCredit } from '@/lib/token-service'
import { saveCvHistory } from '@/lib/history-service'
import { createJsonCompletion } from '@/lib/llm-client'
import { runMatchingEngineV2 } from '@/lib/matching-engine'
import {
  selectFilteredEvidence,
  buildCoverLetterSystemPrompt,
  buildCoverLetterUserPrompt,
  validateCoverLetterOutput,
  buildCoverLettersFromTemplate,
} from '@/lib/cover-letter'
import { sendAnalysisReadyEmail } from '@/lib/email-service'
import { createAuthToken, createMagicDashboardLink } from '@/lib/auth-token'
import { enforceRateLimits, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Support both JSON and FormData
    const contentType = req.headers.get('content-type') || ''

    let email: string
    let cvText: string
    let jobDescription: string
    let outputLanguage: 'english' | 'spanish'

    if (contentType.includes('application/json')) {
      const body = await req.json()
      email = body.email
      cvText = body.cv_text
      jobDescription = body.job_description
      outputLanguage = normalizeOutputLanguage(body.outputLanguage || body.output_language)
    } else {
      const formData = await req.formData()
      const file = formData.get('cv') as File
      const jobFile = formData.get('jobFile') as File | null
      email = (formData.get('email') as string) || ''
      jobDescription = (formData.get('jobDescription') as string) || ''
      outputLanguage = normalizeOutputLanguage(formData.get('outputLanguage'))

      if (!file) {
        return NextResponse.json({ error: 'CV file is required' }, { status: 400 })
      }

      try {
        cvText = await extractDocumentText(file)
      } catch (err: any) {
        return NextResponse.json({
          error: 'document_extraction_failed',
          message: err.message || 'No pude leer el CV. Prueba con PDF, Word (.docx), TXT o pega el texto manualmente.',
        }, { status: 400 })
      }

      if (jobFile && Number(jobFile.size || 0) > 0) {
        try {
          const extractedJob = await extractDocumentText(jobFile)
          jobDescription = [jobDescription, extractedJob].map((part) => String(part || '').trim()).filter(Boolean).join('\n\n')
        } catch (err: any) {
          return NextResponse.json({
            error: 'job_document_extraction_failed',
            message: err.message || 'No pude leer el archivo de la vacante. Prueba con PDF de texto, Word (.docx), TXT o pega el texto manualmente.',
          }, { status: 400 })
        }
      }
    }

    const emailError = validateEmail(email)
    if (emailError) {
      return NextResponse.json({ error: 'invalid_email', message: emailError }, { status: 400 })
    }
    const cvError = validateCvText(cvText)
    if (cvError) {
      return NextResponse.json({ error: 'invalid_cv_text', message: cvError }, { status: 400 })
    }
    const jobError = validateJobDescription(jobDescription)
    if (jobError) {
      return NextResponse.json({ error: 'invalid_job_description', message: jobError }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const limitCheck = await enforceRateLimits(supabaseAdmin, [
      { scope: 'process_cv_email', identifier: normalizedEmail, limit: 10, windowSeconds: 3600 },
      { scope: 'process_cv_ip', identifier: getClientIp(req), limit: 30, windowSeconds: 3600 },
    ])
    if (!limitCheck.allowed) {
      const limited = rateLimitResponse('Demasiados análisis en poco tiempo. Intenta de nuevo más tarde o escribe a soporte@revisamicv.lat.', {
        resetSeconds: limitCheck.result?.resetSeconds,
      })
      return NextResponse.json(limited.body, { status: limited.status })
    }

    // Token pre-check. We only consume after OpenAI succeeds, so failed generations do not burn credits.
    let tokenCheck
    try {
      tokenCheck = await canGenerateCv(supabaseAdmin, email)
    } catch (err: any) {
      console.error('Token pre-check error:', err?.message || err)
      return NextResponse.json(
        {
          error: 'db_error',
          message: 'No pude validar tus créditos en este momento. Intenta de nuevo en unos minutos.',
          tokens_remaining: 0,
        },
        { status: 503 }
      )
    }

    if (!tokenCheck.allowed) {
      return NextResponse.json(
        {
          error: tokenCheck.reason,
          message: 'No tienes créditos disponibles. Compra más análisis para continuar.',
          tokens_remaining: 0,
        },
        { status: 402 }
      )
    }

    let parsed: any
    let compatibilityScore = 0
    let band: ReturnType<typeof getCompatibilityBand>
    try {
      parsed = await runMatchingEngineV2({
        cvText,
        jobDescription,
        outputLanguage,
        createJsonCompletion,
        buildOptimizerSystemPrompt,
      })
      compatibilityScore = Number(parsed.adapted_score ?? parsed.compatibilityScore ?? 0)
      band = getCompatibilityBand(compatibilityScore)
    } catch (err: any) {
      if (err?.code === 'generated_cv_invalid' || err?.message === 'generated_cv_invalid') {
        return NextResponse.json(
          {
            error: 'generated_cv_invalid',
            message: 'No pude generar un CV completo y seguro con esta información. No se consumió ningún crédito. Intenta pegar una versión más completa del CV o de la vacante.',
            tokens_remaining: tokenCheck.tokens_remaining,
          },
          { status: 502 }
        )
      }
      throw err
    }

    let finalTokenState = tokenCheck
    try {
      finalTokenState = await consumeCvCredit(supabaseAdmin, email)
    } catch (err: any) {
      console.error('Token consume error:', err?.message || err)
      return NextResponse.json(
        {
          error: 'db_error',
          message: 'Tu CV fue generado, pero no pude actualizar tus créditos. Intenta de nuevo o contáctanos.',
          ...parsed,
          compatibilityScore,
          compatibilityBand: band,
          outputLanguage,
          tokens_remaining: tokenCheck.tokens_remaining,
        },
        { status: 503 }
      )
    }

    try {
      await saveCvHistory(supabaseAdmin, {
        email,
        cvText,
        jobDescription,
        optimizedCv: parsed.optimizedCV || parsed,
        compatibilityScore,
        outputLanguage,
        vacancyTitle: parsed.vacancy_title,
        requirementsTable: parsed.requirements_table,
        originalMatchResults: parsed.original_match_results,
        adaptedMatchResults: parsed.adapted_match_results,
        originalScore: parsed.original_score,
        adaptedScore: parsed.adapted_score,
        scoreBreakdown: parsed.score_breakdown,
        llmModel: parsed.llm_model,
      })
    } catch (err: any) {
      console.error('History save error:', err?.message || err)
    }

    try {
      await sendAnalysisReadyEmail(email.trim().toLowerCase(), compatibilityScore)
    } catch (err: any) {
      console.error('Analysis email error:', err?.message || err)
    }

    const dashboardAuthToken = createAuthToken(normalizedEmail)
    const dashboardUrl = createMagicDashboardLink(normalizedEmail)

    // ── Phase 3: Cover Letter (LLM writer with template fallback) ──
    const evidence = selectFilteredEvidence(
      parsed.adapted_match_results || parsed.original_match_results || [],
      parsed.requirements_table || [],
    )
    const candidateName = String(parsed.optimizedCV?.candidateName || parsed.optimizedCV?.name || '').trim()
    const candidateRole = String(parsed.optimizedCV?.targetTitle || parsed.optimizedCV?.headline || '').trim()

    let coverLetterShort = ''
    let coverLetterFormal = ''

    if (evidence.short.length > 0 || evidence.formal.length > 0) {
      try {
        const llmResult = await createJsonCompletion(
          buildCoverLetterSystemPrompt(outputLanguage),
          buildCoverLetterUserPrompt({
            candidateName,
            candidateRole,
            evidenceList: evidence.formal,
            language: outputLanguage,
          }),
          { task: 'cv_revision', temperature: 0.15, maxTokens: 1200 },
        )
        const parsedCL = JSON.parse(llmResult.text)
        coverLetterShort = String(parsedCL.shortMessage || '').trim()
        coverLetterFormal = String(parsedCL.formalLetter || '').trim()

        // Validate: output must only reference allowed requirements
        const validation = validateCoverLetterOutput(
          coverLetterShort + '\n' + coverLetterFormal,
          evidence.allIds,
          parsed.requirements_table || [],
        )
        if (!validation.valid) {
          console.warn('Cover letter validation failed — falling back to template:', validation.violations)
          coverLetterShort = ''
          coverLetterFormal = ''
        }
      } catch (err: any) {
        console.warn('Cover letter LLM call failed — falling back to template:', err?.message || err)
        coverLetterShort = ''
        coverLetterFormal = ''
      }
    }

    // Fallback to template if LLM produced nothing — only when evidence exists
    if (!coverLetterShort && !coverLetterFormal && evidence.allIds.size > 0) {
      const template = buildCoverLettersFromTemplate({
        matchResults: parsed.adapted_match_results || parsed.original_match_results || [],
        requirementsTable: parsed.requirements_table || [],
        optimizedCV: parsed.optimizedCV || parsed,
        language: outputLanguage,
      })
      coverLetterShort = template.shortMessage
      coverLetterFormal = template.formalLetter
    }

    return NextResponse.json({
      ...parsed,
      compatibilityScore,
      compatibilityBand: band,
      outputLanguage,
      tokens_remaining: finalTokenState.tokens_remaining,
      email_sent: true,
      auth_token: dashboardAuthToken,
      dashboard_url: dashboardUrl,
      coverLetterShort,
      coverLetterFormal,
    })
  } catch (error: any) {
    console.error('CV processing error:', error)
    return NextResponse.json(
      { error: 'processing_error', message: 'No pude completar el análisis en este momento. Intenta de nuevo en unos minutos.' },
      { status: 500 }
    )
  }
}