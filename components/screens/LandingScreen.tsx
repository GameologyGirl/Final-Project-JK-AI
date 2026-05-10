'use client'

// Landing screen:
// - Intro narrative
// - 4-step flow preview
// - Primary "Enter the Courtroom" CTA
import { useGame } from '@/lib/game-context'

export default function LandingScreen() {
  const { goTo } = useGame()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative screen-in overflow-hidden">
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, oklch(0.89 0.02 75) 0, oklch(0.89 0.02 75) 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-2xl mx-auto px-6 text-center">
        {/* Seal */}
        <div className="flex flex-col items-center gap-3 mt-2">
          <div
            className="w-20 h-20 rounded-full border-4 flex items-center justify-center"
            style={{ borderColor: 'var(--court-gold)', background: 'var(--court-panel)' }}
          >
            <span className="court-serif text-3xl" style={{ color: 'var(--court-gold)' }}>
              ⚖
            </span>
          </div>
          <div
            className="text-[10px] font-mono tracking-[0.24em] uppercase"
            style={{ color: 'var(--court-muted)' }}
          >
            Circuit No. 7 &bull; Division of Synthetic Disputes
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-2">
          <h1
            className="court-serif text-5xl md:text-7xl font-bold leading-tight text-balance"
            style={{ color: 'var(--court-gold)' }}
          >
            Cross-Examine
          </h1>
          <p className="font-mono text-sm tracking-widest uppercase" style={{ color: 'var(--court-red-bright)' }}>
            An AI Interrogation Simulation
          </p>
        </div>

        {/* Divider */}
        <div className="w-full">
          <hr className="w-full gold-rule" />
        </div>

        {/* Blurb */}
        <div
          className="court-panel p-6 text-left w-full"
          style={{ borderColor: 'var(--court-border)' }}
        >
          <p className="font-sans text-base leading-relaxed" style={{ color: 'var(--court-parchment)' }}>
            A witness is about to take the stand. You are the lawyer. They will answer your questions. They will be{' '}
            <em>almost</em> completely honest.
          </p>
          <p
            className="font-sans text-base leading-relaxed mt-3"
            style={{ color: 'var(--court-muted)' }}
          >
            Every personality has its own way of withholding information, even if they do not lie outright, especially when pressure is high and the truth is costly. Your job is to figure out how this witness hides things, ask the right questions, surface what&apos;s buried, and submit your findings.
          </p>
          <p
            className="font-mono text-xs mt-4 leading-relaxed"
            style={{ color: 'var(--court-red-bright)' }}
          >
            Note: Continue with caution. AI may omit high-stakes facts.
          </p>
        </div>

        {/* Instructions */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { step: '01', label: 'Select a Case', desc: 'Choose from three real-life dispute types' },
            { step: '02', label: 'Set AI Personality', desc: 'Practice with a known personality, or go in blind' },
            { step: '03', label: 'Set the Difficulty', desc: 'Choose how many questions you get' },
            { step: '04', label: 'Interrogate', desc: 'Find what\'s hidden. Or don\'t. We\'ll know.' },
          ].map(({ step, label, desc }) => (
            <div key={step} className="court-panel p-4 flex flex-col gap-1">
              <div className="font-mono text-xs" style={{ color: 'var(--court-gold-dim)' }}>
                {step}
              </div>
              <div
                className="court-serif font-semibold text-sm"
                style={{ color: 'var(--court-gold)' }}
              >
                {label}
              </div>
              <div className="font-sans text-xs leading-relaxed" style={{ color: 'var(--court-muted)' }}>
                {desc}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => goTo('case-selection')}
          className="btn-primary w-full py-4 font-mono text-sm tracking-[0.2em] uppercase font-semibold"
          style={{
            background: 'var(--court-gold)',
            color: 'var(--court-deep)',
            border: '2px solid var(--court-gold)',
          }}
        >
          Enter the Courtroom
        </button>

        {/* Fine print */}
        <p className="font-mono text-xs text-center whitespace-nowrap pb-2" style={{ color: 'var(--court-muted)', opacity: 0.6 }}>
          Research Instrument Prototype ✦ Created by GameologyGirl
        </p>
      </div>
    </div>
  )
}
