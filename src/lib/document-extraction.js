import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024
const MIN_EXTRACTED_CHARS = 120

const PDF_MIME_TYPES = new Set(['application/pdf'])
const DOCX_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
])
const TXT_MIME_TYPES = new Set(['text/plain', 'text/markdown'])

/**
 * @param {{ name?: string, type?: string } | null | undefined} file
 * @returns {'pdf' | 'docx' | 'txt' | 'unsupported'}
 */
export function getDocumentKind(file) {
  if (!file) return 'unsupported'
  const name = String(file.name || '').toLowerCase()
  const type = String(file.type || '').toLowerCase()

  if (name.endsWith('.pdf') || PDF_MIME_TYPES.has(type)) return 'pdf'
  if (name.endsWith('.docx') || name.endsWith('.doc') || DOCX_MIME_TYPES.has(type)) return 'docx'
  if (name.endsWith('.txt') || name.endsWith('.md') || TXT_MIME_TYPES.has(type)) return 'txt'

  return 'unsupported'
}

/**
 * @param {{ name?: string, type?: string, size?: number } | null | undefined} file
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validateDocumentFile(file) {
  if (!file) return { ok: false, error: 'Sube tu CV en PDF, Word o TXT.' }
  if (Number(file.size || 0) > MAX_DOCUMENT_BYTES) {
    return { ok: false, error: 'El archivo pesa demasiado. Sube un CV de máximo 8 MB.' }
  }
  if (getDocumentKind(file) === 'unsupported') {
    return { ok: false, error: 'Formato no soportado. Sube tu CV en PDF, Word (.docx) o TXT.' }
  }
  return { ok: true }
}

/**
 * @param {string} text
 * @returns {string}
 */
export function cleanExtractedText(text) {
  return String(text || '')
    .replace(/\r/g, '\n')
    .replace(/file:\/\/\/[^\n]+/gi, '')
    .replace(/^\s*\d+\s*\/\s*\d+\s*$/gm, '')
    .replace(/\t/g, ' ')
    .replace(/[ \u00A0]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
    .trim()
}

/**
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractDocumentText(file) {
  const validation = validateDocumentFile(file)
  if (!validation.ok) throw new Error(validation.error)

  const kind = getDocumentKind(file)
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  let text = ''

  if (kind === 'txt') {
    text = await file.text()
  }

  if (kind === 'pdf') {
    const { PDFParse } = require('pdf-parse')
    const parser = new PDFParse({ data: buffer })
    try {
      const result = await parser.getText()
      text = result.text || ''
    } finally {
      await parser.destroy()
    }
  }

  if (kind === 'docx') {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    text = result.value || ''
  }

  const cleaned = cleanExtractedText(text)
  if (cleaned.length < MIN_EXTRACTED_CHARS) {
    throw new Error('No pude extraer suficiente texto del CV. Prueba con otro archivo o pega el texto manualmente.')
  }

  return cleaned
}
