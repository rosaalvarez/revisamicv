import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CV_PROMPT = `You are an expert ATS (Applicant Tracking System) optimization specialist and professional CV writer. Your job is to take a CV written in Spanish and a job description, and produce an optimized CV in English tailored specifically for that position.

Follow these rules strictly:
1. Rewrite the CV ENTIRELY in professional English.
2. Extract keywords, skills, and requirements from the job description and naturally incorporate them into the CV.
3. Reformat the CV to pass ATS filters: use standard headings (Professional Summary, Work Experience, Education, Skills), avoid tables/images/columns, use standard fonts, include relevant keywords exactly as they appear in the job description.
4. Quantify achievements where possible. If the original says "managed a team", rewrite as "Led a team of 5 engineers, delivering 3 major releases on time".
5. Remove irrelevant experience that doesn't match the job description.
6. Add a "Core Competencies" section with 6-8 keywords pulled directly from the job description.
7. Include a brief note at the top explaining the top 3 improvements made and why they matter for ATS.
8. Format the output as a clean, professional CV ready to submit. Use markdown-style formatting for headers.
9. Do NOT mention this optimization or the tool in the final CV. The CV should look naturally written.
10. Keep it to one page equivalent of content (around 500-700 words).`

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
      await supabaseAdmin.from('users').insert({
        email: normalizedEmail,
        tokens: 0,
      })
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
    await supabaseAdmin
      .from('users')
      .update({ tokens: newTokens })
      .eq('id', user.id)

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

    if (contentType.includes('application/json')) {
      const body = await req.json()
      email = body.email
      cvText = body.cv_text
      jobDescription = body.job_description
    } else {
      const formData = await req.formData()
      const file = formData.get('cv') as File
      email = (formData.get('email') as string) || ''
      jobDescription = (formData.get('jobDescription') as string) || ''

      if (!file) {
        return NextResponse.json({ error: 'CV file is required' }, { status: 400 })
      }

      try {
        cvText = await file.text()
      } catch {
        return NextResponse.json({
          error: 'Formato de archivo no soportado directamente. Por favor, copia y pega el texto de tu CV en un archivo .txt y súbelo de nuevo.',
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
      messages: [
        { role: 'system', content: CV_PROMPT },
        {
          role: 'user',
          content: `Original CV (Spanish):\n\n${cvText.substring(0, 8000)}\n\n---\n\nJob Description:\n\n${jobDescription.substring(0, 4000)}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 2000,
    })

    const optimizedCV =
      completion.choices[0]?.message?.content || 'Error generating CV. Please try again.'

    return NextResponse.json({
      optimizedCV,
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