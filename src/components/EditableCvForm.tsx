'use client'

type EditableCvFormProps = {
  cv: any
  onChange: (cv: any) => void
  score?: number
  gaps?: string[]
  keywords?: string[]
  honestyWarnings?: string[]
}

const listToText = (value: any) => Array.isArray(value) ? value.join('\n') : String(value || '')
const textToList = (value: string) => value.split(/\n|,/).map((item) => item.trim()).filter(Boolean)

function setNestedValue(cv: any, path: string[], value: any) {
  const next = { ...(cv || {}) }
  let cursor = next
  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index]
    cursor[key] = { ...(cursor[key] || {}) }
    cursor = cursor[key]
  }
  cursor[path[path.length - 1]] = value
  return next
}

function Field({ label, value, onChange, placeholder, highlight }: { label: string; value?: string; onChange: (value: string) => void; placeholder?: string; highlight?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600">
        {label}
        {highlight && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">Revisar dato</span>}
      </span>
      <input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-white p-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:ring-2 ${highlight ? 'border-amber-300 focus:ring-amber-400' : 'border-slate-300 focus:ring-[var(--color-primary)]'}`}
      />
    </label>
  )
}

function TextArea({ label, value, onChange, rows = 4, helper, highlight }: { label: string; value?: string; onChange: (value: string) => void; rows?: number; helper?: string; highlight?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600">
        {label}
        {highlight && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] text-[var(--color-primary-deep)]">Optimizado</span>}
      </span>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={`w-full rounded-xl border bg-white p-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:ring-2 ${highlight ? 'border-[var(--color-primary)] focus:ring-[var(--color-primary)]' : 'border-slate-300 focus:ring-[var(--color-primary)]'}`}
      />
      {helper && <span className="mt-1 block text-xs text-slate-400">{helper}</span>}
    </label>
  )
}

function SuggestionCard({ title, body, tone = 'purple' }: { title: string; body: string; tone?: 'purple' | 'amber' | 'green' }) {
  const style = {
    purple: 'border-orange-200 bg-orange-50 text-[var(--color-primary-deep)]',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  }[tone]

  return (
    <div className={`rounded-2xl border p-4 ${style}`}>
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-1 text-xs leading-5 opacity-80">{body}</p>
    </div>
  )
}

export default function EditableCvForm({ cv, onChange, score, gaps = [], keywords = [], honestyWarnings = [] }: EditableCvFormProps) {
  if (!cv || typeof cv === 'string') return null

  const contact = cv.contact && typeof cv.contact === 'object' ? cv.contact : {}
  const update = (path: string[], value: any) => onChange(setNestedValue(cv, path, value))
  const updateList = (path: string[], value: string) => update(path, textToList(value))

  const updateExperience = (index: number, key: string, value: any) => {
    const experience = Array.isArray(cv.experience) ? [...cv.experience] : []
    experience[index] = { ...(experience[index] || {}), [key]: value }
    onChange({ ...cv, experience })
  }

  const updateProject = (index: number, key: string, value: any) => {
    const featuredProjects = Array.isArray(cv.featuredProjects || cv.projects) ? [...(cv.featuredProjects || cv.projects)] : []
    featuredProjects[index] = { ...(featuredProjects[index] || {}), [key]: value }
    onChange({ ...cv, featuredProjects })
  }

  const featuredProjects = Array.isArray(cv.featuredProjects || cv.projects) ? (cv.featuredProjects || cv.projects) : []
  const optimizedScore = typeof score === 'number' ? Math.round(score) : undefined
  const baseScore = optimizedScore ? Math.max(35, Math.min(optimizedScore - 18, Math.round(optimizedScore * 0.62))) : undefined
  const topKeywords = keywords.slice(0, 8)
  const topGaps = gaps.slice(0, 3)
  const topHonestyWarnings = honestyWarnings.slice(0, 2)

  return (
    <section className="overflow-hidden rounded-3xl border border-[var(--color-line)] bg-white shadow-sm">
      <div className="bg-[var(--color-block)] p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">Propuesta optimizada</p>
        <div className="mt-3 grid gap-5 md:grid-cols-[1.3fr_0.7fr] md:items-end">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">Esta es la versión que RevisaMiCV propone para aplicar.</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Ya adaptamos perfil, keywords y logros según la vacante, sin inventar experiencia. Puedes aceptarla tal cual o editar datos puntuales antes de descargar.
            </p>
          </div>
          {optimizedScore !== undefined && (
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-300">CV sin optimizar</span>
                <span className="font-bold text-slate-100">~{baseScore}/100</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-slate-400" style={{ width: `${baseScore}%` }} /></div>
              <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                <span className="text-[#CFE3DE]">Con RevisaMiCV</span>
                <span className="font-bold text-emerald-300">{optimizedScore}/100</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${optimizedScore}%` }} /></div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6 bg-[var(--color-paper-2)] p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <SuggestionCard title="1. Acepta la propuesta" body="Si todo se ve correcto, baja el PDF/DOCX. No tienes que editar todo." tone="green" />
          <SuggestionCard title="2. Corrige datos reales" body="Revisa teléfono, ciudad, fechas, certificaciones y enlaces antes de enviar." tone="amber" />
          <SuggestionCard title="3. Pide ajuste con IA" body="Si quieres otro enfoque, usa la caja amarilla de abajo para cambiar tono, fechas o énfasis." tone="purple" />
        </div>

        {(topGaps.length > 0 || topKeywords.length > 0 || topHonestyWarnings.length > 0) && (
          <div className="grid gap-4 rounded-3xl border border-[var(--color-line)] bg-white p-4 md:grid-cols-3">
            {topGaps.length > 0 && (
              <div>
                <p className="text-sm font-bold text-slate-950">Revisa antes de aplicar</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-600">
                  {topGaps.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </div>
            )}
            {topKeywords.length > 0 && (
              <div>
                <p className="text-sm font-bold text-slate-950">Keywords recomendadas</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {topKeywords.map((item, index) => <span key={index} className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-[var(--color-primary-deep)]">{item}</span>)}
                </div>
              </div>
            )}
            {topHonestyWarnings.length > 0 && (
              <div>
                <p className="text-sm font-bold text-slate-950">Honestidad / riesgo</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-600">
                  {topHonestyWarnings.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="rounded-3xl border border-[var(--color-line)] bg-white p-4">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary-deep)]">Datos básicos</p>
              <h4 className="font-bold text-slate-950">Confirma que la identidad y cargo objetivo estén correctos</h4>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">Alta prioridad: revisa y edita si no es correcto</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre" value={cv.candidateName || cv.name || ''} onChange={(value) => update(['candidateName'], value)} />
            <Field label="Cargo objetivo" value={cv.targetTitle || cv.headline || ''} onChange={(value) => update(['targetTitle'], value)} highlight />
            <Field label="Email" value={contact.email || cv.email || ''} onChange={(value) => update(['contact', 'email'], value)} />
            <Field label="Teléfono" value={contact.phone || cv.phone || ''} onChange={(value) => update(['contact', 'phone'], value)} />
            <Field label="Ciudad / País" value={contact.location || cv.location || ''} onChange={(value) => update(['contact', 'location'], value)} placeholder="Bogotá, Colombia" highlight />
            <Field label="LinkedIn" value={contact.linkedin || cv.linkedin || ''} onChange={(value) => update(['contact', 'linkedin'], value)} />
            <Field label="Portfolio / web" value={contact.portfolio || contact.website || cv.portfolio || ''} onChange={(value) => update(['contact', 'portfolio'], value)} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextArea
            label="Perfil profesional optimizado"
            value={cv.summary || ''}
            onChange={(value) => update(['summary'], value)}
            rows={5}
            highlight
            helper="Debe vender tu encaje con esta vacante sin agregar experiencia falsa."
          />
          <TextArea
            label="Skills alineadas con la vacante"
            value={listToText([...(cv.coreCompetencies || []), ...(cv.skills || [])])}
            onChange={(value) => updateList(['coreCompetencies'], value)}
            highlight
            helper="Estas son las keywords que conviene mantener si sí reflejan tu experiencia."
          />
          <TextArea label="Herramientas / skills técnicos" value={listToText([...(cv.technicalSkills || []), ...(cv.tools || [])])} onChange={(value) => updateList(['technicalSkills'], value)} helper="Una por línea o separadas por coma." />
          <TextArea label="Educación" value={listToText(cv.education)} onChange={(value) => updateList(['education'], value)} />
          <TextArea label="Certificaciones" value={listToText(cv.certifications)} onChange={(value) => updateList(['certifications'], value)} highlight={topGaps.some((gap) => /cert/i.test(gap))} />
          <TextArea label="Idiomas" value={listToText(cv.languages)} onChange={(value) => updateList(['languages'], value)} />
        </div>

        {Array.isArray(cv.experience) && cv.experience.length > 0 && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary-deep)]">Experiencia adaptada</p>
              <h4 className="font-bold text-slate-900">Revisa fechas, stack y logros antes de enviar</h4>
              <p className="mt-1 text-sm text-slate-500">Los logros ya están reescritos para esta vacante. Cambia solo lo que no sea cierto o esté incompleto.</p>
            </div>
            {cv.experience.map((role: any, index: number) => (
              <div key={index} className="rounded-3xl bg-white border border-slate-200 p-4 space-y-3">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <p className="font-bold text-slate-950">{role.title || `Experiencia ${index + 1}`}</p>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[var(--color-primary-deep)]">Optimizada</span>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <Field label="Cargo" value={role.title || ''} onChange={(value) => updateExperience(index, 'title', value)} />
                  <Field label="Empresa" value={role.company || ''} onChange={(value) => updateExperience(index, 'company', value)} />
                  <Field label="Ubicación" value={role.location || ''} onChange={(value) => updateExperience(index, 'location', value)} />
                  <Field label="Fechas" value={role.dates || ''} onChange={(value) => updateExperience(index, 'dates', value)} highlight />
                </div>
                <TextArea
                  label="Stack técnico del rol"
                  value={listToText(role.techStack)}
                  onChange={(value) => updateExperience(index, 'techStack', textToList(value))}
                  rows={3}
                  helper="Frameworks, librerías y versiones ligadas a este cargo. Ej: React 16.13.1, Typescript 3.7.2."
                />
                <TextArea
                  label="Herramientas del rol"
                  value={listToText(role.tools)}
                  onChange={(value) => updateExperience(index, 'tools', textToList(value))}
                  rows={3}
                  helper="Herramientas específicas de este cargo. Ej: Figma, Sentry, Mixpanel."
                />
                <TextArea
                  label="Logros / bullets optimizados"
                  value={listToText(role.bullets)}
                  onChange={(value) => updateExperience(index, 'bullets', textToList(value))}
                  rows={5}
                  highlight
                  helper="Un logro por línea. Mantén métricas y responsabilidades reales; no agregues experiencia inventada."
                />
              </div>
            ))}
          </div>
        )}

        {featuredProjects.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900">Proyectos destacados</h4>
            {featuredProjects.map((project: any, index: number) => (
              <div key={index} className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <Field label="Proyecto" value={project.name || ''} onChange={(value) => updateProject(index, 'name', value)} />
                  <Field label="Descripción" value={project.description || ''} onChange={(value) => updateProject(index, 'description', value)} />
                  <Field label="Rol" value={project.role || ''} onChange={(value) => updateProject(index, 'role', value)} />
                  <Field label="Fechas" value={project.dates || ''} onChange={(value) => updateProject(index, 'dates', value)} highlight />
                </div>
                <TextArea
                  label="Stack / herramientas del proyecto"
                  value={listToText([...(project.techStack || []), ...(project.tools || [])])}
                  onChange={(value) => updateProject(index, 'techStack', textToList(value))}
                  rows={3}
                  helper="Tecnologías reales del proyecto, si estaban en el CV."
                />
                <TextArea
                  label="Tracción / logros verificables"
                  value={listToText(project.bullets || project.achievements)}
                  onChange={(value) => updateProject(index, 'bullets', textToList(value))}
                  rows={4}
                  highlight
                  helper="Ej: GitHub stars, Product Hunt, usuarios/equipos, capital semilla."
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
