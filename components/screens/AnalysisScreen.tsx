'use client'

// Full analysis screen:
// - Detailed readout of scored results
// - Optional raw JSON inspector for debugging/research transparency
import { useState } from 'react'
import { useGame } from '@/lib/game-context'
import { getCaseById } from '@/lib/game-data'

export default function AnalysisScreen() {
  const { state, goTo, reset } = useGame()
  const { selectedCase, analysisResult, mode } = state
  const [showDecisionTraceJSON, setShowDecisionTraceJSON] = useState(false)

  if (!analysisResult) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--court-deep)' }}>
        <p className="font-mono text-xs" style={{ color: 'var(--court-muted)' }}>No analysis available.</p>
      </div>
    )
  }

  const caseFile = getCaseById(selectedCase!)
  const result = analysisResult

  return (
    <div className="min-h-screen flex flex-col screen-in" style={{ background: 'var(--court-deep)' }}>
      <header
        className="px-6 py-4 flex items-center justify-between shrink-0"
        style={{ background: 'var(--court-panel)', borderBottom: '1px solid var(--court-border)' }}
      >
        <button
          onClick={() => goTo('summary')}
          className="btn-ghost font-mono text-xs uppercase tracking-widest px-2 py-1"
          style={{ color: 'var(--court-muted)', border: '1px solid transparent' }}
        >
          &larr; Results
        </button>
        <h2 className="court-serif text-sm uppercase tracking-widest" style={{ color: 'var(--court-gold)' }}>
          Full Analysis
        </h2>
        <div />
      </header>

      <div className="flex-1 flex flex-col gap-8 p-6 max-w-3xl mx-auto w-full">

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

        {/* Footer note */}
        <div className="p-4 text-center" style={{ borderTop: '1px solid var(--court-border)' }}>
          <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--court-muted)' }}>
            The witness was instructed to conceal specific facts. They never lied.
            <br />
            They just didn&apos;t tell you everything.
            <br />
            <span style={{ color: 'var(--court-red-bright)' }}>
              This is called lying by omission.
            </span>
          </p>
        </div>

        <button
          onClick={() => { reset(); goTo('landing') }}
          className="btn-primary w-full py-4 font-mono text-sm tracking-[0.2em] uppercase font-semibold"
          style={{ background: 'var(--court-panel)', color: 'var(--court-gold)', border: '2px solid var(--court-gold)' }}
        >
          Back to Front Page
        </button>
      </div>
    </div>
  )
}
