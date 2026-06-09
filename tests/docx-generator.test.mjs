import test from 'node:test'
import assert from 'node:assert/strict'
import mammoth from 'mammoth'
import { generateCvDocxBuffer, sanitizeDocxFilename } from '../src/lib/docx-generator.js'

test('sanitizeDocxFilename creates safe docx names', () => {
  assert.equal(sanitizeDocxFilename('Ana Pérez / CV'), 'ana-perez-cv.docx')
})

test('generateCvDocxBuffer blocks empty CV content instead of producing an empty DOCX', async () => {
  await assert.rejects(
    () => generateCvDocxBuffer({ optimizedCV: {}, outputLanguage: 'spanish' }),
    /empty or incomplete/i
  )
})

test('generateCvDocxBuffer returns a docx zip buffer', async () => {
  const buffer = await generateCvDocxBuffer({
    optimizedCV: {
      candidateName: 'Ana Pérez',
      contact: { email: 'ana@test.com' },
      summary: 'Perfil fuerte.',
      skills: ['CRM'],
    },
    outputLanguage: 'spanish',
  })

  assert.ok(Buffer.isBuffer(buffer))
  assert.ok(buffer.length > 1000)
  assert.equal(buffer.subarray(0, 2).toString(), 'PK')
})

test('generateCvDocxBuffer preserves featured projects with traction metrics', async () => {
  const buffer = await generateCvDocxBuffer({
    outputLanguage: 'english',
    optimizedCV: {
      candidateName: 'Alex Rivera',
      targetTitle: 'Frontend Engineer',
      featuredProjects: [{
        name: 'PixelKit',
        description: 'Prototyping tool',
        role: 'Co-founder',
        dates: '2020',
        bullets: ['Reached #1 Product Hunt product of the day and secured USD 15,000 in seed capital.'],
      }],
    },
  })

  const result = await mammoth.extractRawText({ buffer })
  assert.match(result.value, /FEATURED PROJECTS/i)
  assert.match(result.value, /PixelKit/i)
  assert.match(result.value, /#1 Product Hunt/i)
  assert.match(result.value, /USD 15,000 in seed capital/i)
})
