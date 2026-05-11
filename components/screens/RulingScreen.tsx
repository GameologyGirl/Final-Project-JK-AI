'use client'

// Results summary screen:
// - Calls /api/analyze to score the interrogation
// - Displays headline metrics and narrative feedback
// - Routes to full analysis details
import { useState, useEffect } from 'react'
import { useGame } from '@/lib/game-context'
import { getCaseById, DIFFICULTY_CONFIGS } from '@/lib/game-data'
import type { AnalysisResult } from '@/lib/game-data'

export default function SummaryScreen() {
  const { state, goTo, setAnalysis, reset } = useGame()
  const {
    selectedCase,
    witnessArchetype,
    history,
    mode,
    difficulty,
  } = state

  const caseFile = getCaseById(selectedCase!)
  const difficultyConfig = DIFFICULTY_CONFIGS.find((d) => d.id === difficulty) ?? DIFFICULTY_CONFIGS[0]
  const questionsAsked = history.filter((m) => m.role === 'user').length

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [showDecisionTraceJSON, setShowDecisionTraceJSON] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function runAnalysis() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caseId: selectedCase,
            witnessArchetypeId: witnessArchetype,
            history,
          }),
        })
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}))
          throw new Error(errBody?.error || 'Analysis failed')
        }
        const data: AnalysisResult = await res.json()
        if (!cancelled) {
          setResult(data)
          setAnalysis(data)
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'Analysis unavailable. Please try again.'
          setError(msg)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    runAnalysis()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const truthPercent = result?.truthSurfacedPercent ?? 0

  return (
    <div className="min-h-screen flex flex-col screen-in" style={{ background: 'var(--court-deep)' }}>
      <header
        className="px-6 py-4 flex items-center justify-between shrink-0"
        style={{ background: 'var(--court-panel)', borderBottom: '1px solid var(--court-border)' }}
      >
        <button
          onClick={() => goTo('bench')}
          className="btn-ghost font-mono text-xs uppercase tracking-widest px-2 py-1"
          style={{ color: 'var(--court-muted)', border: '1px solid transparent' }}
        >
          &larr; Back
        </button>
        <h2 className="court-serif text-sm uppercase tracking-widest" style={{ color: 'var(--court-gold)' }}>
          Full Analysis
        </h2>
        <div />
      </header>

      <div className="flex-1 flex flex-col gap-6 p-6 max-w-2xl mx-auto w-full">

        {/* Session header */}
        <div
          className="p-5 flex flex-col gap-2"
          style={{ border: '2px solid var(--court-gold)', background: 'var(--court-panel)' }}
        >
          <div className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--court-gold-dim)' }}>
            {caseFile.title} &bull; {caseFile.subtitle}
          </div>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex flex-col gap-0.5">
              <div className="font-mono text-xs" style={{ color: 'var(--court-muted)' }}>Questions asked</div>
              <div className="court-serif text-3xl font-black" style={{ color: 'var(--court-gold)' }}>
                {questionsAsked}
                <span className="font-mono text-sm font-normal ml-1" style={{ color: 'var(--court-muted)' }}>
                  / {difficultyConfig.questions}
                </span>
              </div>
            </div>
            <div className="h-10 w-px" style={{ background: 'var(--court-border)' }} />
            <div className="flex flex-col gap-0.5">
              <div className="font-mono text-xs" style={{ color: 'var(--court-muted)' }}>Difficulty</div>
              <div className="font-mono text-sm font-semibold" style={{ color: 'var(--court-gold)' }}>
                {difficultyConfig.label}
              </div>
            </div>
            <div className="h-10 w-px" style={{ background: 'var(--court-border)' }} />
            <div className="flex flex-col gap-0.5">
              <div className="font-mono text-xs" style={{ color: 'var(--court-muted)' }}>Personality Type</div>
              <div
                className="font-mono text-sm font-semibold"
                style={{ color: mode === 'challenge' ? 'var(--court-red-bright)' : 'var(--court-gold)' }}
              >
                {result?.archetypeReveal || 'Pending...'}
              </div>
            </div>
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="flex items-center gap-3 p-4 court-panel">
            <div
              className="w-3 h-3 border-2 rounded-full animate-spin shrink-0"
              style={{ borderColor: 'var(--court-gold)', borderTopColor: 'transparent' }}
            />
            <p className="font-mono text-xs" style={{ color: 'var(--court-muted)' }}>
              Reviewing interrogation transcript...
            </p>
          </div>
        )}
        {error && (
          <div className="p-4 court-panel" style={{ borderColor: 'var(--court-red)' }}>
            <p className="font-mono text-xs" style={{ color: 'var(--court-red-bright)' }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="font-mono text-xs mt-2 underline"
              style={{ color: 'var(--court-muted)' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Merged Full Analysis content */}
        {result && (
          <>
            {/* Personality reveal */}
            <div
              className="p-6 text-center flex flex-col gap-3"
              style={{
                background: 'var(--court-panel)',
                border: mode === 'challenge' ? '2px solid var(--court-red-bright)' : '2px solid var(--court-gold)',
              }}
            >
              {mode === 'challenge' && (
                <div className="font-mono text-xs uppercase tracking-[0.3em]" style={{ color: 'var(--court-red-bright)' }}>
                  Personality Revealed
                </div>
              )}
              {mode === 'practice' && (
                <div className="font-mono text-xs uppercase tracking-[0.3em]" style={{ color: 'var(--court-gold-dim)' }}>
                  Witness Personality
                </div>
              )}
              <div className="court-serif text-4xl font-black" style={{ color: 'var(--court-gold)' }}>
                {result.archetypeReveal}
              </div>
              <p className="font-sans text-sm italic leading-relaxed" style={{ color: 'var(--court-parchment)' }}>
                {result.archetypeBlurb}
              </p>
            </div>

            {/* Your questioning technique */}
            <div
              className="p-5 flex flex-col gap-3"
              style={{ background: 'var(--court-panel)', border: '1px solid var(--court-border)' }}
            >
              <div className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--court-gold-dim)' }}>
                Your Questioning Technique
              </div>
              <p className="font-sans text-sm leading-relaxed" style={{ color: 'var(--court-parchment)' }}>
                {result.performanceBlurb}
              </p>

              {/* Truth surfaced meter (moved under questioning technique) */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--court-gold-dim)' }}>
                    Truth Surfaced
                  </div>
                  <div className="font-mono text-sm font-bold" style={{ color: getTruthColor(truthPercent) }}>
                    {truthPercent}%
                  </div>
                </div>
                <div
                  className="h-4 w-full relative overflow-hidden"
                  style={{ background: 'var(--court-deep)', border: '1px solid var(--court-border)' }}
                >
                  <div
                    className="h-full transition-all duration-700"
                    style={{ width: `${truthPercent}%`, background: getTruthColor(truthPercent) }}
                  />
                </div>
                <p className="font-mono text-xs" style={{ color: getTruthColor(truthPercent) }}>
                  {getTruthLabel(truthPercent)}
                </p>
              </div>
            </div>

            {/* What was revealed vs hidden */}
            <div
              className="p-5 flex flex-col gap-4"
              style={{ background: 'var(--court-panel)', border: '1px solid var(--court-border)' }}
            >
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--court-gold-dim)' }}>
                  Revealed vs. Concealed
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <div className="font-mono text-xs uppercase tracking-wider" style={{ color: 'oklch(0.65 0.15 145)' }}>
                    You surfaced...
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {result.whatWasShown.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span style={{ color: 'oklch(0.65 0.15 145)' }} className="font-mono text-xs shrink-0 mt-0.5">&#10003;</span>
                        <span className="font-sans text-xs leading-relaxed" style={{ color: 'var(--court-parchment)' }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--court-red-bright)' }}>
                    What was hidden
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {result.whatWasHidden.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span style={{ color: 'var(--court-red-bright)' }} className="font-mono text-xs shrink-0 mt-0.5">&#215;</span>
                        <span className="font-sans text-xs leading-relaxed" style={{ color: 'var(--court-parchment)' }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Ground truth reveal */}
            <div
              className="p-5 flex flex-col gap-3"
              style={{ background: 'var(--court-panel)', border: '1px solid var(--court-gold)' }}
            >
              <div className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--court-gold)' }}>
                The Ground Truth
              </div>
              <p className="font-sans text-sm leading-relaxed" style={{ color: 'var(--court-parchment)' }}>
                {caseFile.groundTruth}
              </p>
            </div>

            {/* Witness decision trace JSON */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setShowDecisionTraceJSON((v) => !v)}
                className="btn-ghost font-mono text-xs uppercase tracking-wider text-left px-2 py-1"
                style={{ color: 'var(--court-gold-dim)', border: '1px solid transparent' }}
              >
                {showDecisionTraceJSON ? 'Hide' : 'Show'} Witness Decision Trace (JSON)
              </button>
              {showDecisionTraceJSON && (
                <pre
                  className="font-mono text-xs p-3 overflow-x-auto leading-relaxed"
                  style={{ background: 'var(--court-deep)', border: '1px solid var(--court-border)', color: 'oklch(0.65 0.15 145)' }}
                >
                  {result.aiDecisionTraceJSON || 'No decision trace available for this run.'}
                </pre>
              )}
            </div>

            <button
              onClick={() => { reset(); goTo('landing') }}
              className="btn-primary w-full py-4 font-mono text-sm tracking-[0.2em] uppercase font-semibold"
              style={{ background: 'var(--court-panel)', color: 'var(--court-gold)', border: '2px solid var(--court-gold)' }}
            >
              Back to Front Page
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function getTruthColor(pct: number): string {
  if (pct >= 70) return 'oklch(0.65 0.15 145)'
  if (pct >= 40) return 'oklch(0.72 0.11 85)'
  return 'oklch(0.62 0.22 25)'
}

function getTruthLabel(pct: number): string {
  if (pct >= 80) return 'Exceptional. You found almost everything.'
  if (pct >= 60) return 'Strong. Some threads slipped through.'
  if (pct >= 40) return 'Partial. The witness concealed more than you found.'
  if (pct >= 20) return 'You were handed a carefully curated version of reality.'
  return 'The witness ran the room. You got almost nothing useful.'
}
