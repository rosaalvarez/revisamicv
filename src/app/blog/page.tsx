import type { Metadata } from 'next'
import Link from 'next/link'
import { blogPosts } from '@/lib/blog-posts'

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://revisamicv.lat').trim().replace(/\/+$/, '')

export const metadata: Metadata = {
  title: 'Blog de CV, ATS y búsqueda laboral',
  description: 'Guías prácticas para adaptar tu CV a vacantes, mejorar tu compatibilidad ATS y aplicar mejor a trabajos remotos o locales.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog de RevisaMiCV.lat',
    description: 'Guías prácticas de CV, ATS y búsqueda laboral.',
    url: `${appUrl}/blog`,
    siteName: 'RevisaMiCV.lat',
    locale: 'es_CO',
    type: 'website',
  },
}

export default function BlogIndexPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog de RevisaMiCV.lat',
    url: `${appUrl}/blog`,
    blogPost: blogPosts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${appUrl}/blog/${post.slug}`,
      description: post.description,
    })),
  }

  return (
    <main className="blog-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="shell">
        <header className="topbar">
          <Link href="/" className="brand"><span>R</span> RevisaMiCV</Link>
          <Link href="/analizar" className="small-cta">Analizar gratis</Link>
        </header>
        <section className="hero">
          <p className="eyebrow">Blog</p>
          <h1>Guías prácticas para que tu CV le hable a cada vacante.</h1>
          <p>Contenido pensado para indexar búsquedas reales: ATS, CV en inglés, adaptación por vacante, score de compatibilidad y errores comunes al aplicar.</p>
        </section>
        <section className="grid">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="card">
              <div className="meta"><span>{post.category}</span><span>{post.readingMinutes} min</span></div>
              <h2>{post.title}</h2>
              <p>{post.description}</p>
              <div className="read">Leer guía →</div>
            </Link>
          ))}
        </section>
      </div>
      <style dangerouslySetInnerHTML={{ __html: blogCss }} />
    </main>
  )
}

const blogCss = `
.blog-page{min-height:100vh;background:var(--color-paper);color:var(--color-ink);font-family:var(--font-body)}.shell{max-width:1000px;margin:0 auto;padding:34px 22px 72px}.topbar{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:48px;border-bottom:1px solid var(--color-line);padding-bottom:18px}.brand{display:inline-flex;align-items:center;gap:10px;color:var(--color-ink);text-decoration:none;font-family:var(--font-display);font-weight:600}.brand span{width:34px;height:34px;border-radius:9px;background:var(--color-primary);color:#fff;display:grid;place-items:center}.small-cta{color:var(--color-ink);background:var(--color-primary);text-decoration:none;border-radius:9px;padding:11px 16px;font-weight:800;box-shadow:var(--shadow-cta)}.small-cta:hover{background:var(--color-primary-deep);color:#fff}.hero{max-width:760px;text-align:center;margin:0 auto 34px}.eyebrow{color:var(--color-secondary-deep);text-transform:uppercase;letter-spacing:.16em;font-size:12px;font-weight:850}.hero h1{font-family:var(--font-display);font-size:clamp(34px,6vw,58px);line-height:1.08;margin:12px 0 16px}.hero p{color:var(--color-ink-soft);font-size:20px;line-height:1.65}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.card{display:flex;flex-direction:column;gap:14px;background:#fff;border:1px solid var(--color-line);border-radius:18px;padding:24px;color:inherit;text-decoration:none;min-height:300px;box-shadow:0 18px 50px -34px rgba(14,63,58,.45)}.card:hover{border-color:var(--color-primary);transform:translateY(-2px)}.meta{display:flex;justify-content:space-between;gap:12px;color:var(--color-secondary-deep);font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.card h2{font-family:var(--font-display);font-size:25px;line-height:1.12;margin:0}.card p{color:var(--color-ink-soft);line-height:1.6;margin:0}.read{margin-top:auto;color:var(--color-primary-deep);font-weight:850}@media(max-width:900px){.grid{grid-template-columns:1fr 1fr}}@media(max-width:640px){.grid{grid-template-columns:1fr}.topbar{align-items:flex-start}.hero h1{font-size:40px}}
`
