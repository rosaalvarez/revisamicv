import test from 'node:test'
import assert from 'node:assert/strict'
import { optimizedCvToPlainText, normalizeStringArray } from '../src/lib/cv-formatters.js'

test('normalizeStringArray accepts arrays and editable comma/newline text', () => {
  assert.deepEqual(normalizeStringArray([' React ', '', 'Next.js']), ['React', 'Next.js'])
  assert.deepEqual(normalizeStringArray('React, Next.js\nSupabase'), ['React', 'Next.js', 'Supabase'])
})

test('optimizedCvToPlainText formats contact and ATS sections', () => {
  const text = optimizedCvToPlainText({
    candidateName: 'Ana Pérez',
    contact: { email: 'ana@test.com', phone: '+57 300', location: 'Bogotá' },
    targetTitle: 'Customer Success Manager',
    summary: 'Perfil fuerte para SaaS.',
    coreCompetencies: ['CRM', 'Onboarding'],
    experience: [{
      title: 'CS Lead',
      company: 'Acme',
      dates: '2021-2025',
      techStack: ['React 18', 'Typescript 5'],
      tools: ['Figma'],
      bullets: ['Reduced churn'],
    }],
    education: ['Business Admin'],
  }, 'english')

  assert.match(text, /Ana Pérez/)
  assert.match(text, /ana@test.com \| \+57 300 \| Bogotá/)
  assert.match(text, /PROFESSIONAL SUMMARY/)
  assert.match(text, /Customer Success Manager/)
  assert.match(text, /Tech Stack: React 18, Typescript 5/)
  assert.match(text, /Role Tools: Figma/)
  assert.match(text, /- Reduced churn/)
})

test('optimizedCvToPlainText preserves featured projects with public traction metrics', () => {
  const text = optimizedCvToPlainText({
    candidateName: 'Alex Rivera',
    targetTitle: 'Frontend Engineer',
    featuredProjects: [{
      name: 'Lumen UI',
      description: 'Open-source design system',
      role: 'Creator and maintainer',
      dates: '2021 - Present',
      bullets: [
        'Earned 3,000+ GitHub stars and adoption by 40+ product teams.',
        'Built 80+ accessible components documented in Storybook with weekly releases.',
      ],
    }, {
      name: 'PixelKit',
      description: 'Prototyping tool',
      role: 'Co-founder',
      dates: '2020',
      bullets: [
        'Reached #1 Product Hunt product of the day and secured USD 15,000 in seed capital.',
      ],
    }],
  }, 'english')

  assert.match(text, /FEATURED PROJECTS/)
  assert.match(text, /Lumen UI \| Open-source design system \| Creator and maintainer \| 2021 - Present/)
  assert.match(text, /3,000\+ GitHub stars/)
  assert.match(text, /40\+ product teams/)
  assert.match(text, /80\+ accessible components/)
  assert.match(text, /PixelKit \| Prototyping tool \| Co-founder \| 2020/)
  assert.match(text, /#1 Product Hunt product of the day/)
  assert.match(text, /USD 15,000 in seed capital/)
})
