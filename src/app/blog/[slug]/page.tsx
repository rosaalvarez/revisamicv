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
      siteName: 'RevisaMiCV.lat',
      locale: 'es_CO',
      type: 'article',
      publishedTime: post.date,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
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
    publisher: { '@type': 'Organization', name: 'RevisaMiCV.lat', url: appUrl },
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
            <Link href="/signup" className="cta">Analizar mi CV gratis →</Link>
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
            <Link href="/signup" className="cta">Hacer primer análisis gratis</Link>
          </section>
        </article>
      </div>
      <style dangerouslySetInnerHTML={{ __html: postCss }} />
    </main>
  )
}

const postCss = `
.post-page{min-height:100vh;background:#0e0a14;color:#f3f0f7;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.shell{max-width:880px;margin:0 auto;padding:34px 22px 72px}.topbar{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:46px}.brand,.back{color:#f3f0f7;text-decoration:none;font-weight:850}.brand{display:inline-flex;align-items:center;gap:10px}.brand span{width:34px;height:34px;border-radius:11px;background:#b24aed;display:grid;place-items:center}.back{color:#cf9bff}article{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.11);border-radius:28px;padding:38px;box-shadow:0 30px 100px rgba(0,0,0,.34)}.eyebrow{color:#cf9bff;text-transform:uppercase;letter-spacing:.14em;font-size:12px;font-weight:850}h1{font-size:clamp(34px,6vw,60px);line-height:1.02;margin:12px 0 18px}h2{font-size:28px;margin:42px 0 12px}.intro,p,li{color:#c9c2d6;font-size:18px;line-height:1.72}.intro{font-size:21px}.cta-row{display:flex;flex-wrap:wrap;gap:12px;margin:22px 0 8px}.cta,.ghost{display:inline-flex;text-decoration:none;font-weight:850;border-radius:999px;padding:14px 20px}.cta{background:#b24aed;color:#fff}.ghost{border:1px solid rgba(255,255,255,.18);color:#f3f0f7}.checklist{background:rgba(178,74,237,.10);border:1px solid rgba(178,74,237,.28);border-radius:22px;padding:24px;margin-top:36px}.checklist h2{margin-top:0}.checklist li{margin:10px 0}.final-card{margin-top:36px;background:#f3f0f7;color:#160f20;border-radius:24px;padding:28px}.final-card p{color:#4b4258}.final-card .cta{color:#fff}@media(max-width:640px){article{padding:26px}.shell{padding-inline:16px}.topbar{align-items:flex-start}}
`
