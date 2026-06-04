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
          <Link href="/signup" className="small-cta">Analizar gratis</Link>
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
.blog-page{min-height:100vh;background:#0e0a14;color:#f3f0f7;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.shell{max-width:1120px;margin:0 auto;padding:34px 22px 72px}.topbar{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:64px}.brand{display:inline-flex;align-items:center;gap:10px;color:#f3f0f7;text-decoration:none;font-weight:850}.brand span{width:34px;height:34px;border-radius:11px;background:#b24aed;display:grid;place-items:center}.small-cta{color:white;background:#b24aed;text-decoration:none;border-radius:999px;padding:11px 16px;font-weight:800}.hero{max-width:820px;margin-bottom:34px}.eyebrow{color:#cf9bff;text-transform:uppercase;letter-spacing:.16em;font-size:12px;font-weight:850}.hero h1{font-size:clamp(38px,7vw,76px);line-height:1;margin:10px 0 18px}.hero p{color:#c9c2d6;font-size:21px;line-height:1.65}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.card{display:flex;flex-direction:column;gap:14px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.11);border-radius:24px;padding:24px;color:inherit;text-decoration:none;min-height:310px}.card:hover{border-color:rgba(178,74,237,.55);transform:translateY(-2px)}.meta{display:flex;justify-content:space-between;gap:12px;color:#cf9bff;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.card h2{font-size:25px;line-height:1.12;margin:0}.card p{color:#bfb7cd;line-height:1.6;margin:0}.read{margin-top:auto;color:#fff;font-weight:850}@media(max-width:900px){.grid{grid-template-columns:1fr 1fr}}@media(max-width:640px){.grid{grid-template-columns:1fr}.topbar{align-items:flex-start}.hero h1{font-size:40px}}
`
