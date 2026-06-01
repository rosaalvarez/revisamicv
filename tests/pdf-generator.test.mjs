import assert from 'node:assert/strict'
import test from 'node:test'

import { generateCvPdfBuffer, sanitizePdfFilename } from '../src/lib/pdf-generator.js'

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
