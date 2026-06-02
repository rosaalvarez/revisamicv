import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { buildRevisionSystemPrompt, normalizeOutputLanguage } from '@/lib/cv-rules'

export const runtime = 'nodejs'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const MAX_INSTRUCTION_LENGTH = 1200

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const optimizedCV = body?.optimizedCV
    const revisionInstruction = String(body?.revisionInstruction || '').trim()
    const outputLanguage = normalizeOutputLanguage(body?.outputLanguage)

    if (!optimizedCV) {
      return NextResponse.json({ error: 'optimizedCV is required' }, { status: 400 })
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildRevisionSystemPrompt(outputLanguage) },
        {
          role: 'user',
          content: JSON.stringify({
            currentOptimizedCV: optimizedCV,
            revisionInstruction,
            outputLanguage,
          }).slice(0, 14000),
        },
      ],
      temperature: 0.2,
      max_tokens: 3200,
    })

    const rawText = completion.choices[0]?.message?.content || '{}'
    let parsed: any
    try {
      parsed = JSON.parse(rawText)
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

    return NextResponse.json({
      optimizedCV: revisedCv,
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
