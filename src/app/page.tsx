'use client'

import Link from 'next/link'
import { useEffect, type CSSProperties } from 'react'

const painCards = [
  ['Mandé 400 aplicaciones. Ni un rechazo. Silencio total.', '— 3 años de experiencia, en búsqueda activa'],
  ['Reescribí mi CV 10 veces. Sigo sin saber qué está mal.', '— Profesional con experiencia, 2 meses buscando'],
  ['30 minutos adaptando cada CV a mano. Multiplícalo por 200.', '— Developer, 10 años en tech'],
  ['Puedo hacer cinco roles, pero atraigo siempre el equivocado.', '— Perfil multidisciplinario (PM / UX / Dev)'],
]

const steps = [
  ['01', 'Sube tu CV real', 'PDF, Word .docx o TXT. En español o inglés.'],
  ['02', 'Pega la vacante', 'Responsabilidades, requisitos y contexto del cargo.'],
  ['03', 'Recibe el diagnóstico', 'Score /100, brechas, fortalezas, riesgos y keywords.'],
  ['04', 'Descarga el CV adaptado', 'Editable y listo para enviar en PDF, DOCX o TXT.'],
]

const comparisonRows = [
  ['Lee PDF / DOCX / TXT', 'Manual o inconsistente', 'Automático'],
  ['Cruza CV vs vacante', 'Depende del prompt', 'Flujo guiado'],
  ['Score de compatibilidad', 'No estructurado', '/100 con desglose'],
  ['Brechas y riesgos', 'Genérico', 'Por cada vacante'],
  ['Convierte ES ⇄ EN', 'Traducción literal, suena raro', 'Adapta, no traduce literal'],
  ['CV adaptado descargable', 'Copiar y pegar', 'PDF / DOCX / TXT'],
  ['Control anti-invención', 'Riesgo alto de exagerar', 'Reglas explícitas'],
  ['Tiempo por vacante', '15–30 min de pelea', '~3 minutos'],
]

const trustCards = [
  ['⊘', 'No inventa nada', 'Ni empleadores, ni cargos, ni títulos, ni certificaciones, ni años de experiencia, ni métricas que no tengas.'],
  ['⊕', 'Preserva tu evidencia', 'Métricas, marcas, links, proyectos propios, GitHub y tu stack técnico por cada rol. Lo valioso se queda.'],
  ['⇄', 'Te habla de tu vacante', 'Cruza tu CV real contra esa vacante específica — no contra consejos genéricos de internet.'],
  ['✎', 'Tú tienes la última palabra', 'Puedes editar todo antes de descargar y exportar en PDF, Word DOCX o TXT compatible con ATS.'],
]

const dataTrustCards = [
  ['Datos personales', 'Tu CV contiene información sensible. Por eso agregamos privacidad visible, soporte y opción de solicitar eliminación de datos.'],
  ['Pagos seguros', 'Stripe procesa el pago. RevisaMiCV no guarda los datos completos de tu tarjeta; solo acredita tokens al email usado.'],
  ['Tokens justos', 'Un token equivale a un análisis contra una vacante. Si un error técnico verificable falla antes de generar valor, revisamos el caso.'],
]

const useCases = [
  ['“Tengo varias vacantes parecidas. ¿A cuál aplico primero?”', 'Comparar oportunidades', 'Un score distinto por cada vacante. Sabes dónde vale la pena el esfuerzo.'],
  ['“Puedo aplicar a PM, UX o Dev. Mi CV grita uno solo.”', 'Perfil multidisciplinario', 'Reposiciona tus fortalezas transferibles por rol, sin inventar cargos.'],
  ['“Mi CV está en español y la vacante es en inglés. O al revés.”', 'Convierte español ⇄ inglés', 'Adapta tu CV al otro idioma con lenguaje natural y profesional —no traducción literal de Google Translate— listo para remoto global.'],
]

const plans = [
  {
    key: 'basic',
    name: 'Básico',
    description: 'Para enfocar tus mejores oportunidades.',
    price: '$5',
    unit: '5 análisis · $1 por CV',
    popular: false,
    features: ['Score CV vs vacante /100', 'Brechas y fortalezas', 'Keywords recomendadas', 'CV adaptado en PDF / DOCX / TXT', 'Tokens sin vencimiento'],
  },
  {
    key: 'pro',
    name: 'Pro',
    description: 'Para comparar varias vacantes en serio.',
    price: '$12',
    unit: '15 análisis · $0.80 por CV',
    popular: true,
    features: ['Todo lo del plan Básico', 'Ideal para comparar oportunidades', 'Historial de análisis en tu panel', 'Prioriza a cuál aplicar primero', 'Tokens sin vencimiento'],
  },
  {
    key: 'premium',
    name: 'Premium',
    description: 'Para una búsqueda intensiva y constante.',
    price: '$19',
    unit: '30 análisis · $0.63 por CV',
    popular: false,
    features: ['Todo lo del plan Pro', 'El mejor costo por análisis', 'Historial completo en tu panel', 'Para quien aplica a diario', 'Tokens sin vencimiento'],
  },
]

const faqs = [
  ['¿Esto me garantiza que voy a conseguir trabajo?', 'No, y desconfía de quien te lo prometa. Hay muchas variables fuera de cualquier herramienta: el mercado, la cantidad de aplicantes, el momento. Lo que sí hacemos: subir la probabilidad de que tu CV llame la atención y encaje con esa vacante, y bajar la fricción entre lo que tú vales y lo que el empleador alcanza a ver. El resto, lo pones tú.'],
  ['¿Va a inventar experiencia que no tengo?', 'Nunca. Es la regla central del producto: no inventa empleadores, cargos, títulos, certificaciones, años ni métricas. Toma tu experiencia real y la reescribe en el lenguaje que la vacante busca. La credibilidad en la entrevista es tuya y la protegemos.'],
  ['¿Por qué no lo hago gratis con ChatGPT o Claude?', 'Puedes. Si tienes el prompt perfecto, lees el PDF a mano, iteras, formateas, traduces al idioma correcto y exportas. Cada vez. Aquí pegas tu CV y la vacante, y en ~3 minutos tienes score, brechas, keywords y un CV adaptado —en español o en inglés— listo para descargar. Pagas por no perder esos 30 minutos, multiplicados por cada vacante.'],
  ['¿El score es real o es decorativo?', 'Es real: mide qué tan alineado está tu CV con el texto de esa vacante específica — keywords, experiencia relevante y brechas. No predice el algoritmo interno de cada empresa, y no promete entrevistas. Sirve para algo concreto: priorizar a cuál aplicar fuerte y qué arreglar antes de enviar.'],
  ['¿Tengo que suscribirme?', 'No. Compras tokens una sola vez y no vencen. Sin cobros mensuales, sin tarjeta para el primer análisis, sin la trampa de la suscripción que se te olvidó cancelar.'],
  ['¿Qué pasa con mi CV y mis datos?', 'Tu CV se procesa para generar el diagnóstico y el documento adaptado. No vendemos tus datos ni los usamos para inventar experiencia. Puedes revisar la política de privacidad y pedir eliminación de datos desde soporte.'],
]

function SectionHeading({ label, title, intro, centered = false }: { label: string; title: string; intro?: string; centered?: boolean }) {
  return (
    <div className={`reveal ${centered ? 'center' : ''}`}>
      <div className="sec-label">{label}</div>
      <h2 className="sec-title">{title}</h2>
      {intro && <p className="sec-intro">{intro}</p>}
    </div>
  )
}

export default function Home() {
  useEffect(() => {
    const nav = document.getElementById('nav')
    const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll)

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
            revealObserver.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.18 },
    )
    document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el))

    const heroTimer = window.setTimeout(() => document.querySelector('.hero')?.classList.add('hero-on'), 200)

    const card = document.getElementById('scoreCard')
    const scoreObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const target = 94
          const ring = document.getElementById('ringFill')
          const num = document.getElementById('scoreNum')
          const circ = 295.3
          if (ring) {
            ring.style.transition = 'stroke-dashoffset 1.3s cubic-bezier(.2,.8,.2,1)'
            ring.style.strokeDashoffset = String(circ - (circ * target) / 100)
          }
          let current = 0
          const step = () => {
            current += 2
            if (current >= target) current = target
            if (num) num.textContent = String(current)
            if (current < target) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
          document.querySelectorAll<HTMLElement>('#scoreCard .fill').forEach((fill) => {
            fill.style.width = `${fill.dataset.w}%`
          })
          scoreObserver.unobserve(entry.target)
        })
      },
      { threshold: 0.4 },
    )
    if (card) scoreObserver.observe(card)

    const faqButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.q button'))
    const handlers = faqButtons.map((button) => {
      const handler = () => {
        const q = button.parentElement
        const ans = q?.querySelector<HTMLElement>('.ans')
        const open = q?.classList.contains('open')
        document.querySelectorAll<HTMLElement>('.q').forEach((item) => {
          item.classList.remove('open')
          const itemAns = item.querySelector<HTMLElement>('.ans')
          if (itemAns) itemAns.style.maxHeight = ''
        })
        if (!open && q && ans) {
          q.classList.add('open')
          ans.style.maxHeight = `${ans.scrollHeight}px`
        }
      }
      button.addEventListener('click', handler)
      return { button, handler }
    })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.clearTimeout(heroTimer)
      revealObserver.disconnect()
      scoreObserver.disconnect()
      handlers.forEach(({ button, handler }) => button.removeEventListener('click', handler))
    }
  }, [])

  return (
    <main className="landing-page">
      <header className="nav" id="nav">
        <div className="wrap nav-inner">
          <Link href="/" className="logo"><span className="dot">R</span> RevisaMiCV</Link>
          <nav className="nav-links">
            <a href="#dolor" className="lk">El problema</a>
            <a href="#como" className="lk">Cómo funciona</a>
            <a href="#comparacion" className="lk">vs. IA genérica</a>
            <a href="#precios" className="lk">Precios</a>
            <Link href="/signup" className="btn btn-primary nav-cta">Analizar gratis</Link>
          </nav>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <span className="eyebrow"><span className="pulse" /> Primer análisis gratis · sin tarjeta</span>
            <h1 className="hero-title">No es tu experiencia. Es que tu CV <span className="mark dark" style={{ '--mark-delay': '.5s' } as CSSProperties}><span>no le habla</span></span> a esa vacante.</h1>
            <p className="hero-sub">Sube tu CV, pega una vacante y en minutos sabes <b>qué tan compatible eres</b>, dónde están tus brechas y recibes un <b>CV adaptado y descargable, en español o en inglés</b>. Deja de quemar horas adaptando —y traduciendo— a mano. Sin inventar experiencia.</p>
            <div className="hero-cta">
              <Link href="/signup" className="btn btn-primary">Analiza tu primer CV gratis <span className="arr">→</span></Link>
              <a href="#como" className="btn btn-ghost">Ver cómo funciona</a>
            </div>
            <div className="hero-meta">
              <span><span className="ck">✓</span> Convierte tu CV: español ⇄ inglés</span>
              <span><span className="ck">✓</span> PDF, DOCX y TXT</span>
              <span><span className="ck">✓</span> Reglas anti-invención</span>
            </div>
          </div>

          <div className="score-card" id="scoreCard">
            <div className="sc-head"><span>Compatibilidad</span><span className="sc-job">Product Manager · Remoto</span></div>
            <div className="sc-ring">
              <div className="ring">
                <svg width="108" height="108" aria-hidden="true">
                  <circle cx="54" cy="54" r="47" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="8" />
                  <circle id="ringFill" cx="54" cy="54" r="47" fill="none" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" strokeDasharray="295.3" strokeDashoffset="295.3" />
                </svg>
                <div className="num"><b id="scoreNum">0</b><small>/ 100</small></div>
              </div>
              <div className="sc-bars">
                <div className="bar-row"><div className="bl">Keywords de la vacante <b>92%</b></div><div className="track"><div className="fill" data-w="92" /></div></div>
                <div className="bar-row"><div className="bl">Experiencia relevante <b>88%</b></div><div className="track"><div className="fill" data-w="88" /></div></div>
                <div className="bar-row"><div className="bl">Brechas detectadas <b>2</b></div><div className="track"><div className="fill warn" data-w="22" /></div></div>
              </div>
            </div>
            <div className="sc-foot"><span className="tag">REESCRITO</span><span>“Lideré” → “Spearheaded cloud migration, reduciendo el tiempo de deploy <b>40%</b>” — con tu evidencia real.</span></div>
          </div>
        </div>
      </section>

      <section className="band reveal">
        <div className="wrap no-pad">
          <div className="stats">
            <div className="stat"><div className="big">Filtros ATS</div><div className="cap">Sistemas automáticos que leen formato y keywords antes de que un reclutador vea tu CV.</div><div className="src">Problema de formato + lenguaje</div></div>
            <div className="stat"><div className="big">20–30 min</div><div className="cap">puede tomar adaptar un CV a mano por cada aplicación si quieres hacerlo con cuidado.</div><div className="src">Tiempo que RevisaMiCV reduce</div></div>
            <div className="stat"><div className="big accent">~3 min</div><div className="cap">para tener diagnóstico, brechas, keywords y una versión adaptada descargable.</div><div className="src">RevisaMiCV</div></div>
          </div>
        </div>
      </section>

      <section className="sec" id="dolor">
        <div className="wrap">
          <SectionHeading label="Situaciones comunes" title="Si te suena familiar, no estás solo." intro="Dolores típicos de personas buscando trabajo: aplicar mucho, adaptar a mano, cambiar el CV una y otra vez y no saber qué está fallando." />
          <div className="pain-grid">
            {painCards.map(([quote, who], index) => <div key={quote} className={`pain reveal d${index + 1}`}><div className="qt"><span>{quote}</span></div><div className="who">{who}</div></div>)}
          </div>
        </div>
      </section>

      <section className="sec band">
        <div className="wrap reframe reveal">
          <div className="big">El problema casi nunca <span className="mark"><span>eres tú.</span></span></div>
          <p>Tienes la experiencia. Tienes las skills. Pero tu CV genérico le habla a todos y no le habla a <b>nadie</b>. Frente a esa vacante específica, no se nota lo bueno que eres — y un filtro automático puede descartarlo antes de que alguien lo lea. <b>Eso sí se puede arreglar.</b></p>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <SectionHeading label="La diferencia" title="El mismo logro. Dos formas de contarlo." intro="No inventamos experiencia. Tomamos lo que ya hiciste y lo traducimos al lenguaje que esa vacante — y su ATS — están buscando." />
          <div className="ba">
            <div className="ba-col ba-before reveal d1">
              <div className="ba-top"><span className="ba-pill">Antes · genérico</span><span className="ba-score">23%</span></div>
              <div className="ba-h">Tu CV de siempre, pegado tal cual:</div>
              <div className="ba-line">Fui el encargado del proyecto de migración.</div>
              <div className="ba-line">Responsable de coordinar el equipo de desarrollo.</div>
              <div className="ba-line">Hice tareas de testing y documentación.</div>
            </div>
            <div className="ba-col ba-after reveal d2">
              <div className="ba-top"><span className="ba-pill">Después · adaptado</span><span className="ba-score">94%</span></div>
              <div className="ba-h">Misma experiencia, lenguaje de la vacante:</div>
              <div className="ba-line"><b>Lideré</b> una migración técnica, conectando alcance, equipo y resultado verificable.</div>
              <div className="ba-line"><b>Coordiné</b> prioridades con desarrollo, producto y stakeholders para entregar mejor.</div>
              <div className="ba-line"><b>Documenté</b> pruebas y procesos para mejorar handoff, calidad y trazabilidad.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec band" id="como">
        <div className="wrap">
          <SectionHeading label="Cómo funciona" title="De CV genérico a aplicación específica, en minutos." intro="Cada vacante se vuelve una estrategia: aplicar fuerte, adaptar con cuidado o entender los riesgos antes de enviar." />
          <div className="steps">
            {steps.map(([number, title, desc], index) => <div key={number} className={`step reveal d${index + 1}`}><div className="n">{number}</div><h4>{title}</h4><p>{desc}</p></div>)}
          </div>
        </div>
      </section>

      <section className="sec" id="comparacion">
        <div className="wrap">
          <SectionHeading label="Por qué no solo un chatbot de IA" title="Menos prompt. Más producto." intro="ChatGPT, Claude o Gemini pueden ayudar — si sabes exactamente qué pedirles, iteras, formateas, traduces y exportas a mano. Cada vez. Esto está cerrado alrededor del flujo exacto: tu CV real, la vacante real, salida lista en el idioma que necesitas." />
          <div className="cmp reveal d1">
            <table>
              <thead><tr><th>Capacidad</th><th>ChatGPT, Claude, Gemini…</th><th className="us">RevisaMiCV</th></tr></thead>
              <tbody>{comparisonRows.map(([label, gpt, us]) => <tr key={label}><td>{label}</td><td className="gpt">{gpt}</td><td className="us">{us}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="sec band">
        <div className="wrap">
          <SectionHeading label="Reglas de confianza" title="Mejora tu historia. Sin inventar una nueva." intro="La credibilidad es lo único que no puedes recuperar en una entrevista. Por eso esto está construido para no traicionarla." />
          <div className="trust-grid">
            {trustCards.map(([icon, title, text], index) => <div key={title} className={`trust reveal d${index + 1}`}><div className="ico">{icon}</div><div><h4>{title}</h4><p>{text}</p></div></div>)}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <SectionHeading label="Privacidad y soporte" title="Puedes subir tu CV sabiendo qué pasa después." intro="Un producto de CVs no puede pedir confianza a ciegas. Dejamos visibles las reglas de datos, pagos y soporte antes de que pagues o subas información sensible." />
          <div className="trust-grid">
            {dataTrustCards.map(([title, text], index) => <div key={title} className={`trust reveal d${index + 1}`}><div className="ico">◇</div><div><h4>{title}</h4><p>{text}</p></div></div>)}
          </div>
          <div className="hero-cta reveal d3" style={{ justifyContent: 'center', marginTop: 28 }}>
            <Link href="/privacidad" className="btn btn-ghost">Ver privacidad</Link>
            <Link href="/soporte" className="btn btn-ghost">Contactar soporte</Link>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <SectionHeading label="Para quién es" title="Úsalo antes de gastar energía aplicando." />
          <div className="uc-grid">
            {useCases.map(([quote, label, out], index) => <div key={label} className={`uc reveal d${index + 1}`}><div className="quote">{quote}</div><div className="label">{label}</div><div className="out">{out}</div></div>)}
          </div>
        </div>
      </section>

      <section className="sec band" id="precios">
        <div className="wrap">
          <SectionHeading centered label="Precios" title="Simple. Sin suscripción. El primero es gratis." intro="Cada token = 1 análisis de CV contra 1 vacante + CV adaptado descargable. No hay cobros recurrentes que olvidaste cancelar." />
          <div className="price-grid">
            {plans.map((plan, index) => <div key={plan.key} className={`plan ${plan.popular ? 'pop' : ''} reveal d${index + 1}`}>
              {plan.popular && <span className="ptag">Más elegido</span>}
              <div className="pn">{plan.name}</div>
              <div className="pd">{plan.description}</div>
              <div className="pp"><b>{plan.price}</b><span>USD</span></div>
              <div className="punit">{plan.unit}</div>
              <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
              <Link href={`/dashboard?pack=${plan.key}`} className={`btn ${plan.popular ? 'btn-primary' : 'btn-ghost'} pcta`}>Elegir {plan.name}</Link>
            </div>)}
          </div>
          <p className="price-note">Empieza con tu primer análisis gratis. Si te sirve, compras tokens. Te pediremos tu email solo para acreditarlos.</p>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <SectionHeading centered label="Antes de empezar" title="Las preguntas que sí importan." />
          <div className="faq reveal d1">
            {faqs.map(([question, answer]) => <div className="q" key={question}><button type="button">{question}<span className="ico" /></button><div className="ans"><p>{answer}</p></div></div>)}
          </div>
        </div>
      </section>

      <section className="final band">
        <div className="wrap">
          <div className="big reveal">Antes de mandar otro CV genérico, <span className="mark dark"><span>revisa si encaja.</span></span></div>
          <p className="reveal d1">El primer análisis es gratis. Si te sirve, compras tokens. Sin suscripción.</p>
          <div className="reveal d2 final-button"><Link href="/signup" className="btn btn-primary big-btn">Analiza tu primer CV gratis <span className="arr">→</span></Link></div>
          <div className="hero-meta reveal d3 final-meta">
            <span><span className="ck">✓</span> Sin tarjeta</span>
            <span><span className="ck">✓</span> 3 minutos</span>
            <span><span className="ck">✓</span> Español ⇄ inglés</span>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap foot-inner">
          <p>© 2026 RevisaMiCV — CVs adaptados a vacantes reales, sin inventar experiencia.</p>
          <div className="foot-links">
            <a href="#dolor">El problema</a>
            <a href="#como">Cómo funciona</a>
            <a href="#precios">Precios</a>
            <Link href="/privacidad">Privacidad</Link>
            <Link href="/terminos">Términos</Link>
            <Link href="/soporte">Soporte</Link>
            <Link href="/dashboard">Dashboard</Link>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;450;500;600;700&display=swap');
        .landing-page{--bg:#0e0a14;--bg-2:#130e1b;--surface:#16181400;--card:#19142480;--card-solid:#181323;--line:rgba(244,243,238,0.10);--line-strong:rgba(244,243,238,0.18);--cream:#f3f0f7;--muted:#9d96a8;--muted-2:#6f6880;--accent:#b24aed;--accent-soft:#cf9bff;--coral:#ff5d4a;--coral-soft:#ff8a7a;--font-display:'Bricolage Grotesque',sans-serif;--font-body:'IBM Plex Sans',sans-serif;--font-mono:'IBM Plex Mono',monospace;--maxw:1140px;min-height:100vh;background:var(--bg);color:var(--cream);font-family:var(--font-body);font-weight:400;line-height:1.55;-webkit-font-smoothing:antialiased;overflow-x:hidden;position:relative}.landing-page *{box-sizing:border-box}.landing-page::before{content:"";position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(900px 500px at 78% -8%,rgba(178,74,237,.10),transparent 60%),radial-gradient(700px 600px at 10% 8%,rgba(178,74,237,.05),transparent 55%)}.landing-page::after{content:"";position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.04;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}.landing-page a{color:inherit;text-decoration:none}.wrap{max-width:var(--maxw);margin:0 auto;padding:0 24px;position:relative;z-index:1}.no-pad{padding:0}.mark{position:relative;white-space:nowrap}.mark>span{position:relative;z-index:2}.mark::after{content:"";position:absolute;left:-.08em;right:-.08em;bottom:.04em;height:.62em;z-index:1;background:var(--accent);transform:scaleX(0);transform-origin:left center;border-radius:2px;transition:transform .7s cubic-bezier(.2,.8,.2,1);transition-delay:var(--mark-delay,.4s);opacity:.9}.in-view .mark::after,.hero-on .mark::after{transform:scaleX(1)}.mark.dark>span{color:#fff}.btn{display:inline-flex;align-items:center;gap:.55em;font-family:var(--font-body);font-weight:600;font-size:1rem;border-radius:999px;padding:.92em 1.5em;cursor:pointer;border:1px solid transparent;transition:transform .18s ease,box-shadow .18s ease,background .18s ease;line-height:1}.btn-primary{background:var(--accent);color:#fff;box-shadow:0 0 0 0 rgba(178,74,237,.5)}.btn-primary:hover{transform:translateY(-2px);box-shadow:0 14px 36px -12px rgba(178,74,237,.6)}.btn-ghost{background:transparent;color:var(--cream);border-color:var(--line-strong)}.btn-ghost:hover{border-color:var(--cream);transform:translateY(-2px)}.btn .arr{transition:transform .2s ease}.btn:hover .arr{transform:translateX(3px)}header.nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(12px);background:rgba(11,12,9,.72);border-bottom:1px solid transparent;transition:border-color .3s}header.nav.scrolled{border-bottom:1px solid var(--line)}.nav-inner{display:flex;align-items:center;justify-content:space-between;height:68px}.logo{display:flex;align-items:center;gap:.5em;font-family:var(--font-display);font-weight:700;font-size:1.18rem;letter-spacing:-.02em}.logo .dot{width:22px;height:22px;border-radius:6px;background:var(--accent);display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:.85rem}.nav-links{display:flex;align-items:center;gap:34px}.nav-links a.lk{font-size:.93rem;color:var(--muted);transition:color .2s}.nav-links a.lk:hover{color:var(--cream)}.nav-cta{font-size:.9rem;padding:.62em 1.15em}@media(max-width:860px){.nav-links .lk{display:none}.nav-links{gap:12px}}.hero{padding:78px 0 40px;position:relative}.eyebrow{display:inline-flex;align-items:center;gap:.6em;font-family:var(--font-mono);font-size:.76rem;letter-spacing:.12em;text-transform:uppercase;color:var(--accent-soft);border:1px solid var(--line);border-radius:999px;padding:.5em .9em;margin-bottom:26px}.eyebrow .pulse{width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 0 rgba(178,74,237,.6);animation:pulse 2.2s infinite}@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(178,74,237,.5)}70%{box-shadow:0 0 0 9px rgba(178,74,237,0)}100%{box-shadow:0 0 0 0 rgba(178,74,237,0)}}h1.hero-title{font-family:var(--font-display);font-weight:700;letter-spacing:-.025em;font-size:clamp(2.4rem,6vw,4.35rem);line-height:1.02;max-width:15ch;margin-bottom:26px}.hero-sub{font-size:clamp(1.05rem,2vw,1.28rem);color:var(--muted);max-width:50ch;line-height:1.6;margin-bottom:34px}.hero-sub b{color:var(--cream);font-weight:600}.hero-cta{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:22px}.hero-meta{display:flex;flex-wrap:wrap;gap:18px 26px;font-family:var(--font-mono);font-size:.8rem;color:var(--muted-2)}.hero-meta span{display:inline-flex;align-items:center;gap:.5em}.hero-meta .ck{color:var(--accent-soft)}.hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:54px;align-items:center}@media(max-width:920px){.hero-grid{grid-template-columns:1fr;gap:40px}}.score-card{background:linear-gradient(180deg,rgba(22,24,20,.9),rgba(16,18,16,.9));border:1px solid var(--line);border-radius:20px;padding:26px;position:relative;overflow:hidden;box-shadow:0 40px 90px -50px rgba(0,0,0,.9)}.score-card::before{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--accent),transparent);opacity:.6}.sc-head{display:flex;justify-content:space-between;align-items:center;font-family:var(--font-mono);font-size:.74rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted-2);margin-bottom:18px;gap:12px}.sc-job{color:var(--cream)}.sc-ring{display:flex;align-items:center;gap:22px;margin-bottom:22px}.ring{position:relative;width:108px;height:108px;flex-shrink:0}.ring svg{transform:rotate(-90deg)}.ring .num{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700}.ring .num b{font-size:1.9rem;line-height:1}.ring .num small{font-family:var(--font-mono);font-size:.62rem;color:var(--muted-2);letter-spacing:.1em;margin-top:2px}.sc-bars{flex:1;display:flex;flex-direction:column;gap:11px}.bar-row{font-size:.82rem}.bar-row .bl{display:flex;justify-content:space-between;margin-bottom:5px;color:var(--muted);gap:12px}.bar-row .bl b{color:var(--cream);font-family:var(--font-mono);font-weight:500}.track{height:6px;background:rgba(255,255,255,.07);border-radius:99px;overflow:hidden}.fill{height:100%;border-radius:99px;background:var(--accent);width:0;transition:width 1.1s cubic-bezier(.2,.8,.2,1)}.fill.warn{background:var(--coral)}.sc-foot{border-top:1px solid var(--line);padding-top:15px;font-size:.82rem;color:var(--muted);display:flex;gap:8px;align-items:flex-start}.sc-foot .tag{font-family:var(--font-mono);font-size:.68rem;color:var(--accent-soft);border:1px solid var(--line);border-radius:6px;padding:2px 7px;flex-shrink:0}.sc-foot b{color:var(--accent)}section{position:relative;z-index:1}.sec{padding:84px 0}.sec-label{font-family:var(--font-mono);font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;color:var(--accent-soft);margin-bottom:16px;display:flex;align-items:center;gap:.7em}.sec-label::before{content:"";width:26px;height:1px;background:var(--accent-soft)}.center{text-align:center}.center .sec-label{justify-content:center}.center .sec-title{margin-left:auto;margin-right:auto}.center .sec-intro{margin-left:auto;margin-right:auto}h2.sec-title{font-family:var(--font-display);font-weight:700;letter-spacing:-.02em;font-size:clamp(1.9rem,4vw,2.9rem);line-height:1.06;max-width:18ch;margin-bottom:18px}.sec-intro{color:var(--muted);font-size:1.08rem;max-width:54ch;line-height:1.6}.reveal{opacity:1;transform:none;transition:opacity .7s ease,transform .7s cubic-bezier(.2,.8,.2,1)}.reveal:not(.in-view){opacity:1;transform:none}.reveal.in-view{opacity:1;transform:none}.reveal.d1{transition-delay:.08s}.reveal.d2{transition-delay:.16s}.reveal.d3{transition-delay:.24s}.reveal.d4{transition-delay:.32s}.band{background:var(--bg-2);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:0}.stat{padding:46px 30px;text-align:center;border-right:1px solid var(--line)}.stat:last-child{border-right:none}.stat .big{font-family:var(--font-display);font-weight:700;font-size:clamp(2.2rem,5vw,3.6rem);line-height:1;color:var(--coral)}.stat .big.accent{color:var(--accent)}.stat .cap{color:var(--muted);font-size:.96rem;margin-top:12px;line-height:1.45}.stat .src{font-family:var(--font-mono);font-size:.68rem;color:var(--muted-2);margin-top:9px}@media(max-width:760px){.stats{grid-template-columns:1fr}.stat{border-right:none;border-bottom:1px solid var(--line)}.stat:last-child{border-bottom:none}}.pain-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-top:46px}@media(max-width:760px){.pain-grid{grid-template-columns:1fr}}.pain{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:28px;transition:border-color .25s,transform .25s,background .25s;position:relative}.pain:hover{border-color:var(--line-strong);transform:translateY(-3px)}.pain .qt{font-family:var(--font-display);font-size:1.18rem;font-weight:500;line-height:1.4;color:var(--cream);margin-bottom:12px}.pain .qt::before{content:"“";color:var(--coral);font-family:var(--font-display);font-weight:700}.pain .qt::after{content:"”";color:var(--coral);font-family:var(--font-display);font-weight:700}.pain .who{font-family:var(--font-mono);font-size:.74rem;color:var(--muted-2);letter-spacing:.04em}.reframe{text-align:center;max-width:760px;margin:0 auto}.reframe .big{font-family:var(--font-display);font-weight:700;letter-spacing:-.02em;font-size:clamp(2rem,5vw,3.2rem);line-height:1.1;margin-bottom:24px}.reframe p{color:var(--muted);font-size:1.12rem;line-height:1.65;max-width:56ch;margin:0 auto}.reframe p b{color:var(--cream);font-weight:600}.ba{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:46px}@media(max-width:760px){.ba{grid-template-columns:1fr}}.ba-col{border-radius:18px;padding:28px;border:1px solid var(--line)}.ba-before{background:rgba(255,93,74,.04);border-color:rgba(255,93,74,.22)}.ba-after{background:rgba(178,74,237,.05);border-color:rgba(178,74,237,.28)}.ba-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}.ba-pill{font-family:var(--font-mono);font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;padding:.4em .8em;border-radius:99px}.ba-before .ba-pill{background:rgba(255,93,74,.14);color:var(--coral-soft)}.ba-after .ba-pill{background:rgba(178,74,237,.16);color:var(--accent)}.ba-score{font-family:var(--font-display);font-weight:700;font-size:1.5rem}.ba-before .ba-score{color:var(--coral)}.ba-after .ba-score{color:var(--accent)}.ba-h{font-size:.92rem;color:var(--muted);margin-bottom:18px}.ba-line{font-size:.95rem;line-height:1.5;padding:13px 0;border-top:1px solid var(--line);color:var(--muted)}.ba-after .ba-line{color:var(--cream)}.ba-after .ba-line b{color:var(--accent);font-weight:600}.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:46px}@media(max-width:860px){.steps{grid-template-columns:repeat(2,1fr)}}@media(max-width:520px){.steps{grid-template-columns:1fr}.wrap{padding:0 18px}.sc-ring{align-items:flex-start;flex-direction:column}.nav-inner{height:62px}.logo{font-size:1.04rem}}.step{border:1px solid var(--line);border-radius:16px;padding:26px;background:var(--card);position:relative;transition:border-color .25s,transform .25s}.step:hover{border-color:var(--line-strong);transform:translateY(-3px)}.step .n{font-family:var(--font-mono);font-size:.8rem;color:var(--accent-soft);margin-bottom:30px}.step h4{font-family:var(--font-display);font-weight:600;font-size:1.18rem;margin-bottom:9px;letter-spacing:-.01em}.step p{font-size:.92rem;color:var(--muted);line-height:1.5}.cmp{margin-top:42px;border:1px solid var(--line);border-radius:18px;overflow:auto}.cmp table{width:100%;border-collapse:collapse;min-width:660px}.cmp th,.cmp td{padding:16px 20px;text-align:left;font-size:.93rem;border-bottom:1px solid var(--line)}.cmp thead th{font-family:var(--font-mono);font-size:.74rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted-2);background:var(--bg-2)}.cmp thead th.us{color:var(--accent)}.cmp tbody td:first-child{color:var(--muted)}.cmp tbody td.gpt{color:var(--muted-2)}.cmp tbody td.us{color:var(--cream);font-weight:500}.cmp tbody td.us::before{content:"✓ ";color:var(--accent);font-weight:700}.cmp tbody tr:last-child td{border-bottom:none}@media(max-width:680px){.cmp th,.cmp td{padding:13px 12px;font-size:.84rem}}.trust-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:44px}@media(max-width:760px){.trust-grid{grid-template-columns:1fr}}.trust{display:flex;gap:16px;padding:24px;border:1px solid var(--line);border-radius:14px;background:var(--card)}.trust .ico{width:36px;height:36px;border-radius:9px;background:rgba(178,74,237,.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--accent)}.trust h4{font-family:var(--font-display);font-weight:600;font-size:1.02rem;margin-bottom:5px}.trust p{font-size:.9rem;color:var(--muted);line-height:1.5}.uc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:44px}@media(max-width:860px){.uc-grid{grid-template-columns:1fr}}.uc{border:1px solid var(--line);border-radius:16px;padding:28px;background:var(--card);transition:border-color .25s,transform .25s}.uc:hover{border-color:var(--line-strong);transform:translateY(-3px)}.uc .quote{font-family:var(--font-display);font-size:1.1rem;font-weight:500;line-height:1.42;margin-bottom:18px;color:var(--cream)}.uc .label{font-family:var(--font-mono);font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:var(--accent-soft);margin-bottom:6px}.uc .out{font-size:.88rem;color:var(--muted)}.price-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:46px;align-items:stretch}@media(max-width:860px){.price-grid{grid-template-columns:1fr;max-width:420px;margin-left:auto;margin-right:auto}}.plan{border:1px solid var(--line);border-radius:20px;padding:30px;background:var(--card);display:flex;flex-direction:column;position:relative;transition:transform .25s,border-color .25s}.plan:hover{transform:translateY(-4px)}.plan.pop{border-color:var(--accent);background:linear-gradient(180deg,rgba(178,74,237,.06),rgba(21,23,19,.5))}.plan .ptag{position:absolute;top:-11px;left:30px;font-family:var(--font-mono);font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;background:var(--accent);color:#fff;padding:.35em .8em;border-radius:99px;font-weight:600}.plan .pn{font-family:var(--font-display);font-weight:600;font-size:1.25rem;margin-bottom:6px}.plan .pd{font-size:.88rem;color:var(--muted);margin-bottom:22px;min-height:38px}.plan .pp{display:flex;align-items:baseline;gap:6px;margin-bottom:4px}.plan .pp b{font-family:var(--font-display);font-weight:700;font-size:2.7rem;line-height:1}.plan .pp span{font-family:var(--font-mono);font-size:.82rem;color:var(--muted-2)}.plan .punit{font-family:var(--font-mono);font-size:.78rem;color:var(--accent-soft);margin-bottom:24px}.plan ul{list-style:none;display:flex;flex-direction:column;gap:11px;margin:0 0 28px;padding:0;flex:1}.plan li{font-size:.9rem;color:var(--muted);display:flex;gap:10px;line-height:1.4}.plan li::before{content:"";width:16px;height:16px;border-radius:50%;flex-shrink:0;margin-top:2px;background:rgba(178,74,237,.14);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath d='M1.5 5L4 7.5L8.5 2.5' stroke='%23b24aed' stroke-width='1.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:center}.plan .pcta{width:100%;justify-content:center}.price-note{text-align:center;font-family:var(--font-mono);font-size:.8rem;color:var(--muted-2);margin-top:26px}.faq{max-width:780px;margin:44px auto 0;border-top:1px solid var(--line)}.q{border-bottom:1px solid var(--line)}.q button{width:100%;background:none;border:none;color:var(--cream);font-family:var(--font-body);text-align:left;padding:24px 0;font-size:1.08rem;font-weight:500;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:20px}.q button .ico{flex-shrink:0;width:22px;height:22px;position:relative;transition:transform .3s}.q button .ico::before,.q button .ico::after{content:"";position:absolute;background:var(--accent);border-radius:2px}.q button .ico::before{top:10px;left:2px;right:2px;height:2px}.q button .ico::after{left:10px;top:2px;bottom:2px;width:2px;transition:transform .3s}.q.open button .ico::after{transform:scaleY(0)}.q .ans{max-height:0;overflow:hidden;transition:max-height .35s ease}.q .ans p{color:var(--muted);font-size:.98rem;line-height:1.65;padding:0 0 24px}.final{text-align:center;padding:96px 0}.final .big{font-family:var(--font-display);font-weight:700;letter-spacing:-.02em;font-size:clamp(2.1rem,5.5vw,3.6rem);line-height:1.06;max-width:18ch;margin:0 auto 22px}.final p{color:var(--muted);font-size:1.1rem;margin-bottom:34px}.final-button{display:flex;justify-content:center;margin-bottom:24px}.big-btn{font-size:1.08rem;padding:1.05em 1.9em}.final-meta{justify-content:center}footer{border-top:1px solid var(--line);padding:40px 0;background:var(--bg-2);position:relative;z-index:1}.foot-inner{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px}.foot-inner p{font-size:.84rem;color:var(--muted-2)}.foot-links{display:flex;gap:22px;font-size:.84rem;color:var(--muted)}.foot-links a:hover{color:var(--cream)}
      `}</style>
    </main>
  )
}
