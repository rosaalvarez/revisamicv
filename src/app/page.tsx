'use client'

import Link from 'next/link'
import { trackEvent } from '@/lib/analytics'

const plans = [
  {
    key: 'basic',
    name: 'Básico',
    blurb: 'Compra 5 análisis adicionales. Nada mensual.',
    price: '$5',
    per: 'Pago único · 5 análisis · $1 por CV',
    features: ['Score CV vs vacante /100', 'Brechas y fortalezas', 'Keywords recomendadas', 'CV adaptado PDF / DOCX / TXT', 'Créditos sin vencimiento'],
    featured: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    blurb: 'Compra 15 análisis adicionales. Mejor costo por CV.',
    price: '$12',
    per: 'Pago único · 15 análisis · $0.80 por CV',
    features: ['Todo lo del plan Básico', '15 análisis en tu cuenta', 'Historial de análisis en tu panel', 'Úsalo con 15 vacantes distintas', 'Créditos sin vencimiento'],
    featured: true,
  },
  {
    key: 'premium',
    name: 'Premium',
    blurb: 'Compra 30 análisis adicionales. El menor costo por CV.',
    price: '$19',
    per: 'Pago único · 30 análisis · $0.63 por CV',
    features: ['Todo lo del plan Pro', '30 análisis en tu cuenta', 'Historial completo en tu panel', 'Úsalo con 30 vacantes distintas', 'Créditos sin vencimiento'],
    featured: false,
  },
]

function LandingCta({ children, location, className = 'btn-primary' }: { children: React.ReactNode; location: string; className?: string }) {
  return (
    <Link href="/analizar" className={className} onClick={() => trackEvent('landing_cta_click', { location })}>
      {children}
    </Link>
  )
}

export default function HomePage() {
  return (
    <>
      <nav>
        <div className="wrap">
          <Link href="/" className="logo"><b>R</b> RevisaMiCV</Link>
          <div className="navlinks">
            <a href="#silencio">El silencio</a>
            <a href="#como">Cómo funciona</a>
            <a href="#ia">vs. IA genérica</a>
            <a href="#precios">Precios</a>
            <Link href="/blog">Blog</Link>
          </div>
          <LandingCta location="nav" className="nav-cta">Analiza tu CV gratis</LandingCta>
        </div>
      </nav>

      <header className="hero">
        <div className="wrap">
          <span className="badge"><span className="dot" /> Primer análisis gratis · sin tarjeta</span>
          <h1>No es tu experiencia.<br />Es que tu CV no le habla a <span className="pop-serif">esa</span> vacante.</h1>
          <p className="sub">Y por eso un filtro automático lo descarta <b>antes de que un humano lo lea</b>. Sube tu CV, pega la vacante y recibe una versión adaptada (en español o en inglés) que esta vez sí logra que te vean. En 3 minutos, sin inventar experiencia.</p>
          <div className="cta-row">
            <LandingCta location="hero">Analiza tu primer CV gratis &rarr;</LandingCta>
            <a href="#como" className="btn-ghost">Ver cómo funciona</a>
          </div>
          <div className="microtrust"><span>Sin tarjeta</span><span>3 minutos</span><span>Español ⇄ inglés</span><span>No inventa experiencia</span></div>
        </div>
      </header>

      <section className="stakes" id="silencio">
        <div className="wrap">
          <span className="kicker">Lo que de verdad está en juego</span>
          <h2>No estás buscando un trabajo.<br />Estás esperando para <span className="pop-serif">volver a vivir</span>.</h2>
          <ul className="hold">
            <li>La boda que dejaste para <b>“cuando esté estable”</b>.</li>
            <li>La cita médica que sigues posponiendo porque ahorita no.</li>
            <li>El apartamento, el gimnasio, el viaje. Todo en <b>standby</b>.</li>
            <li>Ese sueño que llevas tres años mandando <b>“para el otro año”</b>.</li>
          </ul>
          <p className="silence-line">Y mientras tanto, cada CV que mandas cae en un silencio que te hace dudar de ti. <b>El silencio no significa que no sirvas.</b></p>
        </div>
      </section>

      <section className="agit">
        <div className="wrap">
          <div className="pain-grid">
            <div className="pain"><q>Mandé 400 aplicaciones. Ni un rechazo. Silencio total.</q><cite>3 años de experiencia, en búsqueda activa</cite></div>
            <div className="pain"><q>Reescribí mi CV 10 veces. Sigo sin saber qué está mal.</q><cite>Profesional con experiencia, 2 meses buscando</cite></div>
            <div className="pain"><q>Treinta minutos adaptando cada CV a mano. Multiplícalo por 200.</q><cite>Developer, 10 años en tech</cite></div>
            <div className="pain"><q>Puedo hacer cinco roles, pero atraigo siempre el equivocado.</q><cite>Perfil multidisciplinario (PM / UX / Dev)</cite></div>
          </div>
          <p className="punch">Tienes la experiencia. Tienes las skills. Pero tu CV genérico le habla a todos y no le habla a <b>nadie</b>, y frente a esa vacante específica no se nota lo bueno que eres. Casi siempre, un filtro lo descartó antes de que un humano lo leyera. <b>Eso sí se puede arreglar.</b></p>
        </div>
      </section>

      <section className="light">
        <div className="wrap">
          <div className="sec-head reveal in">
            <span className="kicker">La diferencia</span>
            <h2>El mismo logro. Dos formas de contarlo.</h2>
            <p>No inventamos experiencia. Tomamos lo que ya hiciste y lo traducimos al lenguaje que esa vacante, y su filtro ATS, está buscando.</p>
          </div>
          <div className="ba reveal in">
            <div className="card before">
              <div className="tag"><span className="lbl">Antes · genérico</span><span className="score">23%</span></div>
              <ul>
                <li>Fui el encargado del proyecto de migración.</li>
                <li>Responsable de coordinar el equipo de desarrollo.</li>
                <li>Hice tareas de testing y documentación.</li>
              </ul>
            </div>
            <div className="card after">
              <div className="tag"><span className="lbl">Después · adaptado</span><span className="score">94%</span></div>
              <ul>
                <li><b>Lideré</b> una migración técnica, conectando alcance, equipo y resultado verificable.</li>
                <li><b>Coordiné</b> prioridades con desarrollo, producto y stakeholders para entregar mejor.</li>
                <li><b>Documenté</b> pruebas y procesos para mejorar handoff, calidad y trazabilidad.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="light" id="como" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head reveal in">
            <span className="kicker">Cómo funciona</span>
            <h2>De CV genérico a aplicación específica, en minutos.</h2>
            <p>Cada vacante se vuelve una decisión clara: aplicar fuerte, adaptar con cuidado, o entender los riesgos antes de enviar.</p>
          </div>
          <div className="steps reveal in">
            <div className="step"><div className="n">01</div><h3>Sube tu CV real</h3><p>PDF, Word .docx o TXT. En español o inglés.</p></div>
            <div className="step"><div className="n">02</div><h3>Pega la vacante</h3><p>Responsabilidades, requisitos y contexto del cargo.</p></div>
            <div className="step"><div className="n">03</div><h3>Recibe el diagnóstico</h3><p>Score /100, brechas, fortalezas, riesgos y keywords.</p></div>
            <div className="step"><div className="n">04</div><h3>Descarga tu CV adaptado</h3><p>Editable y listo para enviar en PDF, DOCX o TXT.</p></div>
          </div>
          <div className="output reveal in">
            <div className="ohead">
              <div className="role">Esto recibes<b>Product Manager · Remoto</b></div>
              <div className="gauge"><div className="num">94</div><div className="den">/ 100 compatible</div></div>
            </div>
            <div className="bars">
              <div className="bar"><div className="br-top"><span>Keywords de la vacante</span><span>92%</span></div><div className="track"><div className="fill" style={{ width: '92%' }} /></div></div>
              <div className="bar"><div className="br-top"><span>Experiencia relevante</span><span>88%</span></div><div className="track"><div className="fill" style={{ width: '88%' }} /></div></div>
              <div className="bar"><div className="br-top"><span>Brechas que cerramos</span><span>2 detectadas</span></div><div className="track"><div className="fill" style={{ width: '78%' }} /></div></div>
            </div>
            <div className="rew"><div className="rlbl">Reescrito · con tu evidencia real</div>“Lideré” se vuelve “<b>Spearheaded cloud migration, reducing deploy time 40%</b>”. Sin inventar nada.</div>
          </div>
        </div>
      </section>

      <section className="light section-alt" id="ia">
        <div className="wrap">
          <div className="sec-head reveal in">
            <span className="kicker">Menos prompt, más producto</span>
            <h2>¿Por qué no lo hago gratis con ChatGPT?</h2>
            <p>Puedes, si tienes el prompt perfecto, lees el PDF a mano, iteras, formateas, traduces y exportas. Cada vez. Aquí no pagas por “usar IA”: pagas por no tener que armar todo eso en cada aplicación.</p>
          </div>
          <div className="cmp reveal in">
            <div className="row head"><div>Capacidad</div><div className="gen">ChatGPT, Claude, Gemini…</div><div className="mine">RevisaMiCV</div></div>
            {[
              ['Cruza tu CV vs la vacante', 'Depende del prompt', 'Flujo guiado'],
              ['Score de compatibilidad', 'No estructurado', '/100 con desglose'],
              ['Brechas y riesgos', 'Genérico', 'Por cada vacante'],
              ['Convierte ES ⇄ EN', 'Traducción literal, suena raro', 'Adapta, no traduce literal'],
              ['CV adaptado descargable', 'Copiar y pegar', 'PDF / DOCX / TXT'],
              ['Control anti invención', 'Riesgo alto de exagerar', 'Reglas explícitas'],
              ['Tiempo por vacante', '15 a 30 min de pelea', '~3 minutos'],
            ].map(([cap, gen, mine]) => <div className="row" key={cap}><div className="cap">{cap}</div><div className="gen">{gen}</div><div className="mine">{mine}</div></div>)}
          </div>
        </div>
      </section>

      <section className="light">
        <div className="wrap">
          <div className="sec-head reveal in"><span className="kicker">Reglas de confianza</span><h2>Mejora tu historia. Sin inventar una nueva.</h2><p>La credibilidad es lo único que no puedes recuperar en una entrevista. Por eso esto está construido para no traicionarla.</p></div>
          <div className="trust reveal in">
            <div className="pill"><div className="ic">⊘</div><h3>No inventa nada</h3><p>Ni empleadores, ni cargos, ni títulos, ni certificaciones, ni años, ni métricas que no tengas.</p></div>
            <div className="pill"><div className="ic">⊕</div><h3>Preserva tu evidencia</h3><p>Métricas, marcas, links, proyectos propios, GitHub y tu stack por cada rol. Lo valioso se queda.</p></div>
            <div className="pill"><div className="ic">⇄</div><h3>Te habla de tu vacante</h3><p>Cruza tu CV real contra esa vacante específica, no contra consejos genéricos de internet.</p></div>
            <div className="pill"><div className="ic">✎</div><h3>Tú tienes la última palabra</h3><p>Editas todo antes de descargar y exportas en PDF, Word o TXT compatible con ATS.</p></div>
          </div>
          <p className="privacy-note reveal in">Tu CV contiene datos sensibles. El pago lo procesa Stripe y no guardamos los datos de tu tarjeta. Privacidad, términos y opción de eliminar tus datos, visibles antes de pagar.</p>
        </div>
      </section>

      <section className="light section-alt">
        <div className="wrap">
          <div className="sec-head reveal in"><span className="kicker">Para quién es</span><h2>Para que cada aplicación cuente.</h2></div>
          <div className="who reveal in">
            <div className="whocard"><q>“Tengo varias vacantes parecidas. ¿A cuál aplico primero?”</q><p>Un score distinto por cada vacante. Sabes dónde vale la pena el esfuerzo.</p></div>
            <div className="whocard"><q>“Puedo aplicar a PM, UX o Dev. Mi CV grita uno solo.”</q><p>Reposiciona tus fortalezas transferibles por rol, sin inventar cargos.</p></div>
            <div className="whocard"><q>“Mi CV está en español y la vacante en inglés. O al revés.”</q><p>Adapta tu CV al otro idioma con lenguaje profesional real, listo para remoto global.</p></div>
          </div>
        </div>
      </section>

      <section className="light" id="precios">
        <div className="wrap">
          <div className="sec-head reveal in"><span className="kicker">Precios</span><h2>Simple. Sin suscripción. El primero es gratis.</h2><p>Tu primer análisis es gratis. Estos planes son para comprar análisis adicionales: cada uno compara tu CV contra 1 vacante y genera un CV adaptado descargable.</p></div>
          <div className="plans reveal in">
            {plans.map((plan) => (
              <div className={`plan ${plan.featured ? 'feat' : ''}`} key={plan.key}>
                {plan.featured && <span className="ptag">Más elegido</span>}
                <h3>{plan.name}</h3><p className="blurb">{plan.blurb}</p>
                <div className="price">{plan.price}<small> USD</small></div><div className="per">{plan.per}</div>
                <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
                <Link href={`/dashboard?intent=checkout&pack=${plan.key}`} onClick={() => trackEvent('pricing_pack_click', { pack: plan.key, location: 'landing_pricing', intent: 'checkout' })} className={`pbtn ${plan.featured ? 'solid' : 'outline'}`}>Comprar {plan.name}</Link>
              </div>
            ))}
          </div>
          <p className="privacy-note reveal in">Empieza gratis, sin tarjeta. Si te sirve, compras más análisis. Te pedimos tu email solo para guardar tus créditos e historial.</p>
        </div>
      </section>

      <section className="light section-alt">
        <div className="wrap">
          <div className="sec-head reveal in"><span className="kicker">Antes de empezar</span><h2>Las preguntas que sí importan.</h2></div>
          <div className="faq reveal in">
            <details open><summary>¿Esto me garantiza que voy a conseguir trabajo?</summary><p>No, y desconfía de quien te lo prometa. Lo que sí hace es atacar el punto donde se cae la mayoría de buenos perfiles: hoy gran parte de los CV quedan descartados por un filtro automático antes de que un humano los lea. RevisaMiCV mejora la compatibilidad de tu CV con esa vacante específica para que apliques con más fuerza. La entrevista la ganas tú; lo nuestro es que llegues a tenerla.</p></details>
            <details><summary>¿Va a inventar experiencia que no tengo?</summary><p>Nunca. Es la regla central del producto: no inventa empleadores, cargos, títulos, certificaciones, años ni métricas. Toma tu experiencia real y la reescribe en el lenguaje que la vacante busca. La credibilidad en la entrevista es tuya y la protegemos.</p></details>
            <details><summary>¿El score es real o es decorativo?</summary><p>Es real: mide qué tan alineado está tu CV con el texto de esa vacante específica. Keywords, experiencia relevante y brechas. No predice el algoritmo interno de cada empresa ni promete entrevistas. Sirve para algo concreto: priorizar a cuál aplicar fuerte y qué arreglar antes de enviar.</p></details>
            <details><summary>¿Tengo que suscribirme?</summary><p>No. Compras créditos una sola vez y no vencen. Sin cobros mensuales, sin tarjeta para el primer análisis, sin la trampa de la suscripción que se te olvidó cancelar.</p></details>
          </div>
        </div>
      </section>

      <section className="final">
        <div className="wrap">
          <h2>Antes de mandar otro CV al silencio, revisa si encaja.</h2>
          <p>El primer análisis es gratis. Si te sirve, compras créditos. Sin suscripción.</p>
          <LandingCta location="final">Analiza tu primer CV gratis &rarr;</LandingCta>
          <div className="microtrust" style={{ marginTop: 24 }}><span>Sin tarjeta</span><span>3 minutos</span><span>Español ⇄ inglés</span></div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="col" style={{ maxWidth: 260 }}><div className="logo" style={{ marginBottom: 12 }}><b>R</b> RevisaMiCV</div><p style={{ fontSize: '.84rem' }}>CVs adaptados a vacantes reales, sin inventar experiencia.</p></div>
          <div className="col"><h4>Producto</h4><ul><li><a href="#como">Cómo funciona</a></li><li><a href="#precios">Precios</a></li><li><Link href="/dashboard">Dashboard</Link></li></ul></div>
          <div className="col"><h4>Recursos</h4><ul><li><Link href="/blog">Blog</Link></li><li><Link href="/recursos/adaptar-cv-a-vacante">Adaptar tu CV a una vacante</Link></li><li><Link href="/recursos/optimizar-cv-ats">Optimizar tu CV para ATS</Link></li><li><Link href="/recursos/cv-en-ingles-para-remoto">CV en inglés para remoto</Link></li></ul></div>
          <div className="col"><h4>Legal</h4><ul><li><Link href="/privacidad">Privacidad</Link></li><li><Link href="/terminos">Términos</Link></li><li><Link href="/soporte">Soporte</Link></li></ul></div>
          <div className="copy">© 2026 RevisaMiCV. Hecho para que esta vez sí te vean.</div>
        </div>
      </footer>
    </>
  )
}
