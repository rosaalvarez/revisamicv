import test from 'node:test'
import assert from 'node:assert/strict'
import { generateCvDocxBuffer, sanitizeDocxFilename } from '../src/lib/docx-generator.js'

test('sanitizeDocxFilename creates safe docx names', () => {
  assert.equal(sanitizeDocxFilename('Ana Pérez / CV'), 'ana-perez-cv.docx')
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
