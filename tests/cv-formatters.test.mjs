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
