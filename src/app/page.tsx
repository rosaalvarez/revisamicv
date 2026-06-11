'use client'

import Link from 'next/link'
import { UserIcon } from '@/components/icons'
import { trackEvent } from '@/lib/analytics'

const plans = [
  {
    key: 'basic',
    name: 'Básico',
    blurb: 'Para revisar varias postulaciones sin pagar una suscripción.',
    price: '$5',
    per: 'Pago único · 5 análisis · $1 por vacante',
    features: ['5 análisis adicionales', 'Score CV vs vacante /100', 'Brechas y fortalezas', 'Keywords recomendadas', 'CV adaptado PDF / DOCX / TXT'],
    featured: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    blurb: 'Para aplicar a más vacantes con mejor costo por vacante.',
    price: '$12',
    per: 'Pago único · 15 análisis · $0.80 por vacante',
    features: ['Todo lo del plan Básico', '15 análisis en tu cuenta', 'Historial en tu dashboard', 'Úsalo con 15 vacantes distintas', 'Créditos sin vencimiento'],
    featured: true,
  },
  {
    key: 'premium',
    name: 'Premium',
    blurb: 'Para una búsqueda activa con muchas postulaciones.',
    price: '$19',
    per: 'Pago único · 30 análisis · $0.63 por vacante',
    features: ['Todo lo del plan Pro', '30 análisis en tu cuenta', 'Historial completo', 'Úsalo con 30 vacantes distintas', 'Créditos sin vencimiento'],
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
      <nav className="site-nav">
        <div className="wrap">
          <Link href="/" className="logo"><b>R</b> RevisaMiCV</Link>
          <div className="navlinks">
            <Link href="/analizar">Analizar</Link>
            <Link href="/blog">Blog</Link>
            <a href="#precios">Precios</a>
          </div>
          <Link href="/dashboard" aria-label="Mi panel" className="nav-account">
            <UserIcon className="h-4 w-4" />
            <span>Mi panel</span>
          </Link>
        </div>
      </nav>

      <header className="hero">
        <div className="wrap">
          <span className="badge"><span className="dot" /> Sin registro · primer análisis gratis</span>
          <h1>Antes de enviar otro CV, asegúrate de que diga lo que esa vacante está buscando.</h1>
          <p className="sub">Sube tu CV, pega la oferta y recibe un análisis claro: qué coincide, qué falta y cómo ajustarlo para que tenga más opciones de pasar el primer filtro.</p>

          <div className="hero-search" aria-label="Resumen de los pasos antes de empezar el análisis">
            <div className="hero-seg">
              <div className="lbl">Paso 1</div>
              <div className="val">Subirás tu CV en la siguiente pantalla</div>
            </div>
            <div className="hero-divider" />
            <div className="hero-seg">
              <div className="lbl">Paso 2</div>
              <div className="val">Pegarás la vacante antes de analizar</div>
            </div>
            <LandingCta location="hero_search">Empezar análisis</LandingCta>
          </div>

          <p className="freenote"><b>Primer análisis gratis.</b> Sin tarjeta. Diagnóstico claro en español o inglés.</p>
          <div className="trust-stats">
            <div className="stat"><b>0-100%</b><span>porcentaje de ajuste</span></div>
            <div className="stat"><b>CV + oferta</b><span>comparación real</span></div>
            <div className="stat"><b>ES · EN</b><span>resultado bilingüe</span></div>
            <div className="stat"><b>Sin inventar</b><span>solo mejora lo que ya tienes</span></div>
          </div>
        </div>
      </header>

      <section className="sec" id="dolor">
        <div className="wrap">
          <div className="stakes">
            <div className="stakes-head">
              <span className="kicker">Lo que de verdad está en juego</span>
              <h2>No es solo conseguir trabajo. Es recuperar la vida que quedó en pausa.</h2>
              <p className="lead">Cuando nadie responde, no solo se frustra una postulación. Se frena el dinero, la tranquilidad y las decisiones que dependen de volver a tener estabilidad.</p>
            </div>

            <div className="stakes-body">
              <div className="stakes-panel">
                <h3>Lo que también se queda esperando</h3>
                <p>Desde afuera parece solo una búsqueda de empleo. Por dentro se siente como tener media vida detenida.</p>
                <div className="stakes-list">
                  <div className="stake-item"><span className="dot" />La cita médica que pospones porque ahora no quieres sumar otro gasto.</div>
                  <div className="stake-item"><span className="dot" />La deuda que quieres cerrar para dejar de vivir haciendo cuentas.</div>
                  <div className="stake-item"><span className="dot" />El apartamento, el viaje, el gimnasio o el plan que quedó en standby.</div>
                  <div className="stake-item"><span className="dot" />La conversación que siempre termina en: “cuando tenga plata”.</div>
                  <div className="stake-item"><span className="dot" />La tranquilidad de decidir sin sentir que todo depende del próximo “te llamamos”.</div>
                </div>
              </div>

              <div className="stakes-result">
                <div>
                  <div className="label"><span /> El punto crítico</div>
                  <blockquote>El silencio no siempre significa que no sirvas. A veces significa que tu CV no está diciendo lo que la vacante necesita leer.</blockquote>
                </div>
                <p>Por eso RevisaMiCV cruza tu hoja de vida con la oferta real: para mostrar tu porcentaje de ajuste, las palabras que faltan, lo que sí juega a tu favor y cómo mejorar el CV antes de enviarlo.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec" id="como">
        <div className="wrap">
          <div className="sec-head">
            <span className="kicker">Cómo funciona</span>
            <h2>Así sabes qué cambiar antes de aplicar.</h2>
            <p>Muchas veces el problema no es tu experiencia: es que tu CV no está conectado con la vacante, le faltan palabras clave o tus logros están escritos de forma demasiado general.</p>
          </div>

          <div className="cards">
            <div className="card"><div className="ic">1</div><div className="step">PASO 1</div><h3>Subes tu CV</h3><p>Carga tu hoja de vida en PDF, Word o TXT. Sin formularios largos ni tarjeta.</p></div>
            <div className="card"><div className="ic">2</div><div className="step">PASO 2</div><h3>Pegas la vacante</h3><p>Usamos el texto real de la oferta para revisar si tu perfil está alineado.</p></div>
            <div className="card"><div className="ic">3</div><div className="step">PASO 3</div><h3>Ves qué mejorar</h3><p>Recibes coincidencias, vacíos y una versión ajustada para esa postulación, sin inventar experiencia.</p></div>
          </div>

          <div className="diff-card">
            <div className="diff-top">
              <div className="dt-left">
                <div className="dial"><div><strong>78</strong><span>/100 ajuste</span></div></div>
                <h3>Tu CV no necesita sonar bonito. Necesita responderle a esa vacante.</h3>
                <p>El análisis no se basa en consejos genéricos. Cruza tu experiencia con requisitos, keywords y contexto de la oferta.</p>
              </div>
              <div className="dt-right">
                <div className="match"><b>Lo que ya juega a tu favor</b><p>Experiencia, herramientas y logros que sí conectan con la vacante.</p></div>
                <div className="gap"><b>Lo que conviene ajustar</b><p>Palabras clave, evidencias o enfoques que hoy no están claros en tu CV.</p></div>
              </div>
            </div>
            <div className="diff-bottom">
              <div className="drow"><span className="ko">“Responsable de coordinar equipo”</span><span className="ar">→</span><span className="ok">“Coordiné prioridades entre producto, desarrollo y stakeholders.”</span></div>
              <div className="drow"><span className="ko">“Hice tareas de testing”</span><span className="ar">→</span><span className="ok">“Documenté pruebas y procesos para mejorar calidad y trazabilidad.”</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="scope-panel">
            <div className="scope-copy">
              <span className="kicker">Qué hace la herramienta</span>
              <h2>Convierte tu CV en una respuesta directa a la vacante.</h2>
              <p>La idea no es adornar ni inventar. Es hacer visible lo que ya tienes, ordenar mejor tus logros y acercar tu CV al lenguaje exacto de la oferta.</p>
            </div>
            <div className="scope-grid">
              <div className="scope-card yes">
                <h3>Lo que sí hace</h3>
                <ul>
                  <li>Calcula un porcentaje de ajuste entre tu CV y la vacante.</li>
                  <li>Detecta palabras clave, requisitos y habilidades que faltan.</li>
                  <li>Te muestra qué partes de tu experiencia ya coinciden.</li>
                  <li>Reescribe frases débiles para que suenen más claras y específicas.</li>
                </ul>
              </div>
              <div className="scope-card no">
                <h3>Lo que no hace</h3>
                <ul>
                  <li>No inventa experiencia, cargos, estudios ni resultados.</li>
                  <li>No promete contratación, porque eso depende del proceso.</li>
                  <li>No envía postulaciones por ti.</li>
                  <li>No reemplaza tu criterio: tú decides qué versión usar.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec" id="precios">
        <div className="wrap">
          <div className="sec-head">
            <span className="kicker">Precios</span>
            <h2>Pago único. Sin suscripción.</h2>
            <p>Tu primer análisis es gratis. Si te sirve, compras más análisis para comparar tu CV contra vacantes distintas.</p>
          </div>
          <div className="plans">
            {plans.map((plan) => (
              <div className={`plan ${plan.featured ? 'feat' : ''}`} key={plan.key}>
                {plan.featured && <span className="ptag">Más elegido</span>}
                <h3>{plan.name}</h3>
                <p className="blurb">{plan.blurb}</p>
                <div className="price">{plan.price}<small> USD</small></div>
                <div className="per">{plan.per}</div>
                <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
                <Link href={`/dashboard?intent=checkout&pack=${plan.key}`} onClick={() => trackEvent('pricing_pack_click', { pack: plan.key, location: 'landing_pricing', intent: 'checkout' })} className={`pbtn ${plan.featured ? 'solid' : 'outline'}`}>Elegir {plan.name}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-head">
            <span className="kicker">Antes de empezar</span>
            <h2>Las preguntas que sí importan.</h2>
          </div>
          <div className="faq">
            <details open><summary>¿Esto me garantiza que voy a conseguir trabajo?</summary><p>No. Lo que sí hace es atacar un punto donde se caen muchos perfiles: el CV no muestra con claridad lo que esa vacante necesita leer. La entrevista la ganas tú; esto ayuda a que llegues con más fuerza.</p></details>
            <details><summary>¿Va a inventar experiencia que no tengo?</summary><p>No. La regla central es no inventar empleadores, cargos, títulos, certificaciones, años ni métricas. Toma tu experiencia real y la reescribe con más claridad.</p></details>
            <details><summary>¿Tengo que suscribirme?</summary><p>No. El primer análisis es gratis y los planes son de pago único. Compras análisis adicionales solo si te sirve.</p></details>
          </div>
        </div>
      </section>

      <section className="final">
        <div className="wrap">
          <h2>No mandes otro CV a ciegas.</h2>
          <p>Sube tu CV, pega la vacante y mira qué cambiar antes de aplicar.</p>
          <LandingCta location="final">Analizar mi CV gratis</LandingCta>
          <div className="microtrust" style={{ marginTop: 24 }}><span>Sin tarjeta</span><span>Sin inventar</span><span>PDF / DOCX / TXT</span></div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="col" style={{ maxWidth: 270 }}><div className="logo" style={{ marginBottom: 12 }}><b>R</b> RevisaMiCV</div><p>CVs adaptados a vacantes reales, sin inventar experiencia.</p></div>
          <div className="col"><h4>Producto</h4><ul><li><a href="#como">Cómo funciona</a></li><li><a href="#precios">Precios</a></li><li><Link href="/dashboard">Mi panel</Link></li></ul></div>
          <div className="col"><h4>Recursos</h4><ul><li><Link href="/blog">Blog</Link></li><li><Link href="/recursos/adaptar-cv-a-vacante">Guía para tu CV</Link></li><li><Link href="/recursos/optimizar-cv-ats">Cómo pasar el ATS</Link></li></ul></div>
          <div className="col"><h4>Legal</h4><ul><li><Link href="/privacidad">Privacidad</Link></li><li><Link href="/terminos">Términos</Link></li><li><Link href="/soporte">Contacto</Link></li></ul></div>
          <div className="copy">© 2026 RevisaMiCV. Hecho para revisar antes de aplicar.</div>
        </div>
      </footer>
    </>
  )
}
