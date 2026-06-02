'use client'

type EditableCvFormProps = {
  cv: any
  onChange: (cv: any) => void
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

function Field({ label, value, onChange, placeholder }: { label: string; value?: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">{label}</span>
      <input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-950 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 outline-none"
      />
    </label>
  )
}

function TextArea({ label, value, onChange, rows = 4, helper }: { label: string; value?: string; onChange: (value: string) => void; rows?: number; helper?: string }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">{label}</span>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-950 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 outline-none"
      />
      {helper && <span className="mt-1 block text-xs text-slate-400">{helper}</span>}
    </label>
  )
}

export default function EditableCvForm({ cv, onChange }: EditableCvFormProps) {
  if (!cv || typeof cv === 'string') return null

  const contact = cv.contact && typeof cv.contact === 'object' ? cv.contact : {}
  const update = (path: string[], value: any) => onChange(setNestedValue(cv, path, value))
  const updateList = (path: string[], value: string) => update(path, textToList(value))

  const updateExperience = (index: number, key: string, value: any) => {
    const experience = Array.isArray(cv.experience) ? [...cv.experience] : []
    experience[index] = { ...(experience[index] || {}), [key]: value }
    onChange({ ...cv, experience })
  }

  return (
    <section className="rounded-2xl border border-purple-200 bg-purple-50/60 p-5 space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-purple-700">Nuevo</p>
        <h3 className="text-xl font-bold text-slate-950">Revisa y corrige antes de descargar</h3>
        <p className="text-sm text-slate-600 mt-1">
          Si tu CV viejo trae email, teléfono o ciudad desactualizados, corrígelos aquí. El PDF, Word y TXT saldrán con esta versión.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 rounded-2xl bg-white border border-purple-100 p-4">
        <Field label="Nombre" value={cv.candidateName || cv.name || ''} onChange={(value) => update(['candidateName'], value)} />
        <Field label="Cargo objetivo" value={cv.targetTitle || cv.headline || ''} onChange={(value) => update(['targetTitle'], value)} />
        <Field label="Email" value={contact.email || cv.email || ''} onChange={(value) => update(['contact', 'email'], value)} />
        <Field label="Teléfono" value={contact.phone || cv.phone || ''} onChange={(value) => update(['contact', 'phone'], value)} />
        <Field label="Ciudad / País" value={contact.location || cv.location || ''} onChange={(value) => update(['contact', 'location'], value)} placeholder="Bogotá, Colombia" />
        <Field label="LinkedIn" value={contact.linkedin || cv.linkedin || ''} onChange={(value) => update(['contact', 'linkedin'], value)} />
        <Field label="Portfolio / web" value={contact.portfolio || contact.website || cv.portfolio || ''} onChange={(value) => update(['contact', 'portfolio'], value)} />
      </div>

      <TextArea
        label="Perfil profesional"
        value={cv.summary || ''}
        onChange={(value) => update(['summary'], value)}
        rows={4}
      />

      <div className="grid md:grid-cols-2 gap-4">
        <TextArea label="Skills" value={listToText([...(cv.coreCompetencies || []), ...(cv.skills || [])])} onChange={(value) => updateList(['coreCompetencies'], value)} helper="Una por línea o separadas por coma." />
        <TextArea label="Herramientas / skills técnicos" value={listToText([...(cv.technicalSkills || []), ...(cv.tools || [])])} onChange={(value) => updateList(['technicalSkills'], value)} helper="Una por línea o separadas por coma." />
        <TextArea label="Educación" value={listToText(cv.education)} onChange={(value) => updateList(['education'], value)} />
        <TextArea label="Certificaciones" value={listToText(cv.certifications)} onChange={(value) => updateList(['certifications'], value)} />
        <TextArea label="Idiomas" value={listToText(cv.languages)} onChange={(value) => updateList(['languages'], value)} />
      </div>

      {Array.isArray(cv.experience) && cv.experience.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-bold text-slate-900">Experiencia</h4>
          {cv.experience.map((role: any, index: number) => (
            <div key={index} className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Cargo" value={role.title || ''} onChange={(value) => updateExperience(index, 'title', value)} />
                <Field label="Empresa" value={role.company || ''} onChange={(value) => updateExperience(index, 'company', value)} />
                <Field label="Ubicación" value={role.location || ''} onChange={(value) => updateExperience(index, 'location', value)} />
                <Field label="Fechas" value={role.dates || ''} onChange={(value) => updateExperience(index, 'dates', value)} />
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
                label="Logros / bullets"
                value={listToText(role.bullets)}
                onChange={(value) => updateExperience(index, 'bullets', textToList(value))}
                rows={5}
                helper="Un logro por línea. No agregues experiencia inventada."
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
