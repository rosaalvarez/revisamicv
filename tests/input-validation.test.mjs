import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getFileExtension,
  getFriendlyApiError,
  isValidEmail,
  validateCvFile,
  validateEmail,
  validateJobDescription,
} from '../src/lib/input-validation.js'

test('validates email with user-friendly messages', () => {
  assert.equal(validateEmail(''), 'Escribe tu email para guardar tu prueba gratis y tus tokens.')
  assert.equal(validateEmail('bad-email'), 'Revisa el email. Debe verse como nombre@empresa.com.')
  assert.equal(validateEmail(' ROSA@EXAMPLE.COM '), '')
  assert.equal(isValidEmail('rosa@example.com'), true)
})

test('validates CV file extension and size', () => {
  assert.equal(getFileExtension('cv.final.PDF'), 'pdf')
  assert.equal(validateCvFile(null), 'Sube tu CV en PDF, Word (.docx) o TXT.')
  assert.equal(validateCvFile({ name: 'cv.png', size: 100 }), 'Formato no soportado. Sube PDF, Word .docx o TXT. Evita .doc viejo o imágenes.')
  assert.equal(validateCvFile({ name: 'cv.pdf', size: 9 * 1024 * 1024 }), 'El archivo pesa más de 8 MB. Exporta una versión más liviana en PDF o Word.')
  assert.equal(validateCvFile({ name: 'cv.docx', size: 100 }), '')
})

test('validates job description length', () => {
  assert.equal(validateJobDescription(''), 'Pega la vacante completa para poder calcular compatibilidad.')
  assert.equal(validateJobDescription('too short'), 'La vacante está muy corta. Pega responsabilidades, requisitos y skills para que el score sea útil.')
  assert.equal(validateJobDescription('Product Manager '.repeat(20)), '')
})

test('maps known API errors to friendly copy', () => {
  assert.equal(getFriendlyApiError('no_tokens'), 'No tienes CVs disponibles. Compra más tokens para continuar.')
  assert.equal(getFriendlyApiError('custom error'), 'custom error')
})
