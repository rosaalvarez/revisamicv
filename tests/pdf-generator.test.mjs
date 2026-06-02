import assert from 'node:assert/strict'
import test from 'node:test'

import { generateCvPdfBuffer, sanitizePdfFilename } from '../src/lib/pdf-generator.js'

async function extractPdfText(buffer) {
  await import('pdf-parse/worker')
  const { PDFParse } = await import('pdf-parse')
  const parser = new PDFParse({ data: buffer })
  try {
    const result = await parser.getText()
    return result.text
  } finally {
    await parser.destroy()
  }
}

test('sanitizePdfFilename creates safe pdf names', () => {
  assert.equal(sanitizePdfFilename('Rosa Álvarez Product Manager!'), 'rosa-alvarez-product-manager.pdf')
  assert.equal(sanitizePdfFilename(''), 'optimized-cv.pdf')
})

test('generateCvPdfBuffer returns a valid PDF buffer', async () => {
  const buffer = await generateCvPdfBuffer({
    outputLanguage: 'english',
    optimizedCV: {
      headline: 'AI-First Product Manager',
      summary: 'Product professional with AI automation and UX research experience.',
      coreCompetencies: ['Product Management', 'UX Research', 'AI Automation'],
      experience: [
        {
          title: 'AI Automation Specialist',
          company: 'Independent',
          dates: '2024 - Present',
          bullets: ['Built agentic workflows for business operations.'],
        },
      ],
    },
  })

  assert.ok(buffer.length > 1000)
  assert.equal(buffer.subarray(0, 4).toString(), '%PDF')
})

test('generateCvPdfBuffer renders a complete ATS resume structure', async () => {
  const buffer = await generateCvPdfBuffer({
    outputLanguage: 'english',
    optimizedCV: {
      candidateName: 'Rosa Alvarez',
      contact: {
        email: 'rosa@example.com',
        phone: '+57 300 000 0000',
        location: 'Bogota, Colombia',
        linkedin: 'linkedin.com/in/rosaalvarez',
      },
      targetTitle: 'Product Manager',
      summary: 'Product manager focused on SaaS, AI automation, UX research, and measurable product outcomes.',
      coreCompetencies: ['Product Strategy', 'User Research', 'Roadmap Prioritization'],
      technicalSkills: ['SQL', 'Analytics', 'Experiment Design'],
      tools: ['Jira', 'Figma', 'Notion'],
      experience: [
        {
          title: 'Product Manager',
          company: 'Independent SaaS Projects',
          location: 'Remote',
          dates: '2024 - Present',
          techStack: ['React 18', 'Typescript 5'],
          tools: ['Figma'],
          bullets: ['Launched AI document workflows for customer acquisition and activation.'],
        },
      ],
      education: ['Systems Engineering, Universidad del Magdalena'],
      certifications: ['Scrum Product Owner'],
      languages: ['Spanish Native', 'English Professional Working Proficiency'],
    },
  })

  const text = await extractPdfText(buffer)
  assert.match(text, /Rosa Alvarez/i)
  assert.match(text, /rosa@example\.com/i)
  assert.match(text, /Product Manager/i)
  assert.match(text, /Professional Summary/i)
  assert.match(text, /Skills/i)
  assert.match(text, /Technical Skills/i)
  assert.match(text, /Professional Experience/i)
  assert.match(text, /Tech Stack/i)
  assert.match(text, /React 18/i)
  assert.match(text, /Education/i)
  assert.match(text, /Certifications/i)
  assert.match(text, /Tools/i)
  assert.match(text, /Languages/i)
  assert.match(text, /Jira/i)
  assert.match(text, /Spanish Native/i)
})
