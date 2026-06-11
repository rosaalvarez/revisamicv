import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { buildAnalysisEmail } from '../../src/lib/analysis-email-sequence.js'

const root = '/Users/rositaalvarez/work/revisamicv'
const out = path.join(root, '.hermes_handoff/screenshots/conversion-triggers')
fs.mkdirSync(out, { recursive: true })

const baseCvText = `María Fernández
maria@correo.com · Bogotá, Colombia

Especialista en Marketing Digital
- Gestioné campañas digitales para productos propios y clientes pequeños.
- Analicé métricas semanales de campañas y propuse mejoras.
- Coordiné contenido y diseño para piezas de adquisición.
- Reporté resultados de campañas y aprendizajes al equipo.`

const sampleResult = {
  compatibilityScore: 81,
  original_score: 54,
  adapted_score: 81,
  tokens_remaining: 0,
  auth_token: 'preview-token',
  dashboard_url: '/dashboard?email=maria%40correo.com&auth=preview-token',
  vacancy_title: 'Especialista en Marketing Digital',
  applicationDecision: 'optimize',
  decisionReason: 'Hay evidencia suficiente para adaptar el CV a esta vacante.',
  strengths: ['Campañas digitales', 'Análisis de métricas', 'Coordinación con diseño'],
  gaps: ['ROI explícito', 'Google Ads'],
  keywordsToInclude: ['Meta Ads', 'Google Ads', 'ROI', 'campañas pagadas'],
  score_breakdown: { must_haves: 82, hard_skills: 78, soft_skills: 84, title_seniority: 80 },
  requirements_table: [
    { id: 'r1', text: 'campañas de Meta Ads', type: 'must_have', category: 'hard_skill', weight: 3 },
    { id: 'r2', text: 'análisis de métricas y ROI', type: 'must_have', category: 'experience', weight: 3 },
  ],
  original_match_results: [
    { requirement_id: 'r1', status: 'partial', evidence: 'Gestioné campañas digitales para productos propios.', evidence_source: 'cv' },
    { requirement_id: 'r2', status: 'partial', evidence: 'Analicé métricas semanales de campañas.', evidence_source: 'cv' },
  ],
  adapted_match_results: [
    { requirement_id: 'r1', status: 'match', evidence: 'Gestioné campañas digitales para productos propios y clientes pequeños.', evidence_source: 'cv' },
    { requirement_id: 'r2', status: 'match', evidence: 'Analicé métricas semanales de campañas y propuse mejoras.', evidence_source: 'cv' },
  ],
  optimizedCV: {
    candidateName: 'María Fernández',
    targetTitle: 'Especialista en Marketing Digital',
    contact: { email: 'maria@correo.com', location: 'Bogotá, Colombia', linkedin: 'linkedin.com/in/mariaf' },
    summary: 'Especialista en marketing digital con experiencia en campañas pagadas, métricas y coordinación de contenido para adquisición.',
    coreCompetencies: ['Meta Ads', 'Google Ads', 'métricas', 'ROI', 'campañas pagadas'],
    experience: [{
      title: 'Especialista en Marketing Digital', company: 'Independiente', dates: '2022 - Actualidad',
      bullets: ['Gestioné campañas digitales para productos propios y clientes pequeños.', 'Analicé métricas semanales y propuse mejoras de adquisición.', 'Coordiné contenido y diseño para piezas de campaña.']
    }]
  }
}

async function setDraft(page, overrides = {}) {
  await page.goto('http://localhost:3100/analizar', { waitUntil: 'networkidle' })
  await page.evaluate(({ result, baseCvText, overrides }) => {
    localStorage.clear()
    const fullResult = { ...result, ...overrides }
    const key = 'revisamicv:analysis-draft:maria@correo.com'
    localStorage.setItem('revisamicv:last-analysis-draft-key', key)
    localStorage.setItem('revisamicv_email', 'maria@correo.com')
    localStorage.setItem('revisamicv_auth_token', 'preview-token')
    localStorage.setItem('revisamicv_latest_cv_text', baseCvText)
    localStorage.setItem('revisamicv_lifetime_analyses', '6')
    localStorage.setItem('revisamicv_tokens_remaining', String(fullResult.tokens_remaining ?? 0))
    localStorage.setItem(key, JSON.stringify({
      result: fullResult,
      editableCv: fullResult.optimizedCV,
      email: 'maria@correo.com',
      jobDescription: 'Buscamos Especialista en Marketing Digital para Meta Ads, Google Ads, métricas, ROI y campañas pagadas.',
      outputLanguage: 'spanish',
      clarificationAnswers: {},
      activeResultStep: 'cv',
      savedAt: new Date().toISOString(),
    }))
  }, { result: sampleResult, baseCvText, overrides })
  await page.reload({ waitUntil: 'networkidle' })
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 1100 }, deviceScaleFactor: 1 })

// Trigger 1: result screen CTA, before download.
await setDraft(page, { tokens_remaining: 2 })
await page.locator('main').screenshot({ path: path.join(out, 'trigger-1-post-result-cta.png') })

// Trigger 2: post-download reducer. Route TXT generation so the download succeeds in preview without external deps.
await page.route('**/api/generate-txt', route => route.fulfill({ status: 200, contentType: 'text/plain; charset=utf-8', body: 'CV adaptado preview' }))
await setDraft(page, { tokens_remaining: 2 })
const downloadPromise = page.waitForEvent('download').catch(() => null)
await page.getByRole('button', { name: 'TXT' }).click()
await downloadPromise
await page.getByText('Tu CV quedó adaptado para Especialista en Marketing Digital.').waitFor({ timeout: 5000 })
await page.locator('main').screenshot({ path: path.join(out, 'trigger-2-post-download-state.png') })
await page.unroute('**/api/generate-txt')
await page.goto('http://localhost:3100/analizar', { waitUntil: 'networkidle' })
await page.evaluate(({ baseCvText }) => {
  localStorage.clear()
  localStorage.setItem('revisamicv_email', 'maria@correo.com')
  localStorage.setItem('revisamicv_latest_cv_text', baseCvText)
  localStorage.setItem('revisamicv_tokens_remaining', '2')
}, { baseCvText })
await page.reload({ waitUntil: 'networkidle' })
await page.locator('main').screenshot({ path: path.join(out, 'trigger-2-returning-use-saved-cv.png') })

// Trigger 3: credits=1 notice and credits=0 purchase view with Pro selected by >=5 analyses.
await page.goto('http://localhost:3100/analizar', { waitUntil: 'networkidle' })
await page.evaluate(({ baseCvText }) => {
  localStorage.clear()
  localStorage.setItem('revisamicv_email', 'maria@correo.com')
  localStorage.setItem('revisamicv_latest_cv_text', baseCvText)
  localStorage.setItem('revisamicv_tokens_remaining', '1')
}, { baseCvText })
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'Usar mi CV guardado' }).click()
await page.getByRole('button', { name: /Continuar/ }).click()
await page.locator('textarea').fill('Buscamos un/a Especialista en Marketing Digital para liderar campañas pagadas en Meta Ads y Google Ads, planificar, ejecutar, analizar métricas y reportar ROI con aprendizajes accionables para el equipo.')
await page.locator('main').screenshot({ path: path.join(out, 'trigger-3-credits-1-notice.png') })
await page.goto('http://localhost:3100/dashboard?email=maria%40correo.com&auth=preview-token&pack=pro#comprar', { waitUntil: 'networkidle' })
await page.evaluate(() => {
  localStorage.setItem('revisamicv_email', 'maria@correo.com')
  localStorage.setItem('revisamicv_auth_token', 'preview-token')
  localStorage.setItem('revisamicv_lifetime_analyses', '6')
})
await page.locator('section#comprar').screenshot({ path: path.join(out, 'trigger-3-credits-0-purchase-pro-selected.png') })

// Trigger 4: static market stat under vacancy paste field.
await page.goto('http://localhost:3100/analizar', { waitUntil: 'networkidle' })
await page.evaluate(({ baseCvText }) => {
  localStorage.clear()
  localStorage.setItem('revisamicv_email', 'maria@correo.com')
  localStorage.setItem('revisamicv_latest_cv_text', baseCvText)
}, { baseCvText })
await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'Usar mi CV guardado' }).click()
await page.getByRole('button', { name: /Continuar/ }).click()
await page.locator('textarea').fill('Buscamos un/a Especialista en Marketing Digital para liderar campañas pagadas en Meta Ads y Google Ads, planificar, ejecutar, analizar métricas y reportar ROI con aprendizajes accionables para el equipo.')
await page.locator('form').screenshot({ path: path.join(out, 'trigger-4-step-2-market-stat-line.png') })

// Trigger 5: dashboard history real delta, via route mock because dashboard requires auth-backed API.
await page.route('**/api/user', route => route.fulfill({ json: { email: 'maria@correo.com', tokens: 0, free_used: true, has_free_cv: false } }))
await page.route('**/api/history', route => route.fulfill({ json: { latest_cv_text: baseCvText, lifetime_analyses: 6, history: [{ id: 91, created_at: new Date().toISOString(), vacancy_title: 'Especialista en Marketing Digital', compatibility_score: 81, original_score: 54, adapted_score: 81, output_language: 'spanish', optimized_cv: sampleResult.optimizedCV, job_preview: 'Meta Ads, Google Ads, métricas y ROI' }] } }))
await page.goto('http://localhost:3100/dashboard?email=maria%40correo.com&auth=preview-token', { waitUntil: 'networkidle' })
await page.locator('main').screenshot({ path: path.join(out, 'trigger-5-dashboard-real-delta.png') })
await page.unroute('**/api/user')
await page.unroute('**/api/history')

// Trigger 6: email renders.
const emailContext = { email: 'maria@correo.com', language: 'spanish', vacancyTitle: 'Especialista en Marketing Digital', originalScore: 54, adaptedScore: 81, dashboardUrl: 'https://revisamicv.lat/dashboard?auth=preview', unsubscribeUrl: 'https://revisamicv.lat/api/email/unsubscribe?token=preview' }
for (const step of ['day0', 'day2', 'day6']) {
  const email = buildAnalysisEmail(step, emailContext)
  const htmlPath = path.join(out, `trigger-6-${step}-email.html`)
  fs.writeFileSync(htmlPath, email.html)
  await page.goto('file://' + htmlPath)
  await page.locator('body').screenshot({ path: path.join(out, `trigger-6-${step}-email-render.png`) })
}

await browser.close()
console.log('captured conversion trigger screenshots in', out)
