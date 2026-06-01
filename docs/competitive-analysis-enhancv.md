# Competitive analysis: Enhancv vs RevisaMiCV

Fecha: 2026-06-01

## Objetivo

Analizar Enhancv y competidores de AI resume/CV para decidir qué implementar en RevisaMiCV y cómo posicionarlo para superar herramientas existentes, especialmente para LATAM + aplicaciones internacionales.

## Fuentes revisadas

- Enhancv home: https://enhancv.com/
- Enhancv app onboarding: https://app.enhancv.com/onboarding/
- Enhancv AI Resume Builder: https://enhancv.com/ai-resume-builder/
- Enhancv Resume Templates: https://enhancv.com/resume-templates/
- Enhancv Resume Checker: https://enhancv.com/resources/resume-checker/
- Enhancv Cover Letter Generator: https://enhancv.com/cover-letter-generator/
- Enhancv Job Application Tracker: https://enhancv.com/features/job-application-tracker/
- Enhancv pricing: https://enhancv.com/pricing/
- Rezi: https://www.rezi.ai/ and https://www.rezi.ai/pricing
- Jobscan: https://www.jobscan.co/pricing
- Kickresume: https://www.kickresume.com/en/pricing/
- Zety: https://zety.com/pricing

## Enhancv: qué hacen bien

### Posicionamiento

Enhancv vende una suite completa: resume builder + plantillas + AI writer + ATS checker + cover letters + job tracker + job search.

Promesas visibles:

- Land more interviews.
- ATS Check.
- AI Writer.
- One-click job tailoring.
- Templates ATS-tested.
- Job tracker.

### UX/onboarding

Flujo observado:

1. Persona/guía: “Julia, your personal resume expert”.
2. Pregunta si el usuario ya tiene CV.
3. Si no tiene CV, pregunta cargo deseado.
4. Pregunta prioridad: impresionar reclutadores vs pasar ATS.
5. Recomienda plantillas/flujo según prioridad.

Patrón clave: no empieza con una pantalla fría; lo convierte en conversación guiada.

### Funciones AI

- Tailoring de CV por descripción de vacante.
- Job match en segundos.
- Keyword matching.
- Summary generator.
- Bullet point generator.
- Skills extractor.
- Cover letter generator.
- Resume checker con múltiples checks.
- Traducción AI a múltiples idiomas.

### ATS/checker

Enhancv no solo dice “ATS-friendly”; lo desglosa en checks:

- Parseabilidad.
- Repetición.
- Gramática.
- Logros cuantificados.
- Formato/tamaño.
- Longitud.
- Bullets largos.
- Hard/soft skills.
- Contact info.
- Secciones esenciales.
- Diseño.
- Email.
- Voz activa.
- Buzzwords/clichés.
- Links.

### Templates/export

- Muchas plantillas visuales.
- Filtros por estilo, layout, rol, experiencia, foto/no foto.
- Descarga PDF y TXT en algunas páginas.
- PDF text-based.

### Pricing observado

- Free plan 7 días.
- Pro con precio público referenciado desde ~$14/mes en SEO/title, aunque localización COP se mostró rara en la sesión.
- Pro incluye muchas plantillas, ATS check, sugerencias, no branding, etc.

## Competidores adicionales

### Rezi

- Foco fuerte en ATS + AI resume builder.
- AI keyword targeting.
- Resume score.
- Pricing: Free, Pro US$29/mes, Lifetime US$149.
- Social proof fuerte: millones de usuarios.

### Jobscan

- Competidor más directo en CV vs vacante.
- Free: scans mensuales limitados.
- Paid: scans ilimitados, AI optimizations, cover letter, bullet generator, LinkedIn optimizer, job match.
- Pricing alto: alrededor de US$49.95/mes mensual o US$29.98/mes trimestral.

### Kickresume

- Más suite creativa/career tools.
- 40+ templates, AI writer, ATS checker, career map, LinkedIn/PDF import, móvil.
- Pricing desde US$19 mensual; anual barato.

### Zety / Resume.io-like

- Builder + plantillas + descarga.
- Trial barato con renovación fuerte.
- PDF/Word/TXT, resume check, cover letter.

## RevisaMiCV hoy: fortalezas

- Flujo ya enfocado en una vacante real.
- Upload PDF/DOCX/TXT.
- Vacante pegada.
- Score de compatibilidad.
- Fortalezas, gaps, keywords, warnings.
- PDF ATS.
- Bilingüe EN/ES.
- Dashboard/historial.
- Tokens/Stripe.
- 1 análisis gratis.
- Anti-invención como diferencial ético.
- Pricing simple y más accesible para LATAM.

## RevisaMiCV hoy: brechas

### Producto

- No hay editor editable del CV antes de descargar.
- Solo una plantilla PDF ATS.
- No hay DOCX/TXT export.
- Cover letter existe como texto, pero no como producto descargable.
- No hay score breakdown por categorías.
- No hay before/after visual por sección.
- No hay tracker de postulaciones.
- No hay comparación de múltiples vacantes.
- No hay import desde LinkedIn.
- No hay onboarding tipo asistente.
- No hay centro de privacidad/data deletion visible.

### Seguridad/trust

- Dashboard por email, sin auth real.
- RLS MVP permisivo.
- Antes de escalar, requiere Supabase Auth + RLS fuerte.

## Estrategia para superar, no copiar

No conviene competir contra Enhancv como “builder con 100 plantillas”. Ellos ya ganan en visual builder/SEO.

RevisaMiCV debe posicionarse como:

> La herramienta que decide si vale la pena aplicar, adapta tu CV a esa vacante y te entrega el paquete completo de postulación en español/inglés para LATAM + remoto internacional.

## Diferenciadores defendibles

1. Vacancy-first, no template-first.
2. LATAM-first: precios, idioma, ejemplos, monedas, mercados y tono.
3. Honest-fit engine: apply / adapt / skip.
4. Multi-vacancy comparison: subir un CV y comparar 5-10 vacantes.
5. Application kit: CV + carta + email recruiter + LinkedIn DM.
6. Anti-invención explícito: protege al usuario de mentir.
7. Pay-per-use transparente, sin suscripciones sorpresa.
8. Dashboard de búsqueda laboral, no solo builder.

## Roadmap recomendado

### Fase 1 — Quick wins de alto ROI, 2-5 días

1. Cover letter descargable en PDF.
2. Export TXT ATS.
3. Copy-to-clipboard para CV, carta, email recruiter y LinkedIn DM.
4. Score breakdown por categorías:
   - Skills match.
   - Experience match.
   - Seniority match.
   - Keyword match.
   - ATS format.
   - Recruiter clarity.
5. Before/after por sección:
   - Summary original vs optimizado.
   - Bullets originales vs nuevos.
   - Skills faltantes vs incluidas.
6. Onboarding copy tipo asistente:
   - “¿Ya tienes CV?”
   - “¿A qué mercado aplicas?”
   - “¿Quieres CV en inglés o español?”

### Fase 2 — Diferenciación comercial, 1-2 semanas

1. Application Kit por vacante:
   - CV ATS PDF.
   - Cover letter PDF.
   - Email corto para recruiter.
   - Mensaje LinkedIn.
   - Lista de keywords para portal ATS.
2. Dashboard por aplicaciones:
   - Empresa.
   - Cargo.
   - Score.
   - Estado: guardada, aplicada, entrevista, oferta, rechazada.
   - PDF generado.
3. Comparador de vacantes:
   - Un CV contra varias vacantes.
   - Ranking: aplicar ahora / adaptar / no recomendado.
4. DOCX export.

### Fase 3 — Moat, 3-6 semanas

1. Master CV/profile.
2. Editor editable por secciones.
3. Versiones por vacante.
4. 3-5 plantillas, no 100:
   - ATS internacional.
   - LATAM profesional.
   - Tech/remote.
   - Ejecutivo.
   - Entry-level.
5. Supabase Auth + RLS fuerte.
6. Privacy center:
   - borrar datos.
   - exportar datos.
   - retención clara.

## Priorización brutal

Si queremos vender rápido, no construir un clon de Enhancv.

Orden recomendado:

1. Application Kit completo.
2. Score breakdown más creíble.
3. Cover letter PDF + email + LinkedIn DM.
4. Comparador de 3-5 vacantes.
5. Dashboard por postulaciones.
6. DOCX export.
7. Auth/security.
8. Editor y templates.

## Landing/copy recomendado

Headline:

> No apliques a ciegas. Sube tu CV, pega la vacante y recibe tu paquete de postulación listo.

Subheadline:

> RevisaMiCV calcula tu compatibilidad, detecta gaps reales y genera CV ATS + carta + mensaje recruiter en español o inglés, sin inventar experiencia.

Oferta:

> 1 análisis gratis. Luego compra créditos. Sin suscripciones sorpresa.

## Qué NO hacer todavía

- No construir 100 plantillas.
- No hacer un builder visual complejo antes de validar más ventas.
- No competir en “diseño bonito” contra Canva/Enhancv.
- No prometer “pasa ATS garantizado”.
- No crear suscripción mensual como default para job seekers bursty.

## Próxima implementación sugerida

Implementar “Application Kit”:

- Extender prompt para devolver:
  - coverLetterStructured
  - recruiterEmail
  - linkedinMessage
  - portalKeywords
  - scoreBreakdown
- UI resultado con pestañas:
  - Diagnóstico
  - CV ATS
  - Carta
  - Email recruiter
  - LinkedIn DM
  - Keywords portal
- Descargas:
  - CV PDF
  - Carta PDF
  - TXT ATS
- Guardar todo en historial.

Este set puede hacer que RevisaMiCV sea más útil que Enhancv para una persona que necesita aplicar hoy a una vacante real.
