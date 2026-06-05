import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://revisamicv.lat').trim().replace(/\/+$/, '')

type Resource = {
  slug: string
  title: string
  description: string
  eyebrow: string
  intro: string
  keywords: string[]
  sections: Array<{ heading: string; body: string[] }>
  checklist: string[]
}

export const resources: Resource[] = [
  {
    slug: 'adaptar-cv-a-vacante',
    title: 'Cómo adaptar tu CV a una vacante específica sin inventar experiencia',
    description: 'Guía práctica para adaptar tu CV a cada vacante: keywords, logros, brechas y formato ATS sin exagerar ni inventar experiencia.',
    eyebrow: 'Guía práctica',
    intro: 'Un CV genérico intenta servir para todo y termina sin hablarle a nadie. Adaptar tu CV no significa mentir: significa ordenar tu experiencia real para que la vacante entienda rápido por qué encajas.',
    keywords: ['adaptar CV a vacante', 'CV para una vacante', 'mejorar curriculum vitae', 'aplicar a empleo'],
    sections: [
      { heading: 'Empieza por la vacante, no por tu CV', body: ['Subraya responsabilidades, herramientas, seniority y resultados esperados. Luego revisa si tu CV muestra evidencia real de esas cosas. Si la vacante pide coordinación con stakeholders y tu CV solo dice “responsable del proyecto”, hay oportunidad de hacerlo más claro.'] },
      { heading: 'Reescribe logros con evidencia', body: ['La fórmula útil es acción + contexto + resultado verificable. No inventes métricas: si no tienes número, usa alcance real, herramientas, tipo de equipo o entregable. La credibilidad importa más que sonar impresionante.'] },
      { heading: 'Detecta brechas antes de aplicar', body: ['Si una vacante pide algo que no tienes, no lo ocultes ni lo inventes. Compensa mostrando experiencia transferible o decide si esa aplicación merece tu tiempo.'] },
    ],
    checklist: ['Pega la vacante completa', 'Identifica 5–10 keywords importantes', 'Reordena logros relevantes arriba', 'Elimina ruido que no ayuda a esa vacante', 'Descarga una versión específica para esa aplicación'],
  },
  {
    slug: 'optimizar-cv-ats',
    title: 'Cómo optimizar tu CV para ATS sin destruir tu historia profesional',
    description: 'Qué significa ATS, cómo usar keywords de la vacante y cómo preparar un CV legible para filtros automáticos y reclutadores.',
    eyebrow: 'ATS y filtros',
    intro: 'ATS no es magia: muchos sistemas leen formato, títulos, fechas y palabras clave antes de que una persona revise tu CV. Optimizar para ATS es hacerlo claro, escaneable y alineado con la vacante.',
    keywords: ['optimizar CV ATS', 'curriculum ATS', 'score ATS CV', 'keywords ATS'],
    sections: [
      { heading: 'Usa lenguaje de la vacante', body: ['Si la vacante dice “customer success”, “SQL”, “stakeholder management” o “React”, tu CV debe usar esas palabras cuando sean ciertas. No basta con una descripción bonita si el sistema busca términos concretos.'] },
      { heading: 'Evita formatos que rompen lectura', body: ['Tablas complejas, columnas raras, íconos como única etiqueta o diseños demasiado visuales pueden dificultar la lectura automática. Una versión ATS puede ser sobria y fuerte al mismo tiempo.'] },
      { heading: 'No llenes el CV de keywords falsas', body: ['Keyword stuffing se nota. El objetivo es conectar palabras clave con experiencia real: proyectos, responsabilidades, herramientas y resultados.'] },
    ],
    checklist: ['Usa títulos de sección simples', 'Incluye herramientas reales', 'Conecta keywords con logros', 'Evita información en imágenes', 'Prueba una versión PDF/DOCX descargable'],
  },
  {
    slug: 'cv-en-ingles-para-remoto',
    title: 'CV en inglés para vacantes remotas: adaptar no es traducir literal',
    description: 'Consejos para convertir tu CV del español al inglés para trabajos remotos sin sonar traducido, exagerado o genérico.',
    eyebrow: 'Remoto global',
    intro: 'Cuando aplicas a vacantes remotas en inglés, traducir palabra por palabra suele sonar raro. Lo importante es adaptar tu experiencia al lenguaje profesional que esa vacante espera.',
    keywords: ['CV en inglés', 'curriculum en inglés', 'CV para remoto', 'adaptar CV inglés'],
    sections: [
      { heading: 'Traduce intención, no solo palabras', body: ['“Encargado de” puede sonar débil si el rol real implicaba ownership. “Led”, “coordinated”, “owned” o “supported” dependen de lo que realmente hiciste.'] },
      { heading: 'Mantén nombres y evidencia verificable', body: ['No cambies cargos, empresas o años. Sí puedes explicar proyectos, herramientas y logros con términos que un reclutador global entienda.'] },
      { heading: 'Cuida tono y claridad', body: ['Un buen CV en inglés suele ser directo: verbos fuertes, bullets concretos, tecnologías claras y menos frases largas.'] },
    ],
    checklist: ['Pega la vacante en inglés', 'Convierte bullets relevantes', 'Mantén métricas reales', 'Evita traducciones literales', 'Descarga PDF/DOCX listo para aplicar'],
  },
]

export function getResource(slug: string) {
  return resources.find((resource) => resource.slug === slug)
}

export function generateStaticParams() {
  return resources.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const resource = getResource(slug)
  if (!resource) return {}
  const url = `${appUrl}/recursos/${resource.slug}`
  return {
    title: resource.title,
    description: resource.description,
    keywords: resource.keywords,
    alternates: { canonical: `/recursos/${resource.slug}` },
    openGraph: {
      title: resource.title,
      description: resource.description,
      url,
      siteName: 'RevisaMiCV.lat',
      locale: 'es_CO',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: resource.title,
      description: resource.description,
    },
  }
}

export default async function ResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const resource = getResource(slug)
  if (!resource) notFound()

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: resource.title,
    description: resource.description,
    inLanguage: 'es-CO',
    mainEntityOfPage: `${appUrl}/recursos/${resource.slug}`,
    publisher: { '@type': 'Organization', name: 'RevisaMiCV.lat' },
  }

  return (
    <main className="resource-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <div className="shell">
        <Link href="/" className="brand"><span>R</span> RevisaMiCV</Link>
        <article>
          <p className="eyebrow">{resource.eyebrow}</p>
          <h1>{resource.title}</h1>
          <p className="intro">{resource.intro}</p>
          <Link href="/analizar" className="cta">Analizar mi CV gratis →</Link>
          {resource.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
          <section className="checklist">
            <h2>Checklist rápido antes de aplicar</h2>
            <ul>{resource.checklist.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <div className="final-card">
            <h2>¿Quieres hacerlo con una vacante real?</h2>
            <p>Sube tu CV, pega la vacante y recibe score, brechas, keywords y una versión adaptada descargable.</p>
            <Link href="/analizar" className="cta">Probar primer análisis gratis</Link>
          </div>
        </article>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .resource-page{min-height:100vh;background:#0e0a14;color:#f3f0f7;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.shell{max-width:860px;margin:0 auto;padding:38px 22px 70px}.brand{display:inline-flex;align-items:center;gap:10px;color:#f3f0f7;text-decoration:none;font-weight:800;margin-bottom:52px}.brand span{width:34px;height:34px;border-radius:11px;background:#b24aed;display:grid;place-items:center}article{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.10);border-radius:28px;padding:38px;box-shadow:0 30px 100px rgba(0,0,0,.35)}.eyebrow{color:#cf9bff;text-transform:uppercase;letter-spacing:.16em;font-size:12px;font-weight:800}h1{font-size:clamp(34px,6vw,58px);line-height:1.02;margin:12px 0 18px}h2{font-size:28px;margin:42px 0 12px}.intro,p,li{color:#c9c2d6;font-size:18px;line-height:1.7}.intro{font-size:21px}.cta{display:inline-flex;margin:18px 0 12px;background:#b24aed;color:white;text-decoration:none;font-weight:800;border-radius:999px;padding:14px 20px}.checklist{background:rgba(178,74,237,.10);border:1px solid rgba(178,74,237,.28);border-radius:22px;padding:24px;margin-top:36px}.checklist h2{margin-top:0}.checklist li{margin:10px 0}.final-card{margin-top:36px;background:#f3f0f7;color:#160f20;border-radius:24px;padding:28px}.final-card p{color:#4b4258}.final-card .cta{color:#fff}@media(max-width:640px){article{padding:26px}.shell{padding-inline:16px}}
      ` }} />
    </main>
  )
}
