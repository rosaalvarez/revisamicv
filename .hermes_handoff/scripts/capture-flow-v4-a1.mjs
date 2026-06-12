import { chromium } from 'playwright'
import sharp from 'sharp'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const outDir = path.join(root, '.hermes_handoff/screenshots/flow-v4-a1')
const appBase = process.env.APP_BASE || 'http://127.0.0.1:3020'
const protoUrl = pathToFileURL(path.join(root, 'docs/spec/flow-v4-simulador.html')).href
await fs.mkdir(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })

async function prep(page, viewport = { width: 720, height: 1200 }) {
  await page.setViewportSize(viewport)
  await page.emulateMedia({ reducedMotion: 'reduce' })
}

async function openProto(key, viewport) {
  const page = await browser.newPage()
  await prep(page, viewport)
  await page.goto(protoUrl)
  await page.evaluate((scenario) => { cur = scenario; renderT1() }, key)
  await page.waitForSelector('#sc-t1.on')
  await page.waitForTimeout(200)
  return page
}

async function openApp(key, viewport) {
  const page = await browser.newPage()
  await prep(page, viewport)
  await page.goto(`${appBase}/flow-v4?case=${key}`, { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-case]')
  await page.waitForTimeout(200)
  return page
}

async function shotPair(name, proto, app) {
  const protoPath = path.join(outDir, `${name}-prototype.png`)
  const appPath = path.join(outDir, `${name}-implemented.png`)
  const pairPath = path.join(outDir, `${name}-pair.png`)
  await proto.screenshot({ path: protoPath, fullPage: true })
  await app.screenshot({ path: appPath, fullPage: true })
  const [leftMeta, rightMeta] = await Promise.all([sharp(protoPath).metadata(), sharp(appPath).metadata()])
  const gutter = 24
  const labelH = 48
  const width = (leftMeta.width || 0) + (rightMeta.width || 0) + gutter
  const height = Math.max(leftMeta.height || 0, rightMeta.height || 0) + labelH
  const labelSvg = Buffer.from(`<svg width="${width}" height="${labelH}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#0F1830"/><text x="20" y="31" fill="#fff" font-family="Arial" font-size="18" font-weight="700">PROTOTYPE</text><text x="${(leftMeta.width || 0) + gutter + 20}" y="31" fill="#fff" font-family="Arial" font-size="18" font-weight="700">IMPLEMENTED</text></svg>`)
  await sharp({ create: { width, height, channels: 4, background: '#F5F8FE' } })
    .composite([
      { input: labelSvg, left: 0, top: 0 },
      { input: protoPath, left: 0, top: labelH },
      { input: appPath, left: (leftMeta.width || 0) + gutter, top: labelH },
    ])
    .png()
    .toFile(pairPath)
  await proto.close()
  await app.close()
  console.log(pairPath)
}

async function s1() {
  await shotPair('S1-far-initial', await openProto('far'), await openApp('far'))
}

async function s2() {
  const proto = await openProto('far')
  await proto.locator('#gap-0').getByText('No la tengo').click()
  const app = await openApp('far')
  await app.locator('[data-question="Visa de EE. UU. vigente"]').getByText('No la tengo').click()
  await shotPair('S2-far-visa-no-noted', proto, app)
}

async function s3() {
  const proto = await openProto('far')
  await proto.locator('#gap-1').getByText('Sí, lo viví').click()
  await proto.locator('#act-1-0').click()
  await proto.locator('#act-1-1').click()
  const app = await openApp('far')
  const card = app.locator('[data-question="Experiencia construyendo con IA"]')
  await card.getByText('Sí, lo viví').click()
  await card.getByText('Construí chatbots / agentes con LLMs').click()
  await card.getByText('Diseñé prompts y flujos conversacionales').click()
  await shotPair('S3-far-ai-midflow-disabled', proto, app)
}

async function s4() {
  const proto = await openProto('far')
  await proto.locator('#gap-0').getByText('Sí, la tengo').click(); await proto.locator('#add-0').click()
  await proto.locator('#gap-1').getByText('Sí, lo viví').click(); await proto.locator('#act-1-0').click(); await proto.locator('#act-1-1').click(); await proto.locator('#gap-1').getByText('1–3 años').click(); await proto.locator('#gap-1').getByText('Proyectos personales').click(); await proto.locator('#add-1').click()
  await proto.locator('#gap-3').getByText('Sí, lo viví').click(); await proto.locator('#act-3-0').click(); await proto.locator('#gap-3').getByText('Freelance').click(); await proto.locator('#add-3').click()
  const app = await openApp('far')
  const visa = app.locator('[data-question="Visa de EE. UU. vigente"]'); await visa.getByText('Sí, la tengo').click(); await visa.getByText('Sumar a mi CV').click()
  const ai = app.locator('[data-question="Experiencia construyendo con IA"]'); await ai.getByText('Sí, lo viví').click(); await ai.getByText('Construí chatbots / agentes con LLMs').click(); await ai.getByText('Diseñé prompts y flujos conversacionales').click(); await ai.getByText('1–3 años').click(); await ai.getByText('Proyectos personales').click(); await ai.getByText('Sumar a mi CV').click()
  const api = app.locator('[data-question="Integraciones con APIs"]'); await api.getByText('Sí, lo viví').click(); await api.getByText('Conecté herramientas vía API').click(); await api.getByText('Freelance').click(); await api.getByText('Sumar a mi CV').click()
  await shotPair('S4-far-three-confirmed-risen-score', proto, app)
}

async function s5() {
  const proto = await openProto('far')
  await proto.locator('#gap-2').getByText('Actualizar mi nivel').click(); await proto.locator('#act-2-0').click()
  const app = await openApp('far')
  const english = app.locator('[data-question="Nivel de inglés"]')
  await english.getByText('Actualizar mi nivel').click(); await english.getByText('B1 (igual que hoy)').click()
  await shotPair('S5-far-english-b1-protection', proto, app)
}

async function s6() {
  await shotPair('S6-near-initial', await openProto('near'), await openApp('near'))
}

async function s7() {
  const viewport = { width: 390, height: 920 }
  const proto = await openProto('far', viewport)
  await proto.locator('#gap-1').getByText('Sí, lo viví').click()
  const app = await openApp('far', viewport)
  await app.locator('[data-question="Experiencia construyendo con IA"]').getByText('Sí, lo viví').click()
  await shotPair('S7-mobile-sticky-open-question', proto, app)
}

for (const fn of [s1, s2, s3, s4, s5, s6, s7]) await fn()
await browser.close()
