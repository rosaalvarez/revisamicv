'use client'

import Link from 'next/link'
import { useEffect, type CSSProperties } from 'react'
import { trackEvent } from '@/lib/analytics'

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
  ['Pagos seguros', 'Stripe procesa el pago. RevisaMiCV no guarda los datos completos de tu tarjeta; solo asociamos tus análisis al email usado.'],
  ['Análisis justos', 'Un análisis equivale a comparar tu CV contra una vacante. Si un error técnico verificable falla antes de generar valor, revisamos el caso.'],
  ['Soporte visible', 'Antes de pagar puedes ver privacidad, términos y soporte. Si algo no cuadra, tienes una forma clara de contactarnos.'],
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
    description: 'Compra 5 análisis adicionales. Nada mensual.',
    price: '$5',
    unit: 'Pago único · 5 análisis · $1 por CV',
    popular: false,
    features: ['Score CV vs vacante /100', 'Brechas y fortalezas', 'Keywords recomendadas', 'CV adaptado en PDF / DOCX / TXT', 'Créditos sin vencimiento'],
  },
  {
    key: 'pro',
    name: 'Pro',
    description: 'Compra 15 análisis adicionales. Mejor costo por CV.',
    price: '$12',
    unit: 'Pago único · 15 análisis · $0.80 por CV',
    popular: true,
    features: ['Todo lo del plan Básico', '15 análisis en tu cuenta', 'Historial de análisis en tu panel', 'Úsalo con 15 vacantes distintas', 'Créditos sin vencimiento'],
  },
  {
    key: 'premium',
    name: 'Premium',
    description: 'Compra 30 análisis adicionales. El menor costo por CV.',
    price: '$19',
    unit: 'Pago único · 30 análisis · $0.63 por CV',
    popular: false,
    features: ['Todo lo del plan Pro', '30 análisis en tu cuenta', 'Historial completo en tu panel', 'Úsalo con 30 vacantes distintas', 'Créditos sin vencimiento'],
  },
]

const seoResources = [
  ['adaptar-cv-a-vacante', 'Cómo adaptar tu CV a una vacante', 'Ordena tu experiencia real para que una vacante específica entienda por qué encajas.'],
  ['optimizar-cv-ats', 'Cómo optimizar tu CV para ATS', 'Keywords, formato y claridad para filtros automáticos sin llenar tu CV de humo.'],
  ['cv-en-ingles-para-remoto', 'CV en inglés para vacantes remotas', 'Adapta tu CV al lenguaje profesional global sin traducciones literales.'],
]

const faqs = [
  ['¿Esto me garantiza que voy a conseguir trabajo?', 'No, y desconfía de quien te lo prometa. Hay muchas variables fuera de cualquier herramienta: el mercado, la cantidad de aplicantes, el momento. Lo que sí hacemos: subir la probabilidad de que tu CV llame la atención y encaje con esa vacante, y bajar la fricción entre lo que tú vales y lo que el empleador alcanza a ver. El resto, lo pones tú.'],
  ['¿Va a inventar experiencia que no tengo?', 'Nunca. Es la regla central del producto: no inventa empleadores, cargos, títulos, certificaciones, años ni métricas. Toma tu experiencia real y la reescribe en el lenguaje que la vacante busca. La credibilidad en la entrevista es tuya y la protegemos.'],
  ['¿Por qué no lo hago gratis con ChatGPT o Claude?', 'Puedes. Si tienes el prompt perfecto, lees el PDF a mano, iteras, formateas, traduces al idioma correcto y exportas. Cada vez. Aquí pegas tu CV y la vacante, y en ~3 minutos tienes score, brechas, keywords y un CV adaptado —en español o en inglés— listo para descargar. Pagas por no perder esos 30 minutos, multiplicados por cada vacante.'],
  ['¿El score es real o es decorativo?', 'Es real: mide qué tan alineado está tu CV con el texto de esa vacante específica — keywords, experiencia relevante y brechas. No predice el algoritmo interno de cada empresa, y no promete entrevistas. Sirve para algo concreto: priorizar a cuál aplicar fuerte y qué arreglar antes de enviar.'],
  ['¿Tengo que suscribirme?', 'No. Compras créditos una sola vez y no vencen. Sin cobros mensuales, sin tarjeta para el primer análisis, sin la trampa de la suscripción que se te olvidó cancelar.'],
  ['¿Qué pasa con mi CV y mis datos?', 'Tu CV se procesa para generar el diagnóstico y el documento adaptado. No vendemos tus datos ni los usamos para inventar experiencia. Puedes revisar la política de privacidad y pedir eliminación de datos desde soporte.'],
]


const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'RevisaMiCV.lat',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://revisamicv.lat',
  description: 'Herramienta para adaptar un CV a una vacante específica con score de compatibilidad, keywords ATS, brechas y CV descargable en PDF, DOCX o TXT.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Primer análisis gratis; packs de créditos disponibles para análisis adicionales.',
  },
  featureList: [
    'Score de compatibilidad CV vs vacante',
    'Keywords ATS por vacante',
    'CV adaptado en español o inglés',
    'Descarga en PDF, DOCX y TXT',
    'Reglas anti-invención de experiencia',
  ],
}

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

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className="nav" id="nav">
        <div className="wrap nav-inner">
          <Link href="/" className="logo"><span className="dot">R</span> RevisaMiCV</Link>
          <nav className="nav-links">
            <a href="#dolor" className="lk">El problema</a>
            <a href="#como" className="lk">Cómo funciona</a>
            <a href="#comparacion" className="lk">vs. IA genérica</a>
            <a href="#precios" className="lk">Precios</a>
            <Link href="/signup" onClick={() => trackEvent('landing_cta_click', { location: 'nav' })} className="btn btn-primary nav-cta">Analizar gratis</Link>
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
              <Link href="/signup" onClick={() => trackEvent('landing_cta_click', { location: 'hero' })} className="btn btn-primary">Analiza tu primer CV gratis <span className="arr">→</span></Link>
              <a href="#como" className="btn btn-ghost">Ver cómo funciona</a>
            </div>
            <div className="hero-meta">
              <span><span className="ck">✓</span> Convierte tu CV: español ⇄ inglés</span>
              <span><span className="ck">✓</span> PDF, DOCX y TXT</span>
              <span><span className="ck">✓</span> Reglas anti-invención</span>
            </div>
            <div className="hero-proof">
              <span>Probado con usuarios reales</span>
              <span>Destacaron el score, el nivel de detalle y que no inventa experiencia</span>
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
            <div className="stat"><div className="big">20–30 min</div><div className="cap">Adaptar un CV a mano puede tomar 20–30 min por aplicación si quieres hacerlo con cuidado.</div><div className="src">Tiempo manual que reduces</div></div>
            <div className="stat"><div className="big accent">~3 min</div><div className="cap">Con RevisaMiCV puedes tener diagnóstico, brechas, keywords y una versión adaptada descargable.</div><div className="src">Flujo guiado por vacante</div></div>
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
          <div className="chatgpt-proof reveal d1">
            <b>La diferencia:</b> aquí no pagas por “usar IA”. Pagas por no tener que armar prompts, revisar formato, calcular un score, detectar brechas, cuidar la honestidad y exportar PDF/Word/TXT cada vez que aplicas.
          </div>
          <div className="cmp reveal d2">
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
          <SectionHeading centered label="Precios" title="Simple. Sin suscripción. El primero es gratis." intro="Tu primer análisis es gratis. Estos planes son para comprar análisis adicionales: cada análisis compara tu CV contra 1 vacante y genera un CV adaptado descargable." />
          <div className="price-grid">
            {plans.map((plan, index) => <div key={plan.key} className={`plan ${plan.popular ? 'pop' : ''} reveal d${index + 1}`}>
              {plan.popular && <span className="ptag">Más elegido</span>}
              <div className="pn">{plan.name}</div>
              <div className="pd">{plan.description}</div>
              <div className="pp"><b>{plan.price}</b><span>USD</span></div>
              <div className="punit">{plan.unit}</div>
              <div className="punit" style={{ color: 'var(--green)', fontWeight: 900 }}>No es mensual · no hay suscripción</div>
              <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
              <Link href={`/dashboard?intent=checkout&pack=${plan.key}`} onClick={() => trackEvent('pricing_pack_click', { pack: plan.key, location: 'landing_pricing', intent: 'checkout' })} className={`btn ${plan.popular ? 'btn-primary' : 'btn-ghost'} pcta`}>Comprar {plan.name}</Link>
            </div>)}
          </div>
          <p className="price-note">Empieza gratis, sin tarjeta. Si te sirve, compras más análisis. Te pediremos tu email solo para guardar tus créditos e historial.</p>
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

      <section className="sec band">
        <div className="wrap">
          <SectionHeading centered label="Recursos" title="Guías rápidas para aplicar mejor." intro="Contenido SEO útil para personas que buscan adaptar su CV, entender ATS y aplicar a vacantes remotas." />
          <div className="uc-grid">
            {seoResources.map(([slug, title, text], index) => (
              <Link key={slug} href={`/recursos/${slug}`} className={`uc reveal d${index + 1}`}>
                <div className="label">Guía</div>
                <h3>{title}</h3>
                <div className="out">{text}</div>
              </Link>
            ))}
            <Link href="/blog" className="uc reveal d4">
              <div className="label">Blog</div>
              <h3>Más guías de CV, ATS y búsqueda laboral</h3>
              <div className="out">Artículos indexables para búsquedas orgánicas y usuarios que quieren aplicar mejor.</div>
            </Link>
          </div>
        </div>
      </section>

      <section className="final band">
        <div className="wrap">
          <div className="big reveal">Antes de mandar otro CV genérico, <span className="mark dark"><span>revisa si encaja.</span></span></div>
          <p className="reveal d1">El primer análisis es gratis. Si te sirve, compras créditos. Sin suscripción.</p>
          <div className="reveal d2 final-button"><Link href="/signup" onClick={() => trackEvent('landing_cta_click', { location: 'final' })} className="btn btn-primary big-btn">Analiza tu primer CV gratis <span className="arr">→</span></Link></div>
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
            <Link href="/blog">Blog</Link>
            <Link href="/recursos/adaptar-cv-a-vacante">Guía CV</Link>
          </div>
        </div>
      </footer>


    </main>
  )
}
