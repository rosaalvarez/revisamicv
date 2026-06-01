'use client'

import { useEffect, useState, useRef } from 'react'
import { UploadIcon, SparklesIcon, ArrowRightIcon } from '@/components/icons'
import EditableCvForm from '@/components/EditableCvForm'
import { getFriendlyApiError, validateCvFile, validateEmail, validateJobDescription } from '@/lib/input-validation'
import { optimizedCvToPlainText } from '@/lib/cv-formatters'

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

function renderChipList(items?: string[]) {
  if (!items?.length) return null
  return <p className="text-sm text-slate-800 leading-relaxed">{items.join(' | ')}</p>
}

function renderSimpleSection(title: string, items?: string[]) {
  if (!items?.length) return null
  return (
    <div className="border-t border-slate-200 pt-4">
      <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wide text-xs">{title}</h4>
      <ul className="list-disc pl-5 space-y-1 text-sm text-slate-800">
        {items.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    </div>
  )
}

function renderOptimizedCV(cv: any) {
  if (!cv) return null
  if (typeof cv === 'string') {
    return <pre className="whitespace-pre-wrap text-sm text-slate-800 font-sans">{cv}</pre>
  }

  const contact = typeof cv.contact === 'object' && cv.contact
    ? [cv.contact.email, cv.contact.phone, cv.contact.location, cv.contact.linkedin, cv.contact.portfolio].filter(Boolean).join(' | ')
    : cv.contact

  return (
    <section className="rounded-2xl border border-purple-200 bg-white p-6">
      <div className="text-center border-b border-slate-200 pb-4 mb-5">
        <h3 className="font-bold text-slate-950 text-2xl">{cv.candidateName || cv.name || 'CV adaptado ATS'}</h3>
        {contact && <p className="text-sm text-slate-700 mt-1">{contact}</p>}
        {(cv.targetTitle || cv.headline) && <p className="text-sm font-semibold text-slate-900 mt-2">{cv.targetTitle || cv.headline}</p>}
      </div>

      <div className="space-y-5">
        {cv.summary && (
          <div>
            <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wide text-xs">Professional Summary</h4>
            <p className="text-sm text-slate-800 leading-relaxed">{cv.summary}</p>
          </div>
        )}

        {(cv.coreCompetencies?.length > 0 || cv.skills?.length > 0) && (
          <div className="border-t border-slate-200 pt-4">
            <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wide text-xs">Skills</h4>
            {renderChipList([...(cv.coreCompetencies || []), ...(cv.skills || [])])}
          </div>
        )}

        {cv.technicalSkills?.length > 0 && (
          <div className="border-t border-slate-200 pt-4">
            <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wide text-xs">Technical Skills</h4>
            {renderChipList(cv.technicalSkills)}
          </div>
        )}

        {cv.experience?.length > 0 && (
          <div className="space-y-4 border-t border-slate-200 pt-4">
            <h4 className="font-bold text-slate-900 uppercase tracking-wide text-xs">Professional Experience</h4>
            {cv.experience.map((role: any, index: number) => (
              <div key={index}>
                <p className="font-semibold text-slate-950">{role.title}</p>
                <p className="text-sm text-slate-600">{[role.company, role.location, role.dates].filter(Boolean).join(' | ')}</p>
                <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-slate-800">
                  {role.bullets?.map((bullet: string, bulletIndex: number) => <li key={bulletIndex}>{bullet}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        {renderSimpleSection('Education', cv.education)}
        {renderSimpleSection('Certifications', cv.certifications)}
        {cv.tools?.length > 0 && <div className="border-t border-slate-200 pt-4"><h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wide text-xs">Tools</h4>{renderChipList(cv.tools)}</div>}
        {renderSimpleSection('Languages', cv.languages)}
      </div>
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
  const [editableCv, setEditableCv] = useState<any | null>(null)
  const [error, setError] = useState('')
  const [downloadLoading, setDownloadLoading] = useState<'pdf' | 'docx' | 'txt' | null>(null)
  const [copySuccess, setCopySuccess] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const savedEmail = window.localStorage.getItem('revisamicv_email')
    if (savedEmail) setEmail(savedEmail)
  }, [])

  const setAndRememberEmail = (value: string) => {
    setEmail(value)
    if (value.trim()) window.localStorage.setItem('revisamicv_email', value.trim().toLowerCase())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const emailError = validateEmail(email)
    if (emailError) return setError(emailError)

    const fileError = validateCvFile(file)
    if (fileError) return setError(fileError)
    const selectedFile = file as File

    const jobError = validateJobDescription(jobDescription)
    if (jobError) return setError(jobError)

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('email', email.trim().toLowerCase())
      formData.append('cv', selectedFile)
      formData.append('jobDescription', jobDescription)
      formData.append('outputLanguage', outputLanguage)

      const res = await fetch('/api/process-cv', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(getFriendlyApiError(data.message || data.error, 'No pude procesar el CV. Intenta de nuevo.'))
      window.localStorage.setItem('revisamicv_email', email.trim().toLowerCase())
      setResult(data)
      setEditableCv(data.optimizedCV || null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = async (format: 'pdf' | 'docx' | 'txt') => {
    const cvForDownload = editableCv || result?.optimizedCV
    if (!cvForDownload) return setError('Primero genera un CV adaptado')

    setDownloadLoading(format)
    setError('')
    setCopySuccess('')

    try {
      const res = await fetch(`/api/generate-${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optimizedCV: cvForDownload,
          outputLanguage,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(getFriendlyApiError(data.message || data.error, `No pude generar el archivo ${format.toUpperCase()}`))
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cv-adaptado-revisamicv.${format}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDownloadLoading(null)
    }
  }

  const copyCvText = async () => {
    const cvForCopy = editableCv || result?.optimizedCV || result?.rawText
    if (!cvForCopy) return setError('Primero genera un CV adaptado')

    try {
      await navigator.clipboard.writeText(typeof cvForCopy === 'string' ? cvForCopy : optimizedCvToPlainText(cvForCopy, outputLanguage))
      setCopySuccess('CV copiado al portapapeles')
      setError('')
    } catch {
      setError('No pude copiar el CV. Intenta descargar el TXT.')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-4xl mx-auto py-10">
        <nav className="mb-6 flex flex-wrap items-center justify-center gap-3 text-sm">
          <a href="/" className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">Inicio</a>
          <a href="/#pricing" className="rounded-full border border-purple-200 bg-white px-4 py-2 font-semibold text-purple-700 hover:bg-purple-50">Ver planes</a>
          <a href="/dashboard" className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">Dashboard</a>
        </nav>
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
                onChange={(e) => setAndRememberEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full border border-slate-300 rounded-xl bg-white p-3 text-sm text-slate-950 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 outline-none"
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
                  accept=".pdf,.docx,.txt"
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
                className="w-full border border-slate-300 rounded-xl bg-white p-4 text-sm text-slate-950 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                required
              />
              <p className="text-xs text-slate-400 mt-1">El score se calcula cruzando tu CV real contra esta vacante específica.</p>
            </div>

            {error && <p className="text-red-700 bg-red-50 border border-red-100 rounded-xl p-3 text-sm">{error}</p>}

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

            <EditableCvForm cv={editableCv} onChange={setEditableCv} />

            {renderOptimizedCV(editableCv || result.optimizedCV || result.rawText)}

            {result.coverLetter && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-bold text-slate-900 mb-3">Mini cover letter</h3>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{result.coverLetter}</p>
              </section>
            )}

            {copySuccess && <p className="text-green-700 bg-green-50 border border-green-100 rounded-xl p-3 text-sm">{copySuccess}</p>}
            {error && <p className="text-red-700 bg-red-50 border border-red-100 rounded-xl p-3 text-sm">{error}</p>}

            <div className="grid md:grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <button
                onClick={() => downloadFile('pdf')}
                disabled={!!downloadLoading || !(editableCv || result.optimizedCV)}
                className="py-3 rounded-full font-semibold bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-50"
              >
                {downloadLoading === 'pdf' ? 'Generando PDF...' : 'Descargar PDF'}
              </button>
              <button
                onClick={() => downloadFile('docx')}
                disabled={!!downloadLoading || !(editableCv || result.optimizedCV)}
                className="py-3 rounded-full font-semibold bg-purple-600 text-white hover:bg-purple-700 transition disabled:opacity-50"
              >
                {downloadLoading === 'docx' ? 'Generando Word...' : 'Descargar Word DOCX'}
              </button>
              <button
                onClick={() => downloadFile('txt')}
                disabled={!!downloadLoading || !(editableCv || result.optimizedCV)}
                className="py-3 rounded-full font-semibold border-2 border-slate-200 hover:bg-slate-50 transition disabled:opacity-50"
              >
                {downloadLoading === 'txt' ? 'Generando TXT...' : 'Descargar TXT ATS'}
              </button>
              <button
                onClick={copyCvText}
                className="md:col-span-3 py-3 rounded-full font-semibold border-2 border-purple-200 text-purple-700 hover:bg-purple-50 transition"
              >
                Copiar CV al portapapeles
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <button
                onClick={() => { setResult(null); setEditableCv(null); setFile(null); setJobDescription(''); setCopySuccess('') }}
                className="flex-1 py-3 rounded-full font-semibold border-2 border-slate-200 hover:bg-slate-50 transition"
              >
                Probar otra vacante
              </button>
              <a
                href={`/dashboard?email=${encodeURIComponent(email.trim().toLowerCase())}`}
                className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-full font-semibold hover:bg-purple-700 transition"
              >
                Ver mi dashboard <ArrowRightIcon className="w-4 h-4" />
              </a>
              <a
                href="/#pricing"
                className="flex-1 flex items-center justify-center gap-2 border-2 border-purple-200 text-purple-700 py-3 rounded-full font-semibold hover:bg-purple-50 transition"
              >
                Comprar más tokens
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
