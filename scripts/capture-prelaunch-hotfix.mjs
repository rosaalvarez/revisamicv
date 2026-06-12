import { writeFile, mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'

const outDir = new URL('../.hermes_handoff/screenshots/prelaunch-hotfix/', import.meta.url)
await mkdir(outDir, { recursive: true })

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--remote-debugging-port=9223',
  '--user-data-dir=/tmp/revisamicv-hotfix-chrome',
  'about:blank',
], { stdio: ['ignore', 'ignore', 'ignore'] })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitForJsonVersion() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch('http://127.0.0.1:9223/json/version')
      if (res.ok) return res.json()
    } catch {}
    await sleep(250)
  }
  throw new Error('Chrome CDP did not start')
}

await waitForJsonVersion()
const target = await (await fetch('http://127.0.0.1:9223/json/new?about:blank', { method: 'PUT' })).json()
const ws = new WebSocket(target.webSocketDebuggerUrl)
let nextId = 1
const pending = new Map()
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)))
    else resolve(msg.result)
  }
}
await new Promise((resolve) => { ws.onopen = resolve })
function cdp(method, params = {}) {
  const id = nextId++
  ws.send(JSON.stringify({ id, method, params }))
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
}
async function evalJs(expression, awaitPromise = false) {
  const result = await cdp('Runtime.evaluate', { expression, awaitPromise, returnByValue: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Runtime exception')
  return result.result?.value
}
async function screenshot(name) {
  await sleep(800)
  const { data } = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true })
  const path = new URL(name, outDir)
  await writeFile(path, Buffer.from(data, 'base64'))
  console.log(path.pathname)
}
async function clickText(text) {
  await evalJs(`(() => { const target = [...document.querySelectorAll('button,a')].find(el => (el.textContent || '').includes(${JSON.stringify(text)})); if (!target) throw new Error('Missing clickable: ${text}'); target.click(); return target.textContent; })()`)
}

try {
  await cdp('Page.enable')
  await cdp('Runtime.enable')
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1365, height: 1400, deviceScaleFactor: 1, mobile: false })
  await cdp('Page.navigate', { url: 'http://localhost:3000/' })
  await sleep(1200)
  await screenshot('00-landing-polish-score78-block.png')

  await cdp('Page.navigate', { url: 'http://localhost:3000/analizar' })
  await sleep(1200)
  await evalJs(`localStorage.clear();
localStorage.setItem('revisamicv_email','qa-zero@revisamicv.test');
localStorage.setItem('revisamicv_tokens_remaining','0');
localStorage.setItem('revisamicv_latest_cv_text', 'Experiencia profesional en marketing digital, campañas, analítica y coordinación. '.repeat(22));
localStorage.setItem('revisamicv:last-checkout-draft-key','revisamicv:checkout-draft:qa-zero@revisamicv.test');
localStorage.setItem('revisamicv:checkout-draft:qa-zero@revisamicv.test', JSON.stringify({kind:'analysis_checkout_recovery', version:1, email:'qa-zero@revisamicv.test', setupStep:'vacancy', jobDescription:'Buscamos especialista en marketing digital para campañas de Meta Ads y Google Ads. Debe crear campañas, analizar métricas, optimizar conversiones, coordinar con diseño y contenido, reportar ROI y priorizar experimentos semanales. Requiere experiencia en paid media, analítica, comunicación clara, pruebas A/B y documentación de aprendizajes para crecimiento.', outputLanguage:'spanish', savedCvText: localStorage.getItem('revisamicv_latest_cv_text'), useSavedCv:true, cvReference:{mode:'saved_cv', fileName:'CV guardado', fileSize:0, hasSavedText:true}, savedAt: new Date().toISOString()}));
location.href='/analizar';`)
  await sleep(1500)
  await screenshot('01-step2-restored-before-error-vacancy-intact.png')

  await evalJs(`window.__originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const url = String(input);
  if (url.includes('/api/process-cv')) return new Response(JSON.stringify({error:'no_tokens', message:'No tienes créditos disponibles. Compra más análisis para continuar.', tokens_remaining:0}), {status:402, headers:{'Content-Type':'application/json'}});
  if (url.includes('/api/stripe/checkout')) return new Response(JSON.stringify({url:'/analizar?payment=success&email=qa-zero%40revisamicv.test'}), {status:200, headers:{'Content-Type':'application/json'}});
  return window.__originalFetch(input, init);
};`)
  await clickText('Analizar mi CV')
  await sleep(1200)
  await screenshot('02-credits0-error-inline-packs-vacancy-intact.png')

  await clickText('Comprar Básico')
  await sleep(2000)
  await screenshot('03-after-mocked-payment-return-step2-vacancy-restored.png')

  const finalState = await evalJs(`({
    url: location.href,
    heading: document.body.innerText.includes('Pega la vacante real'),
    paymentCopy: document.body.innerText.includes('Pago confirmado'),
    vacancyRestored: document.querySelector('textarea')?.value?.includes('optimizar conversiones'),
    visibleText: document.body.innerText.slice(0, 1400)
  })`)
  console.log('FINAL_STATE=' + JSON.stringify(finalState))
} finally {
  ws.close()
  chrome.kill('SIGTERM')
}
