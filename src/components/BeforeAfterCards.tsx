'use client'

import { useEffect, useState, useRef } from 'react'
import { TrendingUpIcon, XCircleIcon } from '@/components/icons'

function AnimatedScore({ from, to, color }: { from: number; to: number; color: string }) {
  const [score, setScore] = useState(from)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const el = ref.current
    if (!el) return

    const start = performance.now()
    const duration = 2000

    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setScore(Math.round(from + (to - from) * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          requestAnimationFrame(animate)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [from, to])

  return (
    <div ref={ref} className="flex items-center gap-2">
      <span className={`text-3xl font-black ${color} tabular-nums`}>{score}%</span>
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ATS Match</span>
    </div>
  )
}

export default function BeforeAfterCards() {
  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-10">
      {/* Before Card */}
      <div className="rounded-2xl border-2 border-red-200 bg-red-50/50 p-6 text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-red-100 rounded-bl-2xl px-4 py-2">
          <AnimatedScore from={23} to={23} color="text-red-600" />
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Tu CV actual</h3>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-start gap-2">
              <XCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>Fui el encargado del proyecto de migración</span>
            </div>
            <div className="flex items-start gap-2">
              <XCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>Responsable de coordinar el equipo de desarrollo</span>
            </div>
            <div className="flex items-start gap-2">
              <XCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>Hice tareas de testing y documentación</span>
            </div>
          </div>
        </div>
      </div>

      {/* After Card */}
      <div className="rounded-2xl border-2 border-green-200 bg-green-50/50 p-6 text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-green-100 rounded-bl-2xl px-4 py-2">
          <AnimatedScore from={23} to={94} color="text-green-600" />
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">CV optimizado</h3>
          <div className="space-y-3 text-sm text-slate-700">
            <div className="flex items-start gap-2">
              <TrendingUpIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span><strong>Spearheaded</strong> cloud migration for 3 microservices, reducing deployment time by <strong>40%</strong></span>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUpIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span><strong>Led</strong> cross-functional team of 8 engineers across 2 time zones, delivering <strong>3 sprints ahead</strong> of schedule</span>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUpIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span><strong>Designed and implemented</strong> automated testing pipeline, achieving <strong>95% code coverage</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}