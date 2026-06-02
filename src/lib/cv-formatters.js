const LABELS = {
  spanish: {
    summary: 'Perfil profesional',
    skills: 'Habilidades',
    technicalSkills: 'Habilidades técnicas',
    roleTechStack: 'Stack técnico',
    roleTools: 'Herramientas del rol',
    tools: 'Herramientas',
    experience: 'Experiencia profesional',
    featuredProjects: 'Proyectos destacados',
    education: 'Educación',
    certifications: 'Certificaciones',
    languages: 'Idiomas',
    additional: 'Información adicional',
  },
  english: {
    summary: 'Professional Summary',
    skills: 'Skills',
    technicalSkills: 'Technical Skills',
    roleTechStack: 'Tech Stack',
    roleTools: 'Role Tools',
    tools: 'Tools',
    experience: 'Professional Experience',
    featuredProjects: 'Featured Projects',
    education: 'Education',
    certifications: 'Certifications',
    languages: 'Languages',
    additional: 'Additional Information',
  },
}

export function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

export function normalizeStringArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean)
  return String(value)
    .split(/\n|,/)
    .map(cleanText)
    .filter(Boolean)
}

export function splitEditableList(value) {
  return normalizeStringArray(value)
}

export function getCvLabels(language = 'english') {
  return language === 'spanish' ? LABELS.spanish : LABELS.english
}

export function getCandidateName(cv) {
  return cleanText(cv?.candidateName || cv?.name || cv?.fullName || '')
}

export function getTargetTitle(cv) {
  return cleanText(cv?.targetTitle || cv?.headline || cv?.title || '')
}

export function getContactParts(cv) {
  const contact = cv?.contact
  if (typeof contact === 'string') return [cleanText(contact)].filter(Boolean)

  if (contact && typeof contact === 'object') {
    return [
      contact.email,
      contact.phone,
      contact.location,
      contact.linkedin,
      contact.portfolio || contact.website || contact.github,
    ].map(cleanText).filter(Boolean)
  }

  return [
    cv?.email,
    cv?.phone,
    cv?.location,
    cv?.linkedin,
    cv?.portfolio || cv?.website || cv?.github,
  ].map(cleanText).filter(Boolean)
}

function pushSection(lines, title, contentLines) {
  const cleaned = contentLines.map(cleanText).filter(Boolean)
  if (!cleaned.length) return
  if (lines.length) lines.push('')
  lines.push(title.toUpperCase())
  lines.push(...cleaned)
}

export function optimizedCvToPlainText(cv, language = 'english') {
  if (!cv) return ''
  if (typeof cv === 'string') return cv.trim()

  const labels = getCvLabels(language)
  const lines = []
  const candidateName = getCandidateName(cv)
  const contactParts = getContactParts(cv)
  const targetTitle = getTargetTitle(cv)

  if (candidateName) lines.push(candidateName)
  if (contactParts.length) lines.push(contactParts.join(' | '))
  if (targetTitle) lines.push(targetTitle)

  pushSection(lines, labels.summary, [cv.summary])
  pushSection(lines, labels.skills, [
    [...normalizeStringArray(cv.coreCompetencies), ...normalizeStringArray(cv.skills)].join(', '),
  ])
  pushSection(lines, labels.technicalSkills, [normalizeStringArray(cv.technicalSkills).join(', ')])

  const experienceLines = Array.isArray(cv.experience)
    ? cv.experience.flatMap((role) => {
        const header = [role?.title, role?.company, role?.location, role?.dates].map(cleanText).filter(Boolean).join(' | ')
        const techStack = normalizeStringArray(role?.techStack).join(', ')
        const tools = normalizeStringArray(role?.tools).join(', ')
        const bullets = normalizeStringArray(role?.bullets).map((bullet) => `- ${bullet}`)
        return [
          header,
          techStack ? `${labels.roleTechStack}: ${techStack}` : '',
          tools ? `${labels.roleTools}: ${tools}` : '',
          ...bullets,
          '',
        ].filter(Boolean)
      })
    : []
  pushSection(lines, labels.experience, experienceLines)

  const projectLines = Array.isArray(cv.featuredProjects || cv.projects)
    ? (cv.featuredProjects || cv.projects).flatMap((project) => {
        const header = [project?.name, project?.description, project?.role, project?.dates]
          .map(cleanText)
          .filter(Boolean)
          .join(' | ')
        const techStack = normalizeStringArray(project?.techStack).join(', ')
        const tools = normalizeStringArray(project?.tools).join(', ')
        const bullets = normalizeStringArray(project?.bullets || project?.achievements).map((bullet) => `- ${bullet}`)
        return [
          header,
          techStack ? `${labels.roleTechStack}: ${techStack}` : '',
          tools ? `${labels.roleTools}: ${tools}` : '',
          ...bullets,
          '',
        ].filter(Boolean)
      })
    : []
  pushSection(lines, labels.featuredProjects, projectLines)

  pushSection(lines, labels.education, normalizeStringArray(cv.education).map((item) => `- ${item}`))
  pushSection(lines, labels.certifications, normalizeStringArray(cv.certifications).map((item) => `- ${item}`))
  pushSection(lines, labels.tools, [normalizeStringArray(cv.tools).join(', ')])
  pushSection(lines, labels.languages, normalizeStringArray(cv.languages).map((item) => `- ${item}`))
  pushSection(lines, labels.additional, normalizeStringArray(cv.additionalInformation || cv.additional).map((item) => `- ${item}`))

  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`
}
