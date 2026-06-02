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

function cleanUrl(value) {
  return clean(value).replace(/^https?:\/\//i, '')
}

function compact(values) {
  return values.map(clean).filter(Boolean)
}

function getLabels(language) {
  return language === 'spanish'
    ? {
        summary: 'Perfil profesional',
        skills: 'Habilidades',
        technicalSkills: 'Habilidades técnicas',
        roleTechStack: 'Stack técnico',
        roleTools: 'Herramientas del rol',
        tools: 'Herramientas',
        experience: 'Experiencia profesional',
        education: 'Educación',
        certifications: 'Certificaciones',
        languages: 'Idiomas',
        additional: 'Información adicional',
      }
    : {
        summary: 'Professional Summary',
        skills: 'Skills',
        technicalSkills: 'Technical Skills',
        roleTechStack: 'Tech Stack',
        roleTools: 'Role Tools',
        tools: 'Tools',
        experience: 'Professional Experience',
        education: 'Education',
        certifications: 'Certifications',
        languages: 'Languages',
        additional: 'Additional Information',
      }
}

function getCandidateName(cv) {
  return clean(cv?.candidateName || cv?.name || cv?.fullName || '')
}

function getTargetTitle(cv) {
  return clean(cv?.targetTitle || cv?.headline || cv?.title || '')
}

function getContactParts(cv) {
  const contact = cv?.contact
  if (typeof contact === 'string') return [clean(contact)].filter(Boolean)

  if (contact && typeof contact === 'object') {
    return compact([
      contact.email,
      contact.phone,
      contact.location,
      cleanUrl(contact.linkedin),
      cleanUrl(contact.portfolio || contact.website || contact.github),
    ])
  }

  return compact([
    cv?.email,
    cv?.phone,
    cv?.location,
    cleanUrl(cv?.linkedin),
    cleanUrl(cv?.portfolio || cv?.website || cv?.github),
  ])
}

function drawSectionTitle(doc, title) {
  doc.moveDown(0.8)
  doc
    .font('Helvetica-Bold')
    .fontSize(10.5)
    .fillColor('#111111')
    .text(String(title).toUpperCase(), { continued: false })
  doc
    .moveTo(doc.page.margins.left, doc.y + 2)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y + 2)
    .lineWidth(0.5)
    .strokeColor('#111111')
    .stroke()
  doc.moveDown(0.45)
}

function drawBulletList(doc, items) {
  for (const item of asArray(items)) {
    const text = clean(item)
    if (!text) continue
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#111111')
      .text(`- ${text}`, {
        lineGap: 1.5,
        paragraphGap: 2,
      })
  }
}

function drawInlineList(doc, items) {
  const text = asArray(items).map(clean).filter(Boolean).join(', ')
  if (!text) return
  doc.font('Helvetica').fontSize(10).fillColor('#111111').text(text, { lineGap: 1.5 })
}

function drawMetaLine(doc, label, items) {
  const text = asArray(items).map(clean).filter(Boolean).join(', ')
  if (!text) return
  doc
    .font('Helvetica-Bold')
    .fontSize(9.3)
    .fillColor('#111111')
    .text(`${label}: `, { continued: true })
    .font('Helvetica')
    .text(text, { lineGap: 1.2 })
}

function drawExperience(doc, experience, labels) {
  for (const role of Array.isArray(experience) ? experience : []) {
    const title = clean(role?.title)
    const company = clean(role?.company)
    const location = clean(role?.location)
    const dates = clean(role?.dates)
    if (!title && !company) continue

    doc
      .font('Helvetica-Bold')
      .fontSize(10.5)
      .fillColor('#111111')
      .text(title || company)

    const meta = [company, location, dates].filter(Boolean).join(' | ')
    if (meta) {
      doc.font('Helvetica').fontSize(9.5).fillColor('#111111').text(meta)
    }

    drawMetaLine(doc, labels.roleTechStack, role?.techStack)
    drawMetaLine(doc, labels.roleTools, role?.tools)
    drawBulletList(doc, role?.bullets)
    doc.moveDown(0.35)
  }
}

function drawPlainCv(doc, value) {
  const text = String(value || '').slice(0, MAX_TEXT_LENGTH)
  doc.font('Helvetica').fontSize(10).fillColor('#111111').text(text, {
    lineGap: 1.5,
    paragraphGap: 4,
  })
}

function hasItems(value) {
  return asArray(value).length > 0
}

export async function generateCvPdfBuffer(payload) {
  const optimizedCV = payload?.optimizedCV || payload?.cv || payload || {}
  const language = payload?.outputLanguage === 'spanish' ? 'spanish' : 'english'
  const labels = getLabels(language)

  const candidateName = typeof optimizedCV === 'string' ? '' : getCandidateName(optimizedCV)
  const targetTitle = typeof optimizedCV === 'string' ? '' : getTargetTitle(optimizedCV)
  const contactParts = typeof optimizedCV === 'string' ? [] : getContactParts(optimizedCV)
  const documentTitle = candidateName || targetTitle || DEFAULT_TITLE

  const doc = new PDFDocument({
    size: payload?.pageSize === 'letter' ? 'LETTER' : 'A4',
    margins: { top: 48, bottom: 48, left: 54, right: 54 },
    bufferPages: true,
    info: {
      Title: clean(documentTitle),
      Author: candidateName || 'Candidate',
      Subject: 'ATS-friendly optimized CV',
    },
  })

  const chunks = []
  doc.on('data', (chunk) => chunks.push(chunk))

  const finished = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })

  if (candidateName) {
    doc.font('Helvetica-Bold').fontSize(19).fillColor('#111111').text(candidateName, { align: 'center' })
  } else {
    doc.font('Helvetica-Bold').fontSize(17).fillColor('#111111').text(documentTitle, { align: 'center' })
  }

  if (contactParts.length) {
    doc.moveDown(0.15)
    doc.font('Helvetica').fontSize(9.5).fillColor('#111111').text(contactParts.join(' | '), { align: 'center' })
  }

  if (targetTitle) {
    doc.moveDown(0.25)
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#111111').text(targetTitle, { align: 'center' })
  }

  doc.moveDown(0.35)
  doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).lineWidth(0.5).strokeColor('#111111').stroke()

  if (typeof optimizedCV === 'string') {
    doc.moveDown(0.8)
    drawPlainCv(doc, optimizedCV)
  } else {
    if (optimizedCV?.summary) {
      drawSectionTitle(doc, labels.summary)
      doc.font('Helvetica').fontSize(10).fillColor('#111111').text(clean(optimizedCV.summary), {
        lineGap: 1.5,
        paragraphGap: 4,
      })
    }

    if (hasItems(optimizedCV?.coreCompetencies) || hasItems(optimizedCV?.skills)) {
      drawSectionTitle(doc, labels.skills)
      drawInlineList(doc, [...asArray(optimizedCV?.coreCompetencies), ...asArray(optimizedCV?.skills)])
    }

    if (hasItems(optimizedCV?.technicalSkills)) {
      drawSectionTitle(doc, labels.technicalSkills)
      drawInlineList(doc, optimizedCV.technicalSkills)
    }

    if (Array.isArray(optimizedCV?.experience) && optimizedCV.experience.length) {
      drawSectionTitle(doc, labels.experience)
      drawExperience(doc, optimizedCV.experience, labels)
    }

    if (hasItems(optimizedCV?.education)) {
      drawSectionTitle(doc, labels.education)
      drawBulletList(doc, optimizedCV.education)
    }

    if (hasItems(optimizedCV?.certifications)) {
      drawSectionTitle(doc, labels.certifications)
      drawBulletList(doc, optimizedCV.certifications)
    }

    if (hasItems(optimizedCV?.tools)) {
      drawSectionTitle(doc, labels.tools)
      drawInlineList(doc, optimizedCV.tools)
    }

    if (hasItems(optimizedCV?.languages)) {
      drawSectionTitle(doc, labels.languages)
      drawBulletList(doc, optimizedCV.languages)
    }

    const additional = optimizedCV?.additionalInformation || optimizedCV?.additional
    if (additional && hasItems(additional)) {
      drawSectionTitle(doc, labels.additional)
      drawBulletList(doc, additional)
    }
  }

  doc.end()
  return finished
}
