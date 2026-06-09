import { NextRequest } from 'next/server'
import { optimizedCvToPlainText } from '@/lib/cv-formatters'
import { hasMeaningfulCvContent, sanitizePdfFilename } from '@/lib/pdf-generator'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    if (!payload?.optimizedCV || !hasMeaningfulCvContent(payload.optimizedCV)) {
      return Response.json({ error: 'CV content is empty or incomplete. Please answer the clarification questions before downloading.' }, { status: 400 })
    }

    const text = optimizedCvToPlainText(payload.optimizedCV, payload.outputLanguage)
    const filename = sanitizePdfFilename(payload.optimizedCV?.candidateName || payload.optimizedCV?.name || payload.optimizedCV?.headline || 'cv-revisamicv').replace(/\.pdf$/, '.txt')

    return new Response(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    console.error('TXT generation error:', error)
    return Response.json(
      { error: error.message || 'Error generating TXT' },
      { status: 500 }
    )
  }
}
