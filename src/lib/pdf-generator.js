import PDFDocument from 'pdfkit/js/pdfkit.standalone.js'

const DEFAULT_TITLE = 'Optimized CV'
const MAX_TEXT_LENGTH = 12000

export function sanitizePdfFilename(value) {
  const cleaned = String(value || DEFAULT_TITLE)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()

  return `${cleaned || 'optimized-cv'}.pdf`
}

function asArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean).map(String)
  return [String(value)]
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function drawSectionTitle(doc, title) {
  doc.moveDown(0.75)
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#111827')
    .text(String(title).toUpperCase(), { continued: false })
  doc
    .moveTo(doc.page.margins.left, doc.y + 3)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y + 3)
    .lineWidth(0.5)
    .strokeColor('#CBD5E1')
    .stroke()
  doc.moveDown(0.45)
}

function drawBulletList(doc, items) {
  for (const item of asArray(items)) {
    doc
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor('#1F2937')
      .text(`• ${clean(item)}`, {
        lineGap: 2,
        paragraphGap: 2,
      })
  }
}

function drawCompetencies(doc, items) {
  const text = asArray(items).map(clean).join(' • ')
  if (!text) return
  doc.font('Helvetica').fontSize(9.5).fillColor('#1F2937').text(text, { lineGap: 2 })
}

function drawExperience(doc, experience) {
  for (const role of Array.isArray(experience) ? experience : []) {
    const title = clean(role?.title)
    const company = clean(role?.company)
    const dates = clean(role?.dates)
    if (!title && !company) continue

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#111827')
      .text(title || company)

    const meta = [company, dates].filter(Boolean).join(' | ')
    if (meta) {
      doc.font('Helvetica').fontSize(9).fillColor('#475569').text(meta)
    }

    drawBulletList(doc, role?.bullets)
    doc.moveDown(0.35)
  }
}

function drawPlainCv(doc, value) {
  const text = String(value || '').slice(0, MAX_TEXT_LENGTH)
  doc.font('Helvetica').fontSize(9.5).fillColor('#1F2937').text(text, {
    lineGap: 2,
    paragraphGap: 4,
  })
}

export async function generateCvPdfBuffer(payload) {
  const optimizedCV = payload?.optimizedCV || payload?.cv || payload || {}
  const language = payload?.outputLanguage === 'spanish' ? 'spanish' : 'english'
  const labels = language === 'spanish'
    ? {
        summary: 'Perfil profesional',
        competencies: 'Competencias clave',
        experience: 'Experiencia profesional',
        education: 'Educación',
        additional: 'Información adicional',
      }
    : {
        summary: 'Professional Summary',
        competencies: 'Core Competencies',
        experience: 'Professional Experience',
        education: 'Education',
        additional: 'Additional Information',
      }

  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 54, bottom: 54, left: 54, right: 54 },
    bufferPages: true,
    info: {
      Title: clean(optimizedCV?.headline || DEFAULT_TITLE),
      Author: 'RevisaMiCV',
      Subject: 'ATS-friendly optimized CV',
    },
  })

  const chunks = []
  doc.on('data', (chunk) => chunks.push(chunk))

  const finished = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })

  const headline = clean(optimizedCV?.headline || DEFAULT_TITLE)
  doc.font('Helvetica-Bold').fontSize(18).fillColor('#111827').text(headline, {
    align: 'center',
  })

  const contact = clean(optimizedCV?.contact || optimizedCV?.location || '')
  if (contact) {
    doc.moveDown(0.25)
    doc.font('Helvetica').fontSize(9).fillColor('#475569').text(contact, { align: 'center' })
  }

  doc.moveDown(0.4)
  doc.moveTo(54, doc.y).lineTo(doc.page.width - 54, doc.y).lineWidth(0.75).strokeColor('#CBD5E1').stroke()

  if (typeof optimizedCV === 'string') {
    doc.moveDown(0.8)
    drawPlainCv(doc, optimizedCV)
  } else {
    if (optimizedCV?.summary) {
      drawSectionTitle(doc, labels.summary)
      doc.font('Helvetica').fontSize(9.5).fillColor('#1F2937').text(clean(optimizedCV.summary), {
        lineGap: 2,
        paragraphGap: 4,
      })
    }

    if (asArray(optimizedCV?.coreCompetencies).length) {
      drawSectionTitle(doc, labels.competencies)
      drawCompetencies(doc, optimizedCV.coreCompetencies)
    }

    if (Array.isArray(optimizedCV?.experience) && optimizedCV.experience.length) {
      drawSectionTitle(doc, labels.experience)
      drawExperience(doc, optimizedCV.experience)
    }

    if (optimizedCV?.education) {
      drawSectionTitle(doc, labels.education)
      if (Array.isArray(optimizedCV.education)) drawBulletList(doc, optimizedCV.education)
      else drawPlainCv(doc, optimizedCV.education)
    }

    const additional = optimizedCV?.additionalInformation || optimizedCV?.additional || optimizedCV?.certifications
    if (additional) {
      drawSectionTitle(doc, labels.additional)
      if (Array.isArray(additional)) drawBulletList(doc, additional)
      else drawPlainCv(doc, additional)
    }
  }

  const pageRange = doc.bufferedPageRange()
  for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
    doc.switchToPage(i)
    doc.font('Helvetica').fontSize(7).fillColor('#94A3B8').text(
      `Page ${i + 1} of ${pageRange.count}`,
      doc.page.margins.left,
      doc.page.height - 36,
      { align: 'center', width: doc.page.width - doc.page.margins.left - doc.page.margins.right }
    )
  }

  doc.end()
  return finished
}
