'use client'

// Setup flow screen (3 steps):
// 1) Pick case
// 2) Pick personality mode/archetype
// 3) Pick difficulty, then start examination
import { useEffect, useRef, useState } from 'react'
import { useGame } from '@/lib/game-context'
import {
  CASES,
  AI_ARCHETYPES,
  DIFFICULTY_CONFIGS,
  pickRandom,
  pickRandomModelId,
  type CaseId,
  type Difficulty,
} from '@/lib/game-data'

type Step = 'case' | 'mode' | 'difficulty'

export default function CaseSelectionScreen() {
  const { goTo, selectCase, assignWitness, setMode, setDifficulty } = useGame()
  const [step, setStep] = useState<Step>('case')
  const [caseIndex, setCaseIndex] = useState(0)
  const [selectedArchetypeId, setSelectedArchetypeId] = useState<string | null>(null)
  const [selectedMode, setSelectedMode] = useState<'practice' | 'challenge' | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null)
  const [isCaseAnimating, setIsCaseAnimating] = useState(false)
  const [caseSlideDirection, setCaseSlideDirection] = useState<'left' | 'right'>('right')
  const pageRef = useRef<HTMLDivElement>(null)

  const currentCase = CASES[caseIndex]

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    pageRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [step])

  function shiftCase(direction: 'left' | 'right') {
    if (isCaseAnimating) return
    setCaseSlideDirection(direction)
    setIsCaseAnimating(true)
    setCaseIndex((i) =>
      direction === 'left'
        ? (i - 1 + CASES.length) % CASES.length
        : (i + 1) % CASES.length,
    )
    setTimeout(() => setIsCaseAnimating(false), 240)
  }

  function handleBegin() {
    if (!selectedDifficulty) return

    const isPractice = selectedMode === 'practice'
    const archetypeId = isPractice
      ? selectedArchetypeId!
      : pickRandom(AI_ARCHETYPES).id

    selectCase(currentCase.id as CaseId)
    assignWitness(pickRandomModelId(), archetypeId, isPractice)
    setMode(selectedMode)
    setDifficulty(selectedDifficulty)
    goTo('bench')
  }

  const stepTitles: Record<Step, string> = {
    case: 'Select a Case',
    mode: 'Choose Your AI Personality',
    difficulty: 'Set the Difficulty',
  }

  const stepNumbers: Record<Step, string> = {
    case: 'Step 1 of 3',
    mode: 'Step 2 of 3',
    difficulty: 'Step 3 of 3',
  }

  return (
    <div className="min-h-screen flex flex-col screen-in" style={{ background: 'var(--court-deep)' }}>
      <header
        className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between shrink-0"
        style={{ borderBottom: '1px solid var(--court-border)', background: 'var(--court-panel)' }}
      >
        <button
          onClick={() => {
            if (step === 'difficulty') setStep('mode')
            else if (step === 'mode') setStep('case')
            else goTo('landing')
          }}
          className="btn-ghost font-mono text-xs tracking-widest uppercase px-2 py-1"
          style={{ color: 'var(--court-muted)', border: '1px solid transparent' }}
        >
          &larr; {step === 'case' ? 'Home' : 'Back'}
        </button>
        <h2
          className="court-serif text-base md:text-lg font-semibold tracking-widest uppercase"
          style={{ color: 'var(--court-gold)' }}
        >
          {stepTitles[step]}
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          <span className="court-serif text-base md:text-lg font-semibold tracking-wide" style={{ color: 'var(--court-gold)' }}>
            Cross-Examine
          </span>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              border: '2px solid var(--court-gold-dim)',
              background: 'oklch(0.72 0.11 85 / 0.08)',
              color: 'var(--court-gold)',
            }}
          >
            <span className="court-serif text-lg leading-none">⚖</span>
          </div>
        </div>
      </header>

      <div ref={pageRef} className="flex-1 flex flex-col gap-8 p-6 max-w-3xl mx-auto w-full justify-center">

        <div
          className="font-mono text-xs tracking-widest uppercase px-3 py-1 self-start"
          style={{ border: '1px solid var(--court-gold)', color: 'var(--court-gold)', background: 'oklch(0.72 0.11 85 / 0.06)' }}
        >
          {stepNumbers[step]}
        </div>

        {/* ── Step 1: Case ── */}
        {step === 'case' && (
          <>
            <div className="flex items-stretch gap-4">
              <button
                onClick={() => shiftCase('left')}
                className="btn-ghost px-4 court-panel font-mono text-xl"
                style={{ color: 'var(--court-gold)' }}
                aria-label="Previous case"
              >
                &#9664;
              </button>
              <div
                className="flex-1 court-panel p-6 flex flex-col gap-4 transition-all duration-220 ease-out"
                style={{
                  opacity: isCaseAnimating ? 0.94 : 1,
                  transform: isCaseAnimating
                    ? `translateX(${caseSlideDirection === 'left' ? '6px' : '-6px'})`
                    : 'translateX(0px)',
                }}
              >
                <div>
                  <div className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--court-muted)' }}>
                    Case {caseIndex + 1} of {CASES.length}
                  </div>
                  <h3 className="court-serif text-3xl font-bold" style={{ color: 'var(--court-gold)' }}>
                    {currentCase.title}
                  </h3>
                  <p className="font-mono text-xs mt-1" style={{ color: 'var(--court-muted)' }}>
                    {currentCase.subtitle}
                  </p>
                </div>
                <p className="font-sans text-sm leading-relaxed" style={{ color: 'var(--court-parchment)' }}>
                  {currentCase.summary}
                </p>
                <div
                  className="p-3 text-xs leading-relaxed"
                  style={{ background: 'oklch(0.72 0.11 85 / 0.06)', borderLeft: '2px solid var(--court-gold)', color: 'var(--court-parchment)' }}
                >
                  <div className="font-mono uppercase tracking-wider mb-1 text-xs" style={{ color: 'var(--court-gold-dim)' }}>
                    The Witness
                  </div>
                  {currentCase.witnessRole}
                </div>
                <button
                  onClick={() => setStep('mode')}
                  className="btn-primary mt-2 w-full py-3 font-mono text-sm tracking-[0.18em] uppercase font-semibold"
                  style={{ background: 'var(--court-gold)', color: 'var(--court-deep)' }}
                >
                  Select &ldquo;{currentCase.title}&rdquo; &rarr;
                </button>
              </div>
              <button
                onClick={() => shiftCase('right')}
                className="btn-ghost px-4 court-panel font-mono text-xl"
                style={{ color: 'var(--court-gold)' }}
                aria-label="Next case"
              >
                &#9654;
              </button>
            </div>

            <div className="flex justify-center gap-2">
              {CASES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCaseIndex(i)}
                  aria-label={`Case ${i + 1}`}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{ background: i === caseIndex ? 'var(--court-gold)' : 'var(--court-border)' }}
                />
              ))}
            </div>

          </>
        )}

        {/* ── Step 2: Mode ── */}
        {step === 'mode' && (
          <>
            <div className="font-mono text-xs mb-1" style={{ color: 'var(--court-muted)' }}>
              {currentCase.title} &bull; {currentCase.subtitle}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              {/* Practice */}
              <button
                onClick={() => setSelectedMode('practice')}
                className="btn-card text-left court-panel p-6 flex flex-col gap-3"
                style={{
                  borderColor: selectedMode === 'practice' ? 'var(--court-gold)' : undefined,
                  background: selectedMode === 'practice' ? 'oklch(0.72 0.11 85 / 0.06)' : undefined,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs tracking-widest uppercase" style={{ color: 'var(--court-gold-dim)' }}>
                    Practice Mode
                  </div>
                  {selectedMode === 'practice' && (
                    <div className="font-mono text-xs" style={{ color: 'var(--court-gold)' }}>selected</div>
                  )}
                </div>
                <h3 className="court-serif text-xl font-bold" style={{ color: 'var(--court-gold)' }}>
                  Known Personality
                </h3>
                <p className="font-sans text-xs leading-relaxed" style={{ color: 'var(--court-muted)' }}>
                  You know the witness personality upfront. Use this to study how each type withholds information and practice cracking it.
                </p>
              </button>

              {/* Challenge */}
              <button
                onClick={() => setSelectedMode('challenge')}
                className="btn-card text-left court-panel p-6 flex flex-col gap-3"
                style={{
                  borderColor: selectedMode === 'challenge' ? 'var(--court-red-bright)' : undefined,
                  background: selectedMode === 'challenge' ? 'oklch(0.52 0.20 25 / 0.06)' : undefined,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs tracking-widest uppercase" style={{ color: 'var(--court-red-bright)' }}>
                    Challenge Mode
                  </div>
                  {selectedMode === 'challenge' && (
                    <div className="font-mono text-xs" style={{ color: 'var(--court-red-bright)' }}>selected</div>
                  )}
                </div>
                <h3 className="court-serif text-xl font-bold" style={{ color: 'var(--court-gold)' }}>
                  Hidden Personality
                </h3>
                <p className="font-sans text-xs leading-relaxed" style={{ color: 'var(--court-muted)' }}>
                  Personality is randomly assigned and sealed. Determine how the witness withholds through questioning alone.
                </p>
              </button>
            </div>

            {/* Practice: archetype picker */}
            {selectedMode === 'practice' && (
              <div className="flex flex-col gap-3">
                <div className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--court-muted)' }}>
                  Select a personality to study
                </div>
                <div className="flex flex-col gap-2">
                  {AI_ARCHETYPES.map((arch) => {
                    const selected = selectedArchetypeId === arch.id
                    return (
                      <button
                        key={arch.id}
                        onClick={() => setSelectedArchetypeId(arch.id)}
                        className="btn-card text-left p-3 flex flex-col gap-1"
                        style={{
                          background: selected ? 'oklch(0.72 0.11 85 / 0.1)' : 'var(--court-deep)',
                          border: selected ? '1px solid var(--court-gold)' : '1px solid var(--court-border)',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="font-mono text-xs font-semibold uppercase tracking-wider"
                            style={{ color: 'var(--court-gold)' }}
                          >
                            {arch.label}
                          </span>
                          {selected && (
                            <span className="font-mono text-xs" style={{ color: 'var(--court-gold)' }}>selected</span>
                          )}
                        </div>
                        <p className="font-sans text-xs leading-relaxed" style={{ color: 'var(--court-muted)' }}>
                          {arch.tagline} &mdash; {arch.omissionStyle}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <button
              onClick={() => setStep('difficulty')}
              disabled={!selectedMode || (selectedMode === 'practice' && !selectedArchetypeId)}
              className="btn-primary w-full py-4 font-mono text-sm tracking-[0.2em] uppercase font-semibold disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
              style={{ background: 'var(--court-gold)', color: 'var(--court-deep)', border: '2px solid var(--court-gold)' }}
            >
              Continue &rarr;
            </button>
          </>
        )}

        {/* ── Step 3: Difficulty ── */}
        {step === 'difficulty' && (
          <>
            <div className="font-mono text-xs mb-1" style={{ color: 'var(--court-muted)' }}>
              {currentCase.title}: {currentCase.subtitle}
              {' '} &bull; {selectedMode === 'practice' ? (
                <>Practice Mode: {AI_ARCHETYPES.find((a) => a.id === selectedArchetypeId)?.label || 'Unknown'}</>
              ) : (
                <>
                  Challenge Mode:{' '}
                  <span style={{ color: 'var(--court-red-bright)' }}>Unknown</span>
                </>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <p className="font-sans text-xs leading-relaxed" style={{ color: 'var(--court-parchment)' }}>
                Choose how many questions you get to examine the witness. Once you run out, the interrogation ends and your results are scored.
              </p>

              <div className="flex flex-col gap-3 mt-2">
                {DIFFICULTY_CONFIGS.map((config) => {
                  const selected = selectedDifficulty === config.id
                  return (
                    <button
                      key={config.id}
                      onClick={() => setSelectedDifficulty(config.id)}
                      className="btn-card text-left p-5 flex items-start gap-5"
                      style={{
                        background: selected ? 'oklch(0.72 0.11 85 / 0.08)' : 'var(--court-panel)',
                        border: selected ? '2px solid var(--court-gold)' : '1px solid var(--court-border)',
                      }}
                    >
                      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                        <div
                          className="font-mono text-3xl font-black leading-none"
                          style={{ color: selected ? 'var(--court-gold)' : 'var(--court-gold-dim)' }}
                        >
                          {config.questions}
                        </div>
                        <div className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--court-muted)' }}>
                          Q&apos;s
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-mono text-xs font-semibold uppercase tracking-wider"
                            style={{ color: selected ? 'var(--court-gold)' : 'var(--court-parchment)' }}
                          >
                            {config.label}
                          </span>
                          {selected && (
                            <span className="font-mono text-xs" style={{ color: 'var(--court-gold)' }}>selected</span>
                          )}
                        </div>
                        <p className="font-sans text-xs leading-relaxed" style={{ color: 'var(--court-muted)' }}>
                          {config.description}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              onClick={handleBegin}
              disabled={!selectedDifficulty}
              className={`${selectedMode === 'challenge' ? 'btn-primary-red' : 'btn-primary'} w-full py-4 font-mono text-sm tracking-[0.2em] uppercase font-semibold disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none`}
              style={{
                background: selectedMode === 'challenge' ? 'var(--court-red-bright)' : 'var(--court-gold)',
                color: 'var(--court-deep)',
                border: `2px solid ${selectedMode === 'challenge' ? 'var(--court-red-bright)' : 'var(--court-gold)'}`,
              }}
            >
              Begin Examination &rarr;
            </button>
          </>
        )}

      </div>

      <footer
        className="shrink-0 pb-1 px-4"
        style={{ borderTop: '1px solid var(--court-border)', background: 'var(--court-panel)' }}
      >
        <p className="font-mono text-xs text-center whitespace-nowrap py-1" style={{ color: 'var(--court-muted)', opacity: 0.6 }}>
          Research Instrument Prototype ✦ Created by GameologyGirl
        </p>
      </footer>
    </div>
  )
}
