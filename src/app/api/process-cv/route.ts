import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { buildOptimizerSystemPrompt, getCompatibilityBand, normalizeOutputLanguage } from '@/lib/cv-rules'
import { extractDocumentText } from '@/lib/document-extraction'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkAndConsumeToken(email: string): Promise<{
  allowed: boolean
  tokens_remaining: number
  error?: string
}> {
  try {
    const normalizedEmail = email.toLowerCase().trim()

    // Find user — no pedimos free_used aún porque puede no existir
    const { data: user, error: queryError } = await supabaseAdmin
      .from('users')
      .select('id, tokens')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (queryError) {
      console.error('Supabase query error:', queryError)
      return { allowed: false, tokens_remaining: 0, error: 'db_error' }
    }

    // New user: create and allow free CV
    if (!user) {
      try {
        await supabaseAdmin.from('users').insert({
          email: normalizedEmail,
          tokens: 0,
        })
      } catch (insertErr: any) {
        // Si falla el insert, es probablemente falta de permisos en Supabase
        console.error('Cannot insert user:', insertErr?.message || insertErr)
        // Permitir el CV igual (modo degraded — no tracking)
        return { allowed: true, tokens_remaining: 0 }
      }
      // Tenta setear free_used; si la columna no existe, falla silenciosamente
      try {
        await supabaseAdmin
          .from('users')
          .update({ free_used: true })
          .eq('email', normalizedEmail)
      } catch {
        console.warn('free_used column may not exist yet — run migration')
      }
      return { allowed: true, tokens_remaining: 0 }
    }

    // Check free_used (maneja el caso donde la columna no existe)
    let freeUsed = false
    try {
      const { data: check } = await supabaseAdmin
        .from('users')
        .select('free_used')
        .eq('id', user.id)
        .maybeSingle()
      freeUsed = check ? !!check.free_used : false
    } catch {
      // Columna no existe → tratar como primer uso gratis
      console.warn('free_used column missing — treating as free tier')
    }

    // Free CV still available
    if (!freeUsed) {
      try {
        await supabaseAdmin
          .from('users')
          .update({ free_used: true })
          .eq('id', user.id)
      } catch { /* columna no existe */ }
      return { allowed: true, tokens_remaining: user.tokens ?? 0 }
    }

    // No tokens left
    if ((user.tokens ?? 0) <= 0) {
      return {
        allowed: false,
        tokens_remaining: 0,
        error: 'no_tokens',
      }
    }

    // Deduct token
    const newTokens = (user.tokens ?? 1) - 1
    try {
      await supabaseAdmin
        .from('users')
        .update({ tokens: newTokens })
        .eq('id', user.id)
    } catch (updateErr: any) {
      console.error('Cannot deduct token:', updateErr?.message || updateErr)
    }

    return { allowed: true, tokens_remaining: newTokens }
  } catch (err) {
    console.error('Token check error:', err)
    return { allowed: false, tokens_remaining: 0, error: 'db_error' }
  }
}

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

    // Token control
    const tokenCheck = await checkAndConsumeToken(email)
    if (!tokenCheck.allowed) {
      return NextResponse.json(
        {
          error: tokenCheck.error,
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

    return NextResponse.json({
      ...parsed,
      compatibilityScore,
      compatibilityBand: band,
      outputLanguage,
      tokens_remaining: tokenCheck.tokens_remaining,
    })
  } catch (error: any) {
    console.error('CV processing error:', error)
    return NextResponse.json(
      { error: error.message || 'Error processing CV' },
      { status: 500 }
    )
  }
}