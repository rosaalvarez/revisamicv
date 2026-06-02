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
    const duration = 1800

    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
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
    <div ref={ref} className="flex items-baseline gap-2">
      <span className={`text-4xl font-light tabular-nums tracking-tight ${color}`}>{score}%</span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#64748d]">match</span>
    </div>
  )
}

export default function BeforeAfterCards() {
  return (
    <div className="mx-auto mt-12 grid max-w-5xl gap-5 text-left md:grid-cols-2">
      <div className="relative overflow-hidden rounded-xl border border-[#ffd7ef] bg-white p-6 shadow-[0_15px_35px_rgba(23,23,23,0.06)]">
        <div className="absolute right-0 top-0 rounded-bl-xl bg-[#fff1f6] px-4 py-3">
          <AnimatedScore from={23} to={23} color="text-[#ea2261]" />
        </div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#ea2261]">Antes</p>
        <h3 className="mb-6 max-w-[220px] text-2xl font-light tracking-[-0.02em] text-[#061b31]">CV genérico que no conversa con la vacante</h3>
        <div className="space-y-3 text-sm leading-6 text-[#64748d]">
          {[
            'Fui el encargado del proyecto de migración',
            'Responsable de coordinar el equipo de desarrollo',
            'Hice tareas de testing y documentación',
          ].map((item) => (
            <div key={item} className="flex items-start gap-2 rounded-lg bg-[#fff7fb] p-3">
              <XCircleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#ea2261]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-[#d6d9fc] bg-white p-6 shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px]">
        <div className="absolute right-0 top-0 rounded-bl-xl bg-[#eefcf3] px-4 py-3">
          <AnimatedScore from={94} to={94} color="text-[#108c3d]" />
        </div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#533afd]">Después</p>
        <h3 className="mb-6 max-w-[240px] text-2xl font-light tracking-[-0.02em] text-[#061b31]">CV adaptado con evidencia real y lenguaje ATS</h3>
        <div className="space-y-3 text-sm leading-6 text-[#273951]">
          {[
            <span key="1"><strong>Spearheaded</strong> cloud migration for 3 microservices, reducing deployment time by <strong>40%</strong></span>,
            <span key="2"><strong>Led</strong> cross-functional team of 8 engineers across 2 time zones, delivering <strong>3 sprints ahead</strong> of schedule</span>,
            <span key="3"><strong>Designed and implemented</strong> automated testing pipeline, achieving <strong>95% code coverage</strong></span>,
          ].map((item, index) => (
            <div key={index} className="flex items-start gap-2 rounded-lg bg-[#f8f9ff] p-3">
              <TrendingUpIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#533afd]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
