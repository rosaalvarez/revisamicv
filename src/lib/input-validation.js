export const MIN_JOB_DESCRIPTION_CHARS = 120
export const MAX_JOB_DESCRIPTION_CHARS = 12000
export const MIN_CV_TEXT_CHARS = 180
export const MAX_CV_TEXT_CHARS = 25000
export const ACCEPTED_CV_EXTENSIONS = ['pdf', 'docx', 'txt']

export function normalizeEmailInput(email) {
  return String(email || '').trim().toLowerCase()
}

export function isValidEmail(email) {
  const normalized = normalizeEmailInput(email)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
}

export function validateEmail(email) {
  if (!normalizeEmailInput(email)) return 'Escribe tu email para guardar tu prueba gratis y tus tokens.'
  if (!isValidEmail(email)) return 'Revisa el email. Debe verse como nombre@empresa.com.'
  return ''
}

export function getFileExtension(fileName) {
  const parts = String(fileName || '').toLowerCase().split('.')
  return parts.length > 1 ? parts.pop() || '' : ''
}

export function validateCvFile(file) {
  if (!file) return 'Sube tu CV en PDF, Word (.docx) o TXT.'

  const extension = getFileExtension(file.name)
  if (!ACCEPTED_CV_EXTENSIONS.includes(extension)) {
    return 'Formato no soportado. Sube PDF, Word .docx o TXT. Evita .doc viejo o imágenes.'
  }

  if (Number(file.size || 0) > 8 * 1024 * 1024) {
    return 'El archivo pesa más de 8 MB. Exporta una versión más liviana en PDF o Word.'
  }

  return ''
}


export function validateCvText(cvText) {
  const text = String(cvText || '').trim()
  if (!text) return 'No pude encontrar texto útil dentro del CV.'
  if (text.length < MIN_CV_TEXT_CHARS) {
    return 'El CV parece demasiado corto para generar una adaptación útil. Sube un CV más completo o pega más experiencia.'
  }
  if (text.length > MAX_CV_TEXT_CHARS) {
    return `El CV es demasiado largo. Deja máximo ${MAX_CV_TEXT_CHARS.toLocaleString()} caracteres o sube una versión más resumida.`
  }
  return ''
}

export function validateJobDescription(jobDescription) {
  const text = String(jobDescription || '').trim()
  if (!text) return 'Pega la vacante completa para poder calcular compatibilidad.'
  if (text.length < MIN_JOB_DESCRIPTION_CHARS) {
    return 'La vacante está muy corta. Pega responsabilidades, requisitos y skills para que el score sea útil.'
  }
  if (text.length > MAX_JOB_DESCRIPTION_CHARS) {
    return `La vacante es demasiado larga. Deja máximo ${MAX_JOB_DESCRIPTION_CHARS.toLocaleString()} caracteres.`
  }
  return ''
}

export function getFriendlyApiError(error, fallback = 'No pude completar la acción. Intenta de nuevo.') {
  const message = String(error || '').trim()
  if (!message) return fallback

  const known = {
    no_tokens: 'No tienes análisis disponibles. Compra más créditos para continuar.',
    invalid_email: 'Revisa el email. Debe verse como nombre@empresa.com.',
    empty_cv: 'No pude encontrar texto útil dentro del CV.',
    invalid_cv_text: 'El CV parece demasiado corto para generar una adaptación útil. Sube un CV más completo o pega más experiencia.',
    invalid_job_description: 'La vacante está incompleta. Pega responsabilidades, requisitos y skills para que el score sea útil.',
    document_extraction_failed: 'No pude leer el archivo. Prueba exportarlo como PDF de texto o Word .docx.',
    db_error: 'No pude validar tu cuenta en este momento. Intenta de nuevo en unos minutos.',
  }

  return known[message] || message
}
