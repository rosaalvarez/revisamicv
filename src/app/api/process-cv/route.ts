import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildOptimizerSystemPrompt, getCompatibilityBand, normalizeOutputLanguage } from '@/lib/cv-rules'
import { validateCvText, validateEmail, validateJobDescription } from '@/lib/input-validation'
import { extractDocumentText } from '@/lib/document-extraction'
import { canGenerateCv, consumeCvCredit } from '@/lib/token-service'
import { saveCvHistory } from '@/lib/history-service'
import { createJsonCompletion } from '@/lib/llm-client'
import { parseJsonCompletion } from '@/lib/json-completion'
import { sendAnalysisReadyEmail } from '@/lib/email-service'
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

    const userPrompt = `Real CV text:\n\n${cvText.substring(0, 10000)}\n\n---\n\nTarget job vacancy:\n\n${jobDescription.substring(0, 6000)}\n\n---\n\nSelected final CV language: ${outputLanguage}`

    const completion = await createJsonCompletion(
      buildOptimizerSystemPrompt(outputLanguage),
      userPrompt,
      { task: 'cv_generation', temperature: 0.25, maxTokens: 6000 }
    )

    const rawText = completion.text || '{"fitVerdict":"Error generating CV. Please try again."}'

    let parsed: any
    try {
      parsed = parseJsonCompletion(rawText)
    } catch {
      parsed = { rawText, optimizedCV: rawText }
    }

    const compatibilityScore = Number(parsed.compatibilityScore ?? 0)
    const band = getCompatibilityBand(compatibilityScore)

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
      })
    } catch (err: any) {
      console.error('History save error:', err?.message || err)
    }

    try {
      await sendAnalysisReadyEmail(email.trim().toLowerCase(), compatibilityScore)
    } catch (err: any) {
      console.error('Analysis email error:', err?.message || err)
    }

    return NextResponse.json({
      ...parsed,
      compatibilityScore,
      compatibilityBand: band,
      outputLanguage,
      tokens_remaining: finalTokenState.tokens_remaining,
      email_sent: true,
    })
  } catch (error: any) {
    console.error('CV processing error:', error)
    return NextResponse.json(
      { error: 'processing_error', message: 'No pude completar el análisis en este momento. Intenta de nuevo en unos minutos.' },
      { status: 500 }
    )
  }
}