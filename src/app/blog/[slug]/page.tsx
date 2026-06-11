import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { blogPosts, getBlogPost } from '@/lib/blog-posts'

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://revisamicv.lat').trim().replace(/\/+$/, '')

export function generateStaticParams() {
  return blogPosts.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${appUrl}/blog/${post.slug}`,
      siteName: 'RevisaMiCV',
      images: [{ url: '/og.png', width: 1200, height: 630, alt: 'RevisaMiCV — Score de compatibilidad y CV adaptado' }],
      locale: 'es_CO',
      type: 'article',
      publishedTime: post.date,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: ['/og.png'],
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) notFound()

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: 'es-CO',
    mainEntityOfPage: `${appUrl}/blog/${post.slug}`,
    publisher: { '@type': 'Organization', name: 'RevisaMiCV', url: appUrl },
    keywords: post.keywords.join(', '),
  }

  return (
    <main className="post-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="shell">
        <nav className="topbar">
          <Link href="/" className="brand"><span>R</span> RevisaMiCV</Link>
          <Link href="/blog" className="back">← Blog</Link>
        </nav>
        <article>
          <p className="eyebrow">{post.category} · {post.readingMinutes} min</p>
          <h1>{post.title}</h1>
          <p className="intro">{post.intro}</p>
          <div className="cta-row">
            <Link href="/analizar" className="cta">Analizar mi CV gratis →</Link>
            <Link href="/recursos/adaptar-cv-a-vacante" className="ghost">Ver guía base</Link>
          </div>
          {post.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
          {post.checklist && (
            <section className="checklist">
              <h2>Checklist accionable</h2>
              <ul>{post.checklist.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          )}
          <section className="final-card">
            <h2>Prueba con tu CV y una vacante real</h2>
            <p>RevisaMiCV compara tu CV contra la vacante, detecta brechas, muestra keywords y genera una versión adaptada descargable sin inventar experiencia.</p>
            <Link href="/analizar" className="cta">Hacer primer análisis gratis</Link>
          </section>
        </article>
      </div>
      <style dangerouslySetInnerHTML={{ __html: postCss }} />
    </main>
  )
}

const postCss = `
.post-page{min-height:100vh;background:var(--color-paper);color:var(--color-ink);font-family:var(--font-body)}.shell{max-width:880px;margin:0 auto;padding:34px 22px 72px}.topbar{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:38px;border-bottom:1px solid var(--color-line);padding-bottom:18px}.brand,.back{color:var(--color-ink);text-decoration:none;font-weight:850}.brand{display:inline-flex;align-items:center;gap:10px;font-family:var(--font-display);font-weight:600}.brand span{width:34px;height:34px;border-radius:9px;background:var(--color-primary);color:#fff;display:grid;place-items:center}.back{color:var(--color-secondary-deep)}article{background:#fff;border:1px solid var(--color-line);border-radius:22px;padding:38px;box-shadow:0 24px 70px -46px rgba(14,63,58,.55)}.eyebrow{color:var(--color-secondary-deep);text-transform:uppercase;letter-spacing:.14em;font-size:12px;font-weight:850}h1{font-family:var(--font-display);font-size:clamp(34px,6vw,60px);line-height:1.04;margin:12px 0 18px}h2{font-family:var(--font-display);font-size:28px;margin:42px 0 12px}.intro,p,li{color:var(--color-ink-soft);font-size:18px;line-height:1.72}.intro{font-size:21px;color:var(--color-ink)}.cta-row{display:flex;flex-wrap:wrap;gap:12px;margin:22px 0 8px}.cta,.ghost{display:inline-flex;text-decoration:none;font-weight:850;border-radius:12px;padding:14px 20px}.cta{background:var(--color-primary);color:var(--color-ink);box-shadow:var(--shadow-cta)}.cta:hover{background:var(--color-primary-deep);color:#fff}.ghost{border:1px solid var(--color-line);color:var(--color-ink)}.checklist{background:rgba(15,181,160,.10);border:1px solid rgba(15,181,160,.28);border-radius:18px;padding:24px;margin-top:36px}.checklist h2{margin-top:0}.checklist li{margin:10px 0}.final-card{margin-top:36px;background:var(--color-block);color:var(--color-paper);border-radius:18px;padding:28px}.final-card h2{color:var(--color-paper);margin-top:0}.final-card p{color:#CFE3DE}.final-card .cta{color:var(--color-ink)}@media(max-width:640px){article{padding:26px}.shell{padding-inline:16px}.topbar{align-items:flex-start}}
`
