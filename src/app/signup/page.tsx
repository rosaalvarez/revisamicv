'use client'

import { useState, useRef } from 'react'
import { UploadIcon, SparklesIcon, ArrowRightIcon } from '@/components/icons'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [file, setFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return setError('Sube tu CV')
    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('cv', file)
      formData.append('jobDescription', jobDescription)

      const res = await fetch('/api/process-cv', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Error procesando')
      setResult(data.optimizedCV)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {result ? '✅ Tu CV optimizado' : 'Optimiza tu CV ahora'}
          </h1>
          <p className="text-slate-600">
            {result
              ? 'Aquí está tu CV. Ya viene otro gratis incluido.'
              : 'Primer CV GRATIS. Sin tarjeta de crédito.'}
          </p>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
            {/* File upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Tu CV actual (PDF, Word, TXT)
              </label>
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
                    <p className="text-sm text-slate-400 mt-1">PDF, Word o TXT</p>
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

            {/* Job description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Descripción del cargo (pégalo aquí)
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={6}
                placeholder="Pega la descripción completa del trabajo al que quieres aplicar..."
                className="w-full border border-slate-300 rounded-xl p-4 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-4 rounded-full font-semibold text-lg hover:bg-purple-700 transition disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  Optimizar mi CV (Gratis)
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="bg-slate-50 rounded-xl p-6 whitespace-pre-wrap text-sm font-mono text-slate-800 max-h-96 overflow-y-auto">
              {result}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => { setResult(null); setFile(null); setJobDescription('') }}
                className="flex-1 py-3 rounded-full font-semibold border-2 border-slate-200 hover:bg-slate-50 transition"
              >
                Probar otro CV
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