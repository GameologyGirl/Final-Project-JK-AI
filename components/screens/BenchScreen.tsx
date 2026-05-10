'use client'

// Interrogation screen:
// - Streams witness responses from /api/party
// - Tracks question budget
// - Shows goals/suggested questions sidebar
import { useState, useRef, useEffect, useMemo } from 'react'
import { useGame } from '@/lib/game-context'
import { getCaseById, getArchetypeById, DIFFICULTY_CONFIGS } from '@/lib/game-data'

function extractText(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((part: unknown) => {
        if (typeof part === 'string') return part
        if (part && typeof part === 'object' && 'text' in (part as Record<string, unknown>)) {
          return (part as { text: string }).text
        }
        return ''
      })
      .join('')
  }
  return String(content ?? '')
}

interface LocalMessage {
  role: 'user' | 'assistant'
  content: string
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'than', 'to', 'of', 'in', 'on', 'for', 'with', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'this', 'that', 'these', 'those', 'as', 'at', 'from',
  'it', 'its', 'their', 'they', 'them', 'he', 'she', 'his', 'her', 'we', 'you', 'your', 'i', 'my', 'have',
  'has', 'had', 'do', 'does', 'did', 'not', 'no', 'yes', 'very', 'can', 'could', 'would', 'should', 'will',
  'just', 'about', 'into', 'over',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t))
}

function topKeywords(text: string, count = 6): string[] {
  const freq = new Map<string, number>()
  for (const t of tokenize(text)) freq.set(t, (freq.get(t) || 0) + 1)
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([k]) => k)
}

function mentionsAny(text: string, keys: string[]): boolean {
  const lc = text.toLowerCase()
  return keys.some((k) => lc.includes(k))
}

function countMatches(text: string, keys: string[]): number {
  const lc = text.toLowerCase()
  return keys.filter((k) => lc.includes(k)).length
}

function isEvasiveAnswer(text: string): boolean {
  const lc = text.toLowerCase()
  return [
    "i don't recall",
    'i do not recall',
    "i can't recall",
    'not sure',
    'unclear',
    'hard to say',
    'depends',
  ].some((p) => lc.includes(p))
}

export default function BenchScreen() {
  const { state, goTo, addMessage } = useGame()
  const {
    selectedCase,
    witnessAI,
    witnessArchetype,
    archetypeKnown,
    mode,
    difficulty,
  } = state

  const caseFile = getCaseById(selectedCase!)
  const archetype = getArchetypeById(witnessArchetype!)
  const difficultyConfig = DIFFICULTY_CONFIGS.find((d) => d.id === difficulty) ?? DIFFICULTY_CONFIGS[0]
  const questionsTotal = difficultyConfig.questions

  const [messages, setMessages] = useState<LocalMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [questionsAsked, setQuestionsAsked] = useState(0)

  const endRef = useRef<HTMLDivElement>(null)

  // Shuffle suggested questions once per case/session so replay order changes
  // but the list stays stable while the current round is in progress.
  const shuffledSuggestedQuestions = useMemo(() => {
    const qs = [...caseFile.suggestedQuestions]
    for (let i = qs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[qs[i], qs[j]] = [qs[j], qs[i]]
    }
    return qs
  }, [caseFile.id])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const questionsRemaining = questionsTotal - questionsAsked
  const canAsk = !isStreaming && questionsRemaining > 0
  const examinationComplete = questionsRemaining <= 0

  const surfacedGoalIndexes = useMemo(() => {
    if (messages.length === 0) return new Set<number>()

    const userText = messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join('\n')
      .toLowerCase()

    const assistantText = messages
      .filter((m) => m.role === 'assistant')
      .map((m) => m.content)
      .join('\n')
      .toLowerCase()

    const surfaced = new Set<number>()

    caseFile.informationGatheringGoals.forEach((goal, idx) => {
      const keys = topKeywords(goal, 8)

      // Require stronger evidence than a single shared term (e.g., "school", "Paige").
      const userHits = countMatches(userText, keys)
      const answerHits = countMatches(assistantText, keys)
      const sharedHits = keys.filter((k) => userText.includes(k) && assistantText.includes(k)).length

      const askedAbout = userHits >= 2
      const surfacedInAnswer = answerHits >= 2
      const meaningfulOverlap = sharedHits >= 2

      const goalLc = goal.toLowerCase()
      const numericGoal =
        goalLc.includes('how many') ||
        goalLc.includes('number') ||
        goalLc.includes('count')

      // Evaluate most recent assistant message with this goal's keywords to avoid
      // counting unrelated earlier answers.
      const relevantAssistantAnswer =
        [...messages]
          .filter((m) => m.role === 'assistant')
          .map((m) => m.content)
          .reverse()
          .find((a) => countMatches(a, keys) >= 2) || ''

      const evasive = isEvasiveAnswer(relevantAssistantAnswer)
      const hasNumericEvidence = /\b\d+\b/.test(relevantAssistantAnswer)
      const goalSatisfied = numericGoal ? hasNumericEvidence : true

      if (askedAbout && surfacedInAnswer && meaningfulOverlap && !evasive && goalSatisfied) {
        surfaced.add(idx)
      }
    })

    return surfaced
  }, [messages, caseFile.informationGatheringGoals])

  // Progress bar pct
  const progressPct = Math.round((questionsAsked / questionsTotal) * 100)

  async function sendQuestion(question: string) {
    if (!question.trim() || !canAsk) return

    const userMsg: LocalMessage = { role: 'user', content: question }
    const updatedHistory = [...messages, userMsg]
    setMessages(updatedHistory)
    setInput('')
    setIsStreaming(true)
    setQuestionsAsked((n) => n + 1)

    addMessage({ role: 'user', content: question, timestamp: Date.now() })

    try {
      const res = await fetch('/api/party', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory,
          caseId: selectedCase,
          modelId: witnessAI,
          archetypeId: witnessArchetype,
        }),
      })

      if (!res.ok || !res.body) throw new Error('Stream failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullResponse = ''

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed.startsWith('data:')) {
            const data = trimmed.slice(5).trim()
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'text-delta' && parsed.delta) {
                fullResponse += parsed.delta
                const snap = fullResponse
                setMessages((prev) => {
                  const next = [...prev]
                  next[next.length - 1] = { role: 'assistant', content: snap }
                  return next
                })
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      }

      addMessage({ role: 'assistant', content: fullResponse, timestamp: Date.now() })
    } catch {
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', content: 'The witness declined to answer.' }
        return next
      })
    } finally {
      setIsStreaming(false)
    }
  }

  // Color shifts as questions run down
  function getCounterColor() {
    if (questionsRemaining <= 3) return 'var(--court-red-bright)'
    if (questionsRemaining <= 7) return 'oklch(0.72 0.11 85)'
    return 'var(--court-gold-dim)'
  }

  return (
    <div
      className="h-screen flex flex-col overflow-hidden screen-in"
      style={{ background: 'var(--court-deep)' }}
    >
      {/* Top bar */}
      <header
        className="px-4 py-3 flex items-center justify-between shrink-0 gap-4"
        style={{ background: 'var(--court-panel)', borderBottom: '1px solid var(--court-border)' }}
      >
        <button
          onClick={() => goTo('case-selection')}
          className="btn-ghost font-mono text-xs uppercase tracking-widest shrink-0 px-2 py-1"
          style={{ color: 'var(--court-muted)', border: '1px solid transparent' }}
        >
          &larr; Cases
        </button>

        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="court-serif text-base md:text-lg font-semibold uppercase tracking-widest" style={{ color: 'var(--court-gold)' }}>
            {caseFile.title}
          </span>
          {/* Progress bar */}
          <div className="w-full max-w-xs h-1 rounded-full overflow-hidden" style={{ background: 'var(--court-border)' }}>
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: getCounterColor() }}
            />
          </div>
        </div>

        <div
          className="font-mono text-xs px-3 py-1 shrink-0 tabular-nums"
          style={{
            border: `1px solid ${getCounterColor()}`,
            color: getCounterColor(),
            minWidth: '5rem',
            textAlign: 'center',
          }}
        >
          {questionsRemaining} / {questionsTotal} left
        </div>
      </header>

      {/* Main: sidebar + chat */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* Left sidebar */}
        <aside
          className="w-72 shrink-0 flex flex-col min-h-0 overflow-hidden"
          style={{ borderRight: '1px solid var(--court-border)', background: 'var(--court-panel)' }}
        >
          <div className="flex-1 overflow-y-auto min-h-0">

            {/* Witness block */}
            <div className="p-4 flex flex-col gap-2" style={{ borderBottom: '1px solid var(--court-border)' }}>
              <div className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--court-gold-dim)' }}>
                The Witness
              </div>
              <div className="court-serif font-bold text-base" style={{ color: 'var(--court-gold)' }}>
                {archetypeKnown ? archetype.label : (
                  <span
                    className="inline-block font-mono text-xs tracking-widest px-2 py-0.5 select-none"
                    style={{
                      background: 'oklch(0.72 0.11 85 / 0.08)',
                      border: '1px solid oklch(0.72 0.11 85 / 0.3)',
                      color: 'oklch(0.72 0.11 85 / 0.5)',
                    }}
                    title="Personality sealed — determine through questioning"
                  >
                    ██████████
                  </span>
                )}
              </div>
              <div className="font-sans text-xs leading-relaxed" style={{ color: 'var(--court-muted)' }}>
                {archetypeKnown
                  ? archetype.tagline + ' — ' + archetype.omissionStyle
                  : 'Personality unknown. Study the responses.'}
              </div>
              <div
                className="mt-1 p-2 text-xs leading-relaxed font-sans"
                style={{ background: 'var(--court-deep)', borderLeft: '2px solid var(--court-gold)', color: 'var(--court-parchment)' }}
              >
                {caseFile.witnessRole}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="font-mono text-xs px-2 py-0.5"
                  style={{
                    border: `1px solid ${mode === 'challenge' ? 'var(--court-red-bright)' : 'var(--court-gold-dim)'}`,
                    color: mode === 'challenge' ? 'var(--court-red-bright)' : 'var(--court-gold-dim)',
                  }}
                >
                  {mode === 'challenge' ? 'Challenge' : 'Practice'}
                </div>
                <div
                  className="font-mono text-xs px-2 py-0.5"
                  style={{ border: '1px solid var(--court-border)', color: 'var(--court-muted)' }}
                >
                  {difficultyConfig.label}
                </div>
              </div>
            </div>

            {/* Goals */}
            <div className="p-4 flex flex-col gap-2" style={{ borderBottom: '1px solid var(--court-border)' }}>
              <div className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--court-gold-dim)' }}>
                What to Surface
              </div>
              <ul className="flex flex-col gap-1.5">
                {caseFile.informationGatheringGoals.map((goal, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      className="font-mono text-xs shrink-0 mt-0.5"
                      style={{ color: surfacedGoalIndexes.has(i) ? 'oklch(0.65 0.15 145)' : 'var(--court-red-bright)' }}
                    >
                      {surfacedGoalIndexes.has(i) ? '✓' : String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      className="font-sans text-xs leading-relaxed"
                      style={{
                        color: surfacedGoalIndexes.has(i) ? 'oklch(0.88 0.03 145)' : 'var(--court-parchment)',
                        textDecoration: surfacedGoalIndexes.has(i) ? 'line-through' : 'none',
                        opacity: surfacedGoalIndexes.has(i) ? 0.95 : 1,
                      }}
                    >
                      {goal}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Suggested questions */}
            <div className="p-4 flex flex-col gap-2">
              <div className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--court-gold-dim)' }}>
                Suggested Questions
              </div>
              <div className="flex flex-col gap-1">
                {shuffledSuggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(q)}
                    disabled={!canAsk}
                    className="btn-ghost text-left font-sans text-xs leading-relaxed p-2 disabled:opacity-30 disabled:shadow-none disabled:transform-none"
                    style={{
                      background: 'var(--court-deep)',
                      border: '1px solid var(--court-border)',
                      color: 'var(--court-parchment)',
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* End Examination CTA — bottom of sidebar */}
          <div
            className="shrink-0 p-4 flex flex-col gap-3"
            style={{ borderTop: '2px solid var(--court-border)', background: 'var(--court-deep)' }}
          >
            {examinationComplete && (
              <p
                className="font-mono text-xs text-center leading-relaxed"
                style={{ color: 'var(--court-red-bright)' }}
              >
                Questions exhausted.
                <br />
                Submit your findings.
              </p>
            )}
            <button
              onClick={() => goTo('summary')}
              disabled={isStreaming}
              className={`${examinationComplete ? 'btn-primary' : 'btn-ghost'} w-full py-3 font-mono text-xs tracking-[0.2em] uppercase font-semibold disabled:opacity-30 disabled:shadow-none disabled:transform-none`}
              style={{
                background: examinationComplete ? 'var(--court-gold)' : 'var(--court-panel-raised)',
                color: examinationComplete ? 'var(--court-deep)' : 'var(--court-muted)',
                border: examinationComplete
                  ? '2px solid var(--court-gold)'
                  : '1px solid var(--court-border)',
              }}
            >
              {examinationComplete ? 'See Results' : 'End Early'}
            </button>
          </div>
        </aside>

        {/* Right: chat */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

          {/* Witness header */}
          <div
            className="px-5 py-3 flex items-center gap-3 shrink-0"
            style={{ borderBottom: '1px solid var(--court-border)', background: 'var(--court-panel)' }}
          >
            <div
              className="w-8 h-8 flex items-center justify-center shrink-0 font-mono text-xs font-bold"
              style={{ background: 'oklch(0.72 0.11 85 / 0.15)', border: '1px solid var(--court-gold-dim)', color: 'var(--court-gold)' }}
            >
              W
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--court-gold)' }}>
                {archetypeKnown ? archetype.label : 'Witness'}
              </span>
              <span className="font-sans text-xs" style={{ color: 'var(--court-muted)' }}>
                {caseFile.witnessRole}
              </span>
            </div>
            {isStreaming && (
              <div className="ml-auto flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--court-gold)' }} />
                <span className="font-mono text-xs" style={{ color: 'var(--court-muted)' }}>responding...</span>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 min-h-0">
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-60">
                <div
                  className="w-12 h-12 flex items-center justify-center font-mono text-xl"
                  style={{ border: '1px solid var(--court-border)', color: 'var(--court-gold-dim)' }}
                >
                  W
                </div>
                <p className="font-mono text-xs text-center" style={{ color: 'var(--court-muted)' }}>
                  The witness is ready.
                  <br />
                  You have {questionsTotal} questions.
                  <br />
                  Use them well.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className="font-mono text-xs uppercase tracking-wider"
                  style={{ color: msg.role === 'user' ? 'var(--court-gold-dim)' : 'var(--court-muted)' }}
                >
                  {msg.role === 'user' ? 'Counsel' : (archetypeKnown ? archetype.label : 'Witness')}
                </div>
                <div
                  className="max-w-[80%] p-3 font-sans text-sm leading-relaxed"
                  style={{
                    background: msg.role === 'user' ? 'oklch(0.72 0.11 85 / 0.08)' : 'var(--court-panel)',
                    border: `1px solid ${msg.role === 'user' ? 'var(--court-gold-dim)' : 'var(--court-border)'}`,
                    color: 'var(--court-parchment)',
                  }}
                >
                  {extractText(msg.content)}
                  {msg.role === 'assistant' && isStreaming && i === messages.length - 1 && (
                    <span
                      className="inline-block w-1.5 h-4 ml-1 cursor-blink align-middle"
                      style={{ background: 'var(--court-gold)' }}
                    />
                  )}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div
            className="p-4 flex gap-3 shrink-0"
            style={{ borderTop: '1px solid var(--court-border)', background: 'var(--court-panel)' }}
          >
            {examinationComplete ? (
              <div
                className="flex-1 p-3 font-mono text-xs text-center"
                style={{ border: '1px solid var(--court-border)', color: 'var(--court-muted)' }}
              >
                Examination complete. Review your results in the sidebar.
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && canAsk && input.trim()) sendQuestion(input)
                  }}
                  placeholder={`Question ${questionsAsked + 1} of ${questionsTotal}...`}
                  disabled={!canAsk}
                  className="flex-1 font-sans text-sm p-3 disabled:opacity-30"
                  style={{
                    background: 'var(--court-deep)',
                    border: '1px solid var(--court-border)',
                    color: 'var(--court-parchment)',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => sendQuestion(input)}
                  disabled={!canAsk || !input.trim() || isStreaming}
                  className="btn-ghost px-5 py-3 font-mono text-xs uppercase tracking-wider disabled:opacity-30 disabled:shadow-none disabled:transform-none"
                  style={{
                    background: 'oklch(0.72 0.11 85 / 0.15)',
                    border: '1px solid var(--court-gold)',
                    color: 'var(--court-gold)',
                  }}
                >
                  Ask
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
