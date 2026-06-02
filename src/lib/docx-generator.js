import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
import {
  cleanText,
  getCandidateName,
  getContactParts,
  getCvLabels,
  getTargetTitle,
  normalizeStringArray,
} from './cv-formatters.js'

function textParagraph(text, options = {}) {
  return new Paragraph({
    alignment: options.align,
    heading: options.heading,
    spacing: { after: options.after ?? 120 },
    bullet: options.bullet ? { level: 0 } : undefined,
    children: [
      new TextRun({
        text: cleanText(text),
        bold: options.bold,
        size: options.size || 21,
      }),
    ],
  })
}

function addSection(children, title, paragraphs) {
  const cleaned = paragraphs.filter(Boolean)
  if (!cleaned.length) return
  children.push(textParagraph(title.toUpperCase(), { heading: HeadingLevel.HEADING_2, bold: true, size: 22, after: 80 }))
  children.push(...cleaned)
}

function listParagraphs(items) {
  return normalizeStringArray(items).map((item) => textParagraph(item, { bullet: true }))
}

export async function generateCvDocxBuffer(payload) {
  const cv = payload?.optimizedCV || payload?.cv || payload || {}
  const language = payload?.outputLanguage === 'spanish' ? 'spanish' : 'english'
  const labels = getCvLabels(language)

  if (typeof cv === 'string') {
    const doc = new Document({
      sections: [{
        properties: {},
        children: cv.split('\n').map((line) => textParagraph(line || ' ')),
      }],
    })
    return Buffer.from(await Packer.toBuffer(doc))
  }

  const children = []
  const name = getCandidateName(cv) || 'CV adaptado'
  const contactParts = getContactParts(cv)
  const targetTitle = getTargetTitle(cv)

  children.push(textParagraph(name, { align: AlignmentType.CENTER, bold: true, size: 32, after: 80 }))
  if (contactParts.length) children.push(textParagraph(contactParts.join(' | '), { align: AlignmentType.CENTER, size: 19, after: 80 }))
  if (targetTitle) children.push(textParagraph(targetTitle, { align: AlignmentType.CENTER, bold: true, size: 22, after: 180 }))

  addSection(children, labels.summary, cv.summary ? [textParagraph(cv.summary)] : [])
  addSection(children, labels.skills, normalizeStringArray([...(normalizeStringArray(cv.coreCompetencies)), ...(normalizeStringArray(cv.skills))]).length ? [textParagraph([...normalizeStringArray(cv.coreCompetencies), ...normalizeStringArray(cv.skills)].join(', '))] : [])
  addSection(children, labels.technicalSkills, normalizeStringArray(cv.technicalSkills).length ? [textParagraph(normalizeStringArray(cv.technicalSkills).join(', '))] : [])

  const experienceParagraphs = []
  if (Array.isArray(cv.experience)) {
    for (const role of cv.experience) {
      const header = [role?.title, role?.company, role?.location, role?.dates].map(cleanText).filter(Boolean).join(' | ')
      if (header) experienceParagraphs.push(textParagraph(header, { bold: true, after: 70 }))
      experienceParagraphs.push(...listParagraphs(role?.bullets))
    }
  }
  addSection(children, labels.experience, experienceParagraphs)

  addSection(children, labels.education, listParagraphs(cv.education))
  addSection(children, labels.certifications, listParagraphs(cv.certifications))
  addSection(children, labels.tools, normalizeStringArray(cv.tools).length ? [textParagraph(normalizeStringArray(cv.tools).join(', '))] : [])
  addSection(children, labels.languages, listParagraphs(cv.languages))
  addSection(children, labels.additional, listParagraphs(cv.additionalInformation || cv.additional))

  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  })

  return Buffer.from(await Packer.toBuffer(doc))
}

export function sanitizeDocxFilename(value) {
  const cleaned = String(value || 'cv-revisamicv')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()

  return `${cleaned || 'cv-revisamicv'}.docx`
}
