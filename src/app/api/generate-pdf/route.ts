import { NextRequest } from 'next/server'
import { generateCvPdfBuffer, hasMeaningfulCvContent, sanitizePdfFilename } from '@/lib/pdf-generator'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    if (!payload?.optimizedCV || !hasMeaningfulCvContent(payload.optimizedCV)) {
      return Response.json({ error: 'CV content is empty or incomplete. Please answer the clarification questions before downloading.' }, { status: 400 })
    }

    const pdfBuffer = await generateCvPdfBuffer(payload)
    const filename = sanitizePdfFilename(payload.optimizedCV?.candidateName || payload.optimizedCV?.name || payload.optimizedCV?.headline || 'optimized-cv')

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    console.error('PDF generation error:', error)
    return Response.json(
      { error: error.message || 'Error generating PDF' },
      { status: 500 }
    )
  }
}
