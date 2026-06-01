'use client'

import { useState, useRef } from 'react'
import { UploadIcon, SparklesIcon, ArrowRightIcon } from '@/components/icons'

type ProcessResult = {
  compatibilityScore?: number
  fitVerdict?: string
  positioningAngle?: string
  strengths?: string[]
  gaps?: string[]
  keywordsToInclude?: string[]
  honestyWarnings?: string[]
  optimizedCV?: any
  coverLetter?: string
  rawText?: string
  tokens_remaining?: number
}

const languageOptions = [
  { value: 'english', label: 'English', helper: 'Para USA, Canadá, remoto global o vacantes en inglés' },
  { value: 'spanish', label: 'Español', helper: 'Para España, LATAM o vacantes en español' },
] as const

function renderList(title: string, items?: string[]) {
  if (!items?.length) return null
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="font-bold text-slate-900 mb-3">{title}</h3>
      <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
        {items.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    </section>
  )
}

function renderOptimizedCV(cv: any) {
  if (!cv) return null
  if (typeof cv === 'string') {
    return <pre className="whitespace-pre-wrap text-sm text-slate-800 font-sans">{cv}</pre>
  }

  return (
    <section className="rounded-2xl border border-purple-200 bg-white p-6">
      <h3 className="font-bold text-slate-900 mb-4 text-xl">CV adaptado</h3>
      {cv.headline && <h4 className="text-lg font-bold text-purple-700 mb-2">{cv.headline}</h4>}
      {cv.summary && <p className="text-sm text-slate-700 leading-relaxed mb-5">{cv.summary}</p>}

      {cv.coreCompetencies?.length > 0 && (
        <div className="mb-5">
          <h4 className="font-semibold text-slate-900 mb-2">Core Competencies</h4>
          <div className="flex flex-wrap gap-2">
            {cv.coreCompetencies.map((skill: string, index: number) => (
              <span key={index} className="rounded-full bg-purple-50 text-purple-700 px-3 py-1 text-xs font-medium">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {cv.experience?.length > 0 && (
        <div className="space-y-5">
          <h4 className="font-semibold text-slate-900">Experience</h4>
          {cv.experience.map((role: any, index: number) => (
            <div key={index} className="border-t border-slate-100 pt-4">
              <p className="font-semibold text-slate-900">{role.title}</p>
              <p className="text-sm text-slate-500">{role.company} {role.dates ? `| ${role.dates}` : ''}</p>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-slate-700">
                {role.bullets?.map((bullet: string, bulletIndex: number) => <li key={bulletIndex}>{bullet}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [outputLanguage, setOutputLanguage] = useState<'english' | 'spanish'>('english')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ProcessResult | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return setError('Escribe tu email')
    if (!file) return setError('Sube tu CV')
    if (!jobDescription.trim()) return setError('Pega la vacante para poder adaptar el CV')

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('cv', file)
      formData.append('jobDescription', jobDescription)
      formData.append('outputLanguage', outputLanguage)

      const res = await fetch('/api/process-cv', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.message || data.error || 'Error procesando')
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-4xl mx-auto py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {result ? '✅ Resultado de compatibilidad' : 'Adapta tu CV a una vacante real'}
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            {result
              ? 'Analizamos tu CV real contra la vacante y generamos una versión adaptada sin inventar experiencia.'
              : 'Sube tu CV, pega la vacante, elige idioma y recibe score + CV adaptado. Primer intento gratis.'}
          </p>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tu email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                required
              />
              <p className="text-xs text-slate-400 mt-1">Lo usamos para darte 1 prueba gratis y manejar tus tokens.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">¿En qué idioma quieres el CV final?</label>
              <div className="grid md:grid-cols-2 gap-3">
                {languageOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setOutputLanguage(option.value)}
                    className={`rounded-2xl border-2 p-4 text-left transition ${
                      outputLanguage === option.value ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-purple-200'
                    }`}
                  >
                    <p className="font-bold text-slate-900">{option.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{option.helper}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tu CV actual</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 transition"
              >
                <UploadIcon className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                {file ? (
                  <p className="text-purple-600 font-semibold">{file.name}</p>
                ) : (
                  <>
                    <p className="text-slate-600 font-medium">Haz clic para subir</p>
                    <p className="text-sm text-slate-400 mt-1">PDF, Word (.docx) o TXT. Máximo 8 MB.</p>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Vacante objetivo</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={8}
                placeholder="Pega la descripción completa del trabajo al que quieres aplicar..."
                className="w-full border border-slate-300 rounded-xl p-4 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                required
              />
              <p className="text-xs text-slate-400 mt-1">El score se calcula cruzando tu CV real contra esta vacante específica.</p>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-4 rounded-full font-semibold text-lg hover:bg-purple-700 transition disabled:opacity-50"
            >
              {loading ? <span>Analizando compatibilidad...</span> : <><SparklesIcon className="w-5 h-5" /> Analizar y adaptar mi CV</>}
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            <section className="rounded-2xl bg-slate-900 text-white p-6">
              <p className="text-slate-300 text-sm mb-2">Compatibilidad estimada</p>
              <div className="flex items-end gap-3">
                <span className="text-6xl font-bold text-purple-300">{result.compatibilityScore ?? '—'}</span>
                {typeof result.compatibilityScore === 'number' && <span className="text-2xl mb-2">/100</span>}
              </div>
              {result.fitVerdict && <p className="mt-4 text-lg">{result.fitVerdict}</p>}
              {result.positioningAngle && <p className="mt-2 text-sm text-slate-300">{result.positioningAngle}</p>}
            </section>

            <div className="grid md:grid-cols-2 gap-5">
              {renderList('Fortalezas para esta vacante', result.strengths)}
              {renderList('Brechas o riesgos', result.gaps)}
              {renderList('Keywords que debe incluir', result.keywordsToInclude)}
              {renderList('Advertencias para no inventar', result.honestyWarnings)}
            </div>

            {renderOptimizedCV(result.optimizedCV || result.rawText)}

            {result.coverLetter && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-bold text-slate-900 mb-3">Mini cover letter</h3>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{result.coverLetter}</p>
              </section>
            )}

            <div className="flex flex-col md:flex-row gap-4">
              <button
                onClick={() => { setResult(null); setFile(null); setJobDescription('') }}
                className="flex-1 py-3 rounded-full font-semibold border-2 border-slate-200 hover:bg-slate-50 transition"
              >
                Probar otra vacante
              </button>
              <a
                href="/#pricing"
                className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-full font-semibold hover:bg-purple-700 transition"
              >
                Comprar más tokens <ArrowRightIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
