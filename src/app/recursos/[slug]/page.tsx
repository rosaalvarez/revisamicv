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
      siteName: 'RevisaMiCV',
      images: [{ url: '/og.png', width: 1200, height: 630, alt: 'RevisaMiCV — Score de compatibilidad y CV adaptado' }],
      locale: 'es_CO',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: resource.title,
      description: resource.description,
      images: ['/og.png'],
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
    publisher: { '@type': 'Organization', name: 'RevisaMiCV' },
  }

  return (
    <main className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <div className="mx-auto max-w-4xl px-5 py-10 md:py-12">
        <nav className="mb-10 flex items-center justify-between border-b border-[var(--color-line)] pb-6">
          <Link href="/" className="flex items-center gap-3 font-display text-lg font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--color-primary)] text-sm font-bold text-white">R</span>
            RevisaMiCV
          </Link>
          <Link href="/analizar" className="rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-[var(--color-ink)] transition hover:bg-[var(--color-primary-deep)] hover:text-white">Analizar gratis</Link>
        </nav>

        <article className="rounded-3xl border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-soft)] md:p-10">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--color-secondary-deep)]">{resource.eyebrow}</p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight md:text-6xl">{resource.title}</h1>
          <p className="mt-6 text-xl leading-8 text-[var(--color-ink-soft)]">{resource.intro}</p>
          <Link href="/analizar" className="mt-8 inline-flex rounded-xl bg-[var(--color-primary)] px-6 py-4 text-base font-bold text-[var(--color-ink)] shadow-[var(--shadow-cta)] transition hover:bg-[var(--color-primary-deep)] hover:text-white">Analizar mi CV gratis →</Link>

          <div className="mt-10 space-y-10">
            {resource.sections.map((section) => (
              <section key={section.heading} className="border-t border-[var(--color-line)] pt-8">
                <h2 className="font-display text-3xl font-semibold">{section.heading}</h2>
                {section.body.map((paragraph) => <p key={paragraph} className="mt-3 text-lg leading-8 text-[var(--color-ink-soft)]">{paragraph}</p>)}
              </section>
            ))}
          </div>

          <section className="mt-10 rounded-3xl border border-[rgba(15,181,160,.28)] bg-[rgba(15,181,160,.10)] p-6">
            <h2 className="font-display text-3xl font-semibold">Checklist rápido antes de aplicar</h2>
            <ul className="mt-4 space-y-3 text-lg text-[var(--color-ink-soft)]">
              {resource.checklist.map((item) => <li key={item} className="flex gap-3"><span className="font-bold text-[var(--color-seen)]">✓</span>{item}</li>)}
            </ul>
          </section>

          <div className="mt-10 rounded-3xl bg-[var(--color-block)] p-7 text-[var(--color-paper)] md:p-8">
            <h2 className="font-display text-3xl font-semibold text-white">¿Quieres hacerlo con una vacante real?</h2>
            <p className="mt-3 text-lg leading-8 text-[#CFE3DE]">Sube tu CV, pega la vacante y recibe score, brechas, keywords y una versión adaptada descargable.</p>
            <Link href="/analizar" className="mt-5 inline-flex rounded-xl bg-[var(--color-primary)] px-6 py-4 text-base font-bold text-[var(--color-ink)] transition hover:bg-[var(--color-primary-deep)] hover:text-white">Probar primer análisis gratis</Link>
          </div>
        </article>
      </div>
    </main>
  )
}
