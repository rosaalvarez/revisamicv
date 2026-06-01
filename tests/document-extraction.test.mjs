import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getDocumentKind,
  validateDocumentFile,
  cleanExtractedText,
  MAX_DOCUMENT_BYTES,
} from '../src/lib/document-extraction.js'

test('getDocumentKind detects supported extensions and mime types', () => {
  assert.equal(getDocumentKind({ name: 'resume.pdf', type: 'application/pdf' }), 'pdf')
  assert.equal(getDocumentKind({ name: 'resume.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), 'docx')
  assert.equal(getDocumentKind({ name: 'resume.txt', type: 'text/plain' }), 'txt')
  assert.equal(getDocumentKind({ name: 'resume', type: 'application/pdf' }), 'pdf')
  assert.equal(getDocumentKind({ name: 'resume.pages', type: '' }), 'unsupported')
})

test('validateDocumentFile rejects missing, too large, and unsupported files', () => {
  assert.deepEqual(validateDocumentFile(null), { ok: false, error: 'Sube tu CV en PDF, Word o TXT.' })
  assert.deepEqual(validateDocumentFile({ name: 'big.pdf', size: MAX_DOCUMENT_BYTES + 1, type: 'application/pdf' }), {
    ok: false,
    error: 'El archivo pesa demasiado. Sube un CV de máximo 8 MB.',
  })
  assert.deepEqual(validateDocumentFile({ name: 'cv.pages', size: 10, type: '' }), {
    ok: false,
    error: 'Formato no soportado. Sube tu CV en PDF, Word (.docx) o TXT.',
  })
  assert.deepEqual(validateDocumentFile({ name: 'cv.pdf', size: 10, type: 'application/pdf' }), { ok: true })
})

test('cleanExtractedText removes noisy whitespace and browser print artifacts', () => {
  const input = '  ROSA   ÁLVAREZ\n\n\nfile:///Users/test/cv.html\n1/3\nProduct    Manager  '
  assert.equal(cleanExtractedText(input), 'ROSA ÁLVAREZ\nProduct Manager')
})
