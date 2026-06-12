import { chromium } from 'playwright'
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const outDir = path.join(root, '.hermes_handoff/screenshots/flow-v4-a2')
const protoUrl = 'file://' + path.join(root, 'docs/spec/flow-v4-simulador.html')
const appBase = process.env.FLOW_V4_BASE || 'http://localhost:3005/flow-v4'
await fs.mkdir(outDir, { recursive: true })

async function pair(left, right, dest, title) {
  const l = sharp(left)
  const r = sharp(right)
  const lm = await l.metadata()
  const rm = await r.metadata()
  const gap = 28
  const padTop = 74
  const labelH = 36
  const width = (lm.width || 0) + (rm.width || 0) + gap
  const height = Math.max(lm.height || 0, rm.height || 0) + padTop
  const svg = `<svg width="${width}" height="${padTop}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#F5F8FE"/><text x="0" y="24" font-family="Arial" font-size="20" font-weight="700" fill="#0F1830">${title}</text><text x="0" y="58" font-family="Arial" font-size="15" font-weight="700" fill="#2D6BE0">Prototype</text><text x="${(lm.width || 0) + gap}" y="58" font-family="Arial" font-size="15" font-weight="700" fill="#149563">Implemented</text></svg>`
  await sharp({ create: { width, height, channels: 4, background: '#F5F8FE' } })
    .composite([
      { input: Buffer.from(svg), top: 0, left: 0 },
      { input: left, top: padTop, left: 0 },
      { input: right, top: padTop, left: (lm.width || 0) + gap },
    ])
    .png()
    .toFile(dest)
}

async function screenshot(page, file, fullPage = true) {
  await page.screenshot({ path: file, fullPage })
}

async function setupProto(page, scenario = 'far') {
  await page.goto(protoUrl)
  await page.locator(`button.case[data-s="${scenario}"]`).click()
  await page.locator('#go-analyze').click()
  await page.waitForSelector('#sc-t1.on', { timeout: 5000 })
}

async function protoGenerate(page) {
  await page.locator('#ab-go').click()
  await page.waitForSelector('#sc-gen.on')
}

async function protoT2(page) {
  await page.waitForSelector('#sc-t2.on', { timeout: 5000 })
  await page.waitForTimeout(700)
}

async function protoS2(page) {
  await setupProto(page, 'far')
  await page.evaluate(() => {
    window.binYes(0); window.confirmGap(0)
    window.startGap(1); window.toggleAct(1,0); window.toggleAct(1,1)
    window.pickDur(1, document.querySelector('#gap-1 .src-grid .src:nth-child(2)'), '1–3 años')
    window.pickSrc(1, document.querySelectorAll('#gap-1 .src-grid')[1].querySelector('.src:nth-child(1)'), 'Proyectos personales')
    window.confirmGap(1)
    window.startGap(3); window.toggleAct(3,0)
    window.pickSrc(3, document.querySelector('#gap-3 .src-grid .src:nth-child(2)'), 'Freelance')
    window.confirmGap(3)
  })
  await protoGenerate(page); await protoT2(page)
}

async function protoS3(page) {
  await setupProto(page, 'far')
  await page.evaluate(() => {
    window.startGap(2); window.toggleAct(2,1)
    window.pickSrc(2, document.querySelector('#gap-2 .src-grid .src:nth-child(2)'), 'Autoevaluado — honesto')
    window.confirmGap(2)
  })
  await protoGenerate(page); await protoT2(page)
}

async function protoSkip(page) { await setupProto(page, 'far'); await page.locator('#ab-skip').click(); await protoT2(page) }
async function protoFormal(page) { await protoS2(page); await page.locator('#seg-formal').click(); await page.waitForTimeout(250) }
async function protoNear(page) {
  await setupProto(page, 'near')
  await page.evaluate(() => { window.startGap(0); window.toggleAct(0,0); window.pickSrc(0, document.querySelector('#gap-0 .src-grid .src:nth-child(3)'), 'Empleo anterior'); window.confirmGap(0) })
  await protoGenerate(page); await protoT2(page)
}

async function appGoto(page, scenario = 'far', mobile = false) {
  await page.goto(`${appBase}?case=${scenario}`)
  await page.waitForSelector('[data-screen="t1"]')
}

async function withinQ(page, name) { return page.locator(`[data-question="${name}"]`) }
async function appConfirmBinary(page) { const q = await withinQ(page, 'Visa de EE. UU. vigente'); await q.getByRole('button', { name: 'Sí, la tengo' }).click(); await q.getByRole('button', { name: /Sumar a mi CV/ }).click() }
async function appConfirmIA(page) {
  const q = await withinQ(page, 'Experiencia construyendo con IA')
  await q.getByRole('button', { name: 'Sí, lo viví' }).click()
  await q.getByRole('button', { name: 'Construí chatbots / agentes con LLMs' }).click()
  await q.getByRole('button', { name: 'Diseñé prompts y flujos conversacionales' }).click()
  await q.getByRole('button', { name: '1–3 años' }).click()
  await q.getByRole('button', { name: 'Proyectos personales' }).click()
  await q.getByRole('button', { name: /Sumar a mi CV/ }).click()
}
async function appConfirmApis(page) {
  const q = await withinQ(page, 'Integraciones con APIs')
  await q.getByRole('button', { name: 'Sí, lo viví' }).click()
  await q.getByRole('button', { name: 'Conecté herramientas vía API' }).click()
  await q.getByRole('button', { name: 'Freelance' }).click()
  await q.getByRole('button', { name: /Sumar a mi CV/ }).click()
}
async function appConfirmEnglish(page) {
  const q = await withinQ(page, 'Nivel de inglés')
  await q.getByRole('button', { name: 'Actualizar mi nivel' }).click()
  await q.locator('button').filter({ hasText: 'B2' }).click()
  await q.locator('button').filter({ hasText: 'Autoevaluado — honesto' }).click()
  await q.getByRole('button', { name: /Sumar a mi CV/ }).click()
}
async function appConfirmNearOne(page) {
  const q = await withinQ(page, 'Campañas de Meta Ads')
  await q.getByRole('button', { name: 'Sí, lo viví' }).click()
  await q.getByRole('button', { name: 'Creé y configuré campañas' }).click()
  await q.getByRole('button', { name: 'Empleo anterior' }).click()
  await q.getByRole('button', { name: /Sumar a mi CV/ }).click()
}
async function appGenerate(page, skip = false) {
  await page.getByRole('button', { name: skip ? 'Saltar preguntas' : 'Generar mi CV →' }).click()
  await page.waitForSelector('[data-screen="gen"]')
}
async function appT2(page) { await page.waitForSelector('[data-screen="t2"]', { timeout: 5000 }); await page.waitForTimeout(1800) }
async function appS2(page) { await appGoto(page, 'far'); await appConfirmBinary(page); await appConfirmIA(page); await appConfirmApis(page); await appGenerate(page); await appT2(page) }
async function appS3(page) { await appGoto(page, 'far'); await appConfirmEnglish(page); await appGenerate(page); await appT2(page) }
async function appSkip(page) { await appGoto(page, 'far'); await appGenerate(page, true); await appT2(page) }
async function appFormal(page) { await appS2(page); await page.getByRole('button', { name: 'Carta formal' }).click(); await page.waitForTimeout(250) }
async function appNear(page) { await appGoto(page, 'near'); await appConfirmNearOne(page); await appGenerate(page); await appT2(page) }

const browser = await chromium.launch()
const states = [
  ['S1-far-generating-interstitial', async p => { await setupProto(p, 'far'); await protoGenerate(p) }, async p => { await appGoto(p, 'far'); await appGenerate(p) }, { fullPage: false }],
  ['S2-far-t2-visa-ia-apis', protoS2, appS2, {}],
  ['S3-far-t2-english-b2', protoS3, appS3, {}],
  ['S4-far-t2-skip-zero-confirmed', protoSkip, appSkip, {}],
  ['S5-far-cover-letter-formal', protoFormal, appFormal, {}],
  ['S6-near-t2-one-question', protoNear, appNear, {}],
]
for (const [name, protoFn, appFn, opts] of states) {
  const proto = await browser.newPage({ viewport: { width: 720, height: 1100 }, deviceScaleFactor: 1 })
  const app = await browser.newPage({ viewport: { width: 720, height: 1100 }, deviceScaleFactor: 1 })
  await protoFn(proto); await appFn(app)
  const l = path.join(outDir, `${name}-prototype.png`)
  const r = path.join(outDir, `${name}-implemented.png`)
  await screenshot(proto, l, opts.fullPage ?? true)
  await screenshot(app, r, opts.fullPage ?? true)
  await pair(l, r, path.join(outDir, `${name}-pair.png`), name)
  await proto.close(); await app.close()
}
{
  const proto = await browser.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 1, isMobile: true })
  const app = await browser.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 1, isMobile: true })
  await protoS2(proto); await appS2(app)
  await screenshot(proto, path.join(outDir, 'S7-mobile-t2-top-prototype.png'), false)
  await screenshot(app, path.join(outDir, 'S7-mobile-t2-top-implemented.png'), false)
  await pair(path.join(outDir, 'S7-mobile-t2-top-prototype.png'), path.join(outDir, 'S7-mobile-t2-top-implemented.png'), path.join(outDir, 'S7-mobile-t2-top-pair.png'), 'S7-mobile-t2-top')
  await proto.close(); await app.close()
}
await browser.close()
console.log(outDir)
