import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const cvFile = formData.get('cv') as File
    const jobDescription = formData.get('jobDescription') as string

    if (!cvFile) return NextResponse.json({ error: 'CV file is required' }, { status: 400 })
    if (!jobDescription) return NextResponse.json({ error: 'Job description is required' }, { status: 400 })

    // Extract text from the CV file
    let cvText = ''
    try {
      cvText = await cvFile.text()
    } catch {
      // If it's a binary file (PDF/DOCX), we can't read it directly
      return NextResponse.json({
        error:
          'Formato de archivo no soportado directamente. Por favor, copia y pega el texto de tu CV en un archivo .txt y súbelo de nuevo.',
      }, { status: 400 })
    }

    if (!cvText.trim()) {
      return NextResponse.json({ error: 'CV file is empty' }, { status: 400 })
    }

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

    const optimizedCV = completion.choices[0]?.message?.content || 'Error generating CV. Please try again.'

    return NextResponse.json({ optimizedCV })
  } catch (error: any) {
    console.error('CV processing error:', error)
    return NextResponse.json(
      { error: error.message || 'Error processing CV' },
      { status: 500 }
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}