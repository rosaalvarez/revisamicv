import { NextRequest } from 'next/server'
import { generateCvDocxBuffer, sanitizeDocxFilename } from '@/lib/docx-generator'
import { hasMeaningfulCvContent } from '@/lib/pdf-generator'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    if (!payload?.optimizedCV || !hasMeaningfulCvContent(payload.optimizedCV)) {
      return Response.json({ error: 'CV content is empty or incomplete. Please answer the clarification questions before downloading.' }, { status: 400 })
    }

    const docxBuffer = await generateCvDocxBuffer(payload)
    const filename = sanitizeDocxFilename(payload.optimizedCV?.candidateName || payload.optimizedCV?.name || payload.optimizedCV?.headline || 'cv-revisamicv')

    return new Response(docxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    console.error('DOCX generation error:', error)
    return Response.json(
      { error: error.message || 'Error generating DOCX' },
      { status: 500 }
    )
  }
}
