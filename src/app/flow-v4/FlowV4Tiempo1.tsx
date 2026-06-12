'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from './flow-v4.module.css'
import { CERTS, DUR_FRAG, FlowCaseKey, FlowQuestion, LEVELS, SCENARIOS, SRC_FRAG } from './mockData'

type CardStatus = 'idle' | 'open' | 'done' | 'noted' | 'skipped'

type AnswerState = {
  status: CardStatus
  acts: string[]
  source?: string
  duration?: string
  helperOpen?: boolean
  line?: string
}

const CIRC = 2 * Math.PI * 82
const SOURCE_OPTIONS = Object.keys(SRC_FRAG)
const DURATION_OPTIONS = Object.keys(DUR_FRAG)

function lowerFirst(text: string) {
  return text.charAt(0).toLowerCase() + text.slice(1)
}

function joinEs(items: string[]) {
  if (items.length <= 1) return items[0] || ''
  return `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`
}

function composeLine(question: FlowQuestion, answer: AnswerState) {
  if (question.type === 'binary') return question.line || ''
  if (question.type === 'level') {
    const selected = answer.acts[0]
    if (selected === LEVELS[0]) {
      return 'Tu CV ya dice B1 — no hay nada que cambiar, y dejarlo honesto también te protege.'
    }
    const lvl = selected ? selected.split(' ')[0] : '…'
    const cert = answer.source ? (answer.source.startsWith('Con') ? 'certificado' : 'autoevaluado') : '…'
    return `Inglés — ${lvl} (${cert})`
  }

  const acts = answer.acts.map(lowerFirst)
  const source = answer.source ? `${SRC_FRAG[answer.source].charAt(0).toUpperCase()}${SRC_FRAG[answer.source].slice(1)}` : '…'
  const duration = question.type === 'acts+dur' ? (answer.duration ? `, ${DUR_FRAG[answer.duration]}` : ', …') : ''
  return `${source}${duration}: ${joinEs(acts)}.`
}

function isReady(question: FlowQuestion, answer: AnswerState) {
  if (question.type === 'binary') return answer.status === 'open'
  if (question.type === 'level' && answer.acts[0] === LEVELS[0]) return false
  return answer.acts.length > 0 && Boolean(answer.source) && (question.type !== 'acts+dur' || Boolean(answer.duration))
}

function incompleteHint(question: FlowQuestion) {
  if (question.type === 'level') return '↑ falta cómo lo respaldas'
  if (question.type === 'acts+dur') return '↑ falta hace cuánto y dónde'
  return '↑ falta elegir dónde lo hiciste'
}

function Gauge({ score }: { score: number }) {
  const dashOffset = CIRC * (1 - score / 100)
  return (
    <div className={styles.gaugeWrap}>
      <svg width="190" height="190" viewBox="0 0 190 190" aria-hidden="true">
        <defs>
          <linearGradient id="flowV4GradStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2D6BE0" />
            <stop offset="100%" stopColor="#5B8DF0" />
          </linearGradient>
        </defs>
        <circle className={styles.gTrack} cx="95" cy="95" r="82" />
        <circle
          className={styles.gFill}
          cx="95"
          cy="95"
          r="82"
          strokeDasharray={CIRC}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className={styles.gCenter}>
        <div className={styles.gNum} data-testid="flow-score">{score.toLocaleString('es-CO')}</div>
        <div className={styles.gSub}>/100 encaje</div>
      </div>
    </div>
  )
}

export default function FlowV4Tiempo1({ initialCase }: { initialCase: FlowCaseKey }) {
  const [caseKey, setCaseKey] = useState<FlowCaseKey>(initialCase)
  const scenario = SCENARIOS[caseKey]
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({})
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const totalLift = useMemo(() => scenario.gaps.reduce((sum, gap) => sum + gap.lift, 0), [scenario.gaps])
  const resolved = scenario.gaps.filter((_, index) => ['done', 'noted', 'skipped'].includes(answers[index]?.status || '')).length
  const score = scenario.to + scenario.gaps.reduce((sum, gap, index) => sum + (answers[index]?.status === 'done' ? gap.lift : 0), 0)
  const gain = Math.max(0, score - scenario.to)

  function current(index: number): AnswerState {
    return answers[index] || { status: 'idle', acts: [] }
  }

  function patchAnswer(index: number, next: Partial<AnswerState>) {
    setAnswers((prev) => ({
      ...prev,
      [index]: { ...current(index), ...next },
    }))
  }

  function openCard(index: number) {
    patchAnswer(index, { status: 'open' })
  }

  function toggleHelper(index: number) {
    const state = current(index)
    patchAnswer(index, { helperOpen: !state.helperOpen })
  }

  function toggleAct(index: number, value: string) {
    const question = scenario.gaps[index]
    const state = current(index)
    let acts = state.acts
    if (question.type === 'level') {
      acts = [value]
    } else {
      acts = acts.includes(value) ? acts.filter((item) => item !== value) : [...acts, value]
    }
    patchAnswer(index, { status: acts.length ? 'open' : 'idle', acts })
  }

  function selectSource(index: number, source: string) {
    patchAnswer(index, { status: 'open', source })
  }

  function selectDuration(index: number, duration: string) {
    patchAnswer(index, { status: 'open', duration })
  }

  function binaryYes(index: number) {
    const question = scenario.gaps[index]
    patchAnswer(index, { status: 'open', acts: [], line: question.line })
  }

  function binaryNo(index: number) {
    patchAnswer(index, { status: 'noted', acts: [] })
    setToast('Anotado con honestidad — nada se inventa.')
  }

  function dismiss(index: number) {
    patchAnswer(index, { status: 'skipped', acts: [] })
    setToast('Listo — eso se queda por fuera. Nada se inventa.')
  }

  function reset(index: number) {
    setAnswers((prev) => ({ ...prev, [index]: { status: 'idle', acts: [] } }))
  }

  function confirm(index: number) {
    const question = scenario.gaps[index]
    const state = current(index)
    if (!isReady(question, state)) return
    const line = composeLine(question, state)
    patchAnswer(index, { status: 'done', line })
    setToast(`Subiste a ${score + question.lift} — cada palabra salió de tus taps.`)
  }

  function undo(index: number) {
    reset(index)
    setToast('Quitado. Nada queda sin tu permiso.')
  }

  function nextStepToast() {
    setToast('Siguiente paso: A2')
  }

  function switchCase(nextCase: FlowCaseKey) {
    setCaseKey(nextCase)
    setAnswers({})
    const url = new URL(window.location.href)
    url.searchParams.set('case', nextCase)
    window.history.replaceState(null, '', url.toString())
  }

  return (
    <main className={styles.page} data-case={caseKey}>
      <div className={styles.topbar}>
        <div className={styles.topbarIn}>
          <div className={styles.brand}><span className={styles.logo}>R</span><span>RevisaMiCV</span></div>
          <span className={styles.simTag}>Flow v4 · dos tiempos</span>
          <div className={styles.scenPills} aria-label="Casos de simulación">
            {(['near', 'mid', 'far'] as FlowCaseKey[]).map((key) => (
              <button key={key} type="button" className={`${styles.scenPill} ${caseKey === key ? styles.on : ''}`} onClick={() => switchCase(key)}>{key}</button>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.wrap}>
        <section className={styles.t1} aria-label="Tiempo 1 · tu análisis">
          <div className={styles.t1Head}>
            <span className={styles.eyebrow}>Tiempo 1 · tu análisis</span>
            <h1>{scenario.t1Title}</h1>
            <p>{scenario.t1Sub}</p>
          </div>

          <div className={styles.heroCard}>
            <Gauge score={score} />
            <div className={styles.deltaLabel}>
              <span>Empezaste en</span>
              <span className={styles.from}>{scenario.from.toLocaleString('es-CO')}</span>
              {gain > 0 && <span className={styles.gain}>+{gain.toLocaleString('es-CO')} con tu verdad</span>}
            </div>
          </div>

          <div className={styles.verdict} dangerouslySetInnerHTML={{ __html: scenario.verdict }} />

          <div className={styles.qsHead}>
            <h2>{scenario.gaps.length.toLocaleString('es-CO')} preguntas rápidas</h2>
            <span className={styles.totalPill}>Hasta +{totalLift.toLocaleString('es-CO')} en juego</span>
          </div>
          <p className={styles.qsSub}>Respondes con taps — nunca escribes. Cada una dice cuántos puntos vale. Solo lo que confirmes entra a tu CV.</p>
          <div className={styles.qsProgress} aria-label={`${resolved} de ${scenario.gaps.length} respondidas`}>
            <i style={{ width: `${(resolved / scenario.gaps.length) * 100}%` }} />
          </div>

          <div className={styles.gaps}>
            {scenario.gaps.map((question, index) => {
              const state = current(index)
              if (state.status === 'skipped') return null
              const isBinary = question.type === 'binary'
              const isLevel = question.type === 'level'
              const preview = isBinary ? question.line || '' : (state.acts.length ? composeLine(question, state) : '')
              const ready = isReady(question, state)
              const open = state.status === 'open' || Boolean(state.acts.length)
              const done = state.status === 'done'
              const noted = state.status === 'noted'
              const options = isLevel ? LEVELS : question.acts || []

              return (
                <article
                  className={`${styles.gap} ${done ? styles.done : ''} ${noted ? styles.noted : ''} ${isBinary ? styles.binary : ''}`}
                  key={question.name}
                  data-question={question.name}
                >
                  <div className={styles.gapTop}>
                    <span className={styles.gapName}>{question.name}</span>
                    <span className={styles.gapLift}>+{question.lift} pts</span>
                  </div>
                  <p className={styles.gapQ}>{question.q} <button className={styles.whatis} type="button" onClick={() => toggleHelper(index)}>¿Qué cuenta?</button></p>
                  {state.helperOpen && <div className={styles.whatisBox}>{question.whatis}</div>}

                  {!done && !noted && (
                    <>
                      <div className={styles.gapActs}>
                        {isBinary ? (
                          <>
                            <button className={styles.chip} type="button" onClick={() => binaryYes(index)}>Sí, la tengo</button>
                            <button className={styles.chip} type="button" onClick={() => binaryNo(index)}>No la tengo</button>
                          </>
                        ) : (
                          <>
                            <button className={styles.chip} type="button" onClick={() => openCard(index)}>{isLevel ? 'Actualizar mi nivel' : 'Sí, lo viví'}</button>
                            {!isLevel && <button className={styles.chip} type="button" onClick={() => openCard(index)}>Tengo algo básico</button>}
                            <button className={styles.chip} type="button" onClick={() => dismiss(index)}>{isLevel ? 'Sigue igual' : 'No aplica'}</button>
                          </>
                        )}
                      </div>

                      {!isBinary && open && (
                        <div className={styles.actsStep}>
                          <p className={styles.stepQ}>{isLevel ? '¿Tu nivel real hoy?' : '¿Cuáles de estas hiciste de verdad?'}</p>
                          <p className={styles.stepHint}>{isLevel ? 'El que defenderías en una llamada real.' : 'Marca solo lo real — puedes marcar varias.'}</p>
                          <div className={styles.actGrid}>
                            {options.map((option) => (
                              <button key={option} className={`${styles.act} ${state.acts.includes(option) ? styles.sel : ''}`} type="button" onClick={() => toggleAct(index, option)}>
                                <span className={styles.tick}>✓</span>{option}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {!isBinary && state.acts.length > 0 && (
                        <div className={styles.srcStep}>
                          {question.type === 'acts+dur' && (
                            <div className={styles.srcBlock}>
                              <p className={styles.stepQ}>¿Hace cuánto?</p>
                              <div className={styles.srcGrid}>{DURATION_OPTIONS.map((duration) => <button key={duration} className={`${styles.src} ${state.duration === duration ? styles.sel : ''}`} type="button" onClick={() => selectDuration(index, duration)}>{duration}</button>)}</div>
                            </div>
                          )}
                          <div className={styles.srcBlock}>
                            <p className={styles.stepQ}>{isLevel ? '¿Cómo lo respaldas?' : '¿Dónde lo hiciste?'}</p>
                            <div className={styles.srcGrid}>{(isLevel ? [...CERTS] : SOURCE_OPTIONS).map((source) => <button key={source} className={`${styles.src} ${state.source === source ? styles.sel : ''}`} type="button" onClick={() => selectSource(index, source)}>{source}</button>)}</div>
                          </div>
                        </div>
                      )}

                      {(isBinary ? open : state.acts.length > 0) && (
                        <div className={styles.confirmStep}>
                          <div className={styles.linePreview}><span>Así quedaría en tu CV</span>{preview}</div>
                          <div className={styles.confirmRow}>
                            <button className={`${styles.btnAdd} ${ready ? '' : styles.dis}`} type="button" onClick={() => confirm(index)} disabled={!ready}>Sumar a mi CV · +{question.lift}</button>
                            {!ready && question.type !== 'binary' && state.acts[0] !== LEVELS[0] && <span className={styles.confirmHint}>{incompleteHint(question)}</span>}
                            <button className={styles.lnk} type="button" onClick={() => reset(index)}>Empezar de nuevo</button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {done && <div className={styles.doneRow}><div className={styles.doneHead}>✓ Sumado — construido con tus taps</div><div className={styles.doneLine}>{state.line}</div><button className={styles.lnk} type="button" onClick={() => undo(index)}>Quitar</button></div>}
                  {noted && <div className={styles.noteRow}><p dangerouslySetInnerHTML={{ __html: question.noNote || '' }} /><button className={styles.lnk} type="button" onClick={() => reset(index)}>Cambiar mi respuesta</button></div>}
                </article>
              )
            })}
          </div>
          <p className={styles.skipNote}>Nada de lo que no confirmes se inventa.</p>
        </section>
      </div>

      <div className={styles.actionBar}>
        <div className={styles.abIn}>
          <div className={styles.abScore}><span>{score.toLocaleString('es-CO')}</span><small>/100</small></div>
          <span className={styles.abCount}>{resolved.toLocaleString('es-CO')} de {scenario.gaps.length.toLocaleString('es-CO')} respondidas</span>
          <button className={styles.abSkip} type="button" onClick={nextStepToast}>Saltar preguntas</button>
          <button className={styles.btnPrimary} type="button" onClick={nextStepToast}>Generar mi CV →</button>
        </div>
      </div>
      <div className={`${styles.toast} ${toast ? styles.show : ''}`} role="status">{toast}</div>
    </main>
  )
}
