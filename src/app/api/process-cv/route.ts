import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { buildOptimizerSystemPrompt, getCompatibilityBand, normalizeOutputLanguage } from '@/lib/cv-rules'
import { extractDocumentText } from '@/lib/document-extraction'
import { canGenerateCv, consumeCvCredit } from '@/lib/token-service'
import { saveCvHistory } from '@/lib/history-service'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

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
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    if (!cvText?.trim()) {
      return NextResponse.json({ error: 'CV content is required' }, { status: 400 })
    }
    if (!jobDescription?.trim()) {
      return NextResponse.json({ error: 'Job description is required' }, { status: 400 })
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
          message: 'No pude validar tus tokens en este momento. Intenta de nuevo en unos minutos.',
          tokens_remaining: 0,
        },
        { status: 503 }
      )
    }

    if (!tokenCheck.allowed) {
      return NextResponse.json(
        {
          error: tokenCheck.reason,
          message: 'No tienes CVs disponibles. Compra más tokens para continuar.',
          tokens_remaining: 0,
        },
        { status: 402 }
      )
    }

    // Process CV with OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildOptimizerSystemPrompt(outputLanguage) },
        {
          role: 'user',
          content: `Real CV text:\n\n${cvText.substring(0, 10000)}\n\n---\n\nTarget job vacancy:\n\n${jobDescription.substring(0, 6000)}\n\n---\n\nSelected final CV language: ${outputLanguage}`,
        },
      ],
      temperature: 0.35,
      max_tokens: 3500,
    })

    const rawText =
      completion.choices[0]?.message?.content || '{"fitVerdict":"Error generating CV. Please try again."}'

    let parsed: any
    try {
      parsed = JSON.parse(rawText)
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
          message: 'Tu CV fue generado, pero no pude actualizar tus tokens. Intenta de nuevo o contáctanos.',
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

    return NextResponse.json({
      ...parsed,
      compatibilityScore,
      compatibilityBand: band,
      outputLanguage,
      tokens_remaining: finalTokenState.tokens_remaining,
    })
  } catch (error: any) {
    console.error('CV processing error:', error)
    return NextResponse.json(
      { error: error.message || 'Error processing CV' },
      { status: 500 }
    )
  }
}