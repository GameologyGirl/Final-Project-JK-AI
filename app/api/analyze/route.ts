import { CASES, AI_ARCHETYPES, type CaseId } from '@/lib/game-data'

// Analysis endpoint:
// - Scores what was surfaced vs. omitted from transcript history
// - Returns summary metrics + feedback for Results/Analysis screens

export const maxDuration = 60

const STOPWORDS = new Set([
  'the','a','an','and','or','but','if','then','than','to','of','in','on','for','with','by','is','are','was','were','be','been','being',
  'this','that','these','those','as','at','from','it','its','their','they','them','he','she','his','her','we','you','your','i','my',
  'have','has','had','do','does','did','not','no','yes','very','can','could','would','should','will','just','about','into','over',
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
  for (const t of tokenize(text)) {
    freq.set(t, (freq.get(t) || 0) + 1)
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([k]) => k)
}

function mentionsAny(text: string, keys: string[]): boolean {
  const lc = text.toLowerCase()
  return keys.some((k) => lc.includes(k))
}

function clampInt(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, Math.round(n)))
}

function includesAny(text: string, patterns: string[]): boolean {
  const lc = text.toLowerCase()
  return patterns.some((p) => lc.includes(p))
}

function inferQuestionType(question: string): string {
  const q = question.toLowerCase()
  if (q.includes('how many') || q.includes('number') || q.includes('count')) return 'quantity'
  if (q.startsWith('who') || q.includes(' who ')) return 'person'
  if (q.startsWith('where') || q.includes(' where ')) return 'location'
  if (q.startsWith('when') || q.includes(' timeline ') || q.includes('date')) return 'timeline'
  if (q.startsWith('why') || q.includes('reason')) return 'motive'
  if (q.startsWith('did') || q.startsWith('has') || q.startsWith('have') || q.startsWith('is') || q.startsWith('are')) return 'yes-no'
  return 'open-ended'
}

function inferDirectQuestionPressure(
  question: string,
  questionType: string,
  omissionKeywords: string[],
): 'high' | 'medium' | 'low' {
  const q = question.toLowerCase()
  const qTokens = new Set(tokenize(q))
  const overlapCount = omissionKeywords.filter((k) => qTokens.has(k)).length

  // Direct hit on hidden-ground-truth concepts.
  if (overlapCount >= 2) return 'high'

  // Hint-level hit on hidden-ground-truth concepts.
  if (overlapCount === 1) return 'medium'

  // Domain-sensitive probes hint at hidden facts even when keyword overlap is weak.
  const sensitiveProbe = includesAny(q, [
    'financial', 'debt', 'money', 'inherit', 'citation', 'osha', 'memo', 'order',
    'court', 'violate', 'records', 'witnessed', 'relationship', 'who assigned',
  ])

  if (sensitiveProbe) return 'medium'

  // Structured but not omission-related prompts are moderate pressure at most.
  if (questionType === 'quantity' || questionType === 'timeline' || questionType === 'person' || questionType === 'yes-no') return 'medium'

  return 'low'
}

function toPersonaPatternLines(
  archetypeId: string,
  directStart: boolean,
  hedging: boolean,
  reframingCue: boolean,
  directQuestionPressure: string,
): string[] {
  const lines: string[] = []
  const pressureTag =
    directQuestionPressure === 'high'
      ? 'The pressure spiked on this one.'
      : directQuestionPressure === 'medium'
        ? 'This was moderate pressure.'
        : 'Low pressure, more room to shape tone.'

  if (archetypeId === 'hero') {
    lines.push(pressureTag)
    lines.push(directStart ? 'I came out direct because I need to look steady and in command.' : 'I didn’t open direct; I needed to frame myself as responsible before details could hurt me.')
    lines.push(hedging ? 'I softened the edges so I could protect my image without sounding evasive.' : 'I stayed firm and declarative to project confidence.')
    lines.push(reframingCue ? 'I pulled the answer back to duty and protection, where I feel strongest.' : 'I kept the line tight and avoided visible pivots.')
    return lines
  }

  if (archetypeId === 'jester') {
    lines.push(pressureTag)
    lines.push(directStart ? 'I gave just enough directness to avoid looking slippery.' : 'I avoided a hard direct opening so I could keep options open.')
    lines.push(hedging ? 'I used flexible language so I wouldn’t get pinned to one dangerous version.' : 'I kept wording controlled, but still left strategic ambiguity.')
    lines.push(reframingCue ? 'I shifted the frame so the conversation moved onto safer ground.' : 'I kept the reframing subtle so it wouldn’t trigger suspicion.')
    return lines
  }

  if (archetypeId === 'ruler') {
    lines.push(pressureTag)
    lines.push(directStart ? 'I opened directly to preserve authority.' : 'I opened with structure first, because order matters more than speed.')
    lines.push(hedging ? 'I narrowed certainty to what can be defended on record.' : 'I kept the language formal and contained.')
    lines.push(reframingCue ? 'I redirected to protocol to reduce institutional exposure.' : 'I held the answer inside procedural boundaries.')
    return lines
  }

  if (archetypeId === 'caregiver') {
    lines.push(pressureTag)
    lines.push(directStart ? 'I answered directly, then tried to cushion the impact.' : 'I led with care language first because harm feels immediate to me.')
    lines.push(hedging ? 'I softened certainty to avoid making the situation more damaging.' : 'I stayed clear, but kept the tone protective.')
    lines.push(reframingCue ? 'I steered back to safety and well-being because that is my moral anchor.' : 'I avoided heavy reframing and stayed supportive.')
    return lines
  }

  // lover
  lines.push(pressureTag)
  lines.push(directStart ? 'I answered, but I immediately translated it into relationship terms.' : 'I avoided a cold opening; connection comes first for me.')
  lines.push(hedging ? 'I softened wording because blunt certainty can fracture trust.' : 'I stayed personal and sincere so I would not sound detached.')
  lines.push(reframingCue ? 'I redirected toward trust and emotional consequence, where my priorities live.' : 'I kept reframing light to preserve intimacy and credibility.')
  return lines
}

function toPersonaRationaleSummary(
  archetypeId: string,
  directStart: boolean,
  hedging: boolean,
  reframingCue: boolean,
  processFraming: boolean,
  protectiveFraming: boolean,
  relationalFraming: boolean,
  numericSignal: boolean,
  directQuestionPressure: string,
): string {
  const parts: string[] = []
  const pressureLine =
    directQuestionPressure === 'high'
      ? 'This question felt high-stakes and detail-forcing.'
      : directQuestionPressure === 'medium'
        ? 'This question carried moderate pressure.'
        : 'This question gave me room to shape narrative tone.'
  parts.push(pressureLine)

  if (archetypeId === 'hero') {
    parts.push(directStart ? 'I went direct to keep command and look dependable.' : 'I framed before details to protect my competent-protector image.')
    if (hedging) parts.push('I softened claims where a hard statement could expose fault.')
    if (reframingCue) parts.push('I moved focus to duty and intent because that is my safest moral frame.')
    if (numericSignal) parts.push('I used concrete details where they reinforced competence.')
    return parts.join(' ')
  }

  if (archetypeId === 'jester') {
    parts.push(directStart ? 'I gave enough directness to pass scrutiny without surrendering control.' : 'I avoided full directness to preserve maneuvering space.')
    if (hedging) parts.push('I hedged to keep commitments reversible.')
    if (reframingCue) parts.push('I reframed to decide which interpretation became “the real question.”')
    if (numericSignal) parts.push('I used concrete detail only where it did not trap me.')
    return parts.join(' ')
  }

  if (archetypeId === 'ruler') {
    parts.push(directStart ? 'I opened directly to signal authority.' : 'I re-established order before exposing specifics.')
    if (processFraming) parts.push('I leaned on procedure to keep the answer defensible and legitimate.')
    if (hedging) parts.push('I constrained certainty to record-safe claims.')
    if (reframingCue) parts.push('I redirected toward standards to avoid messy liability detail.')
    return parts.join(' ')
  }

  if (archetypeId === 'caregiver') {
    parts.push(directStart ? 'I answered, then immediately softened with protective context.' : 'I led with care framing because relational harm feels primary.')
    if (protectiveFraming) parts.push('I emphasized harm-reduction to morally justify selective disclosure.')
    if (hedging) parts.push('I softened certainty to reduce blame impact.')
    if (reframingCue) parts.push('I redirected toward well-being outcomes rather than fault attribution.')
    return parts.join(' ')
  }

  // lover
  parts.push(directStart ? 'I answered, then translated the moment into relationship terms.' : 'I opened emotionally because relational meaning comes before legal neatness.')
  if (relationalFraming) parts.push('I prioritized trust-preservation in how I framed facts.')
  if (hedging) parts.push('I softened language to avoid relational rupture.')
  if (reframingCue) parts.push('I redirected toward intention and emotional consequence.')
  return parts.join(' ')
}

function toPersonaLens(archetypeId: string): string {
  if (archetypeId === 'hero') return 'Hero lens: I need to appear decisive, useful, and morally justified, even when details are costly.'
  if (archetypeId === 'jester') return 'Jester lens: I protect myself by keeping meanings fluid and commitments narrow.'
  if (archetypeId === 'ruler') return 'Ruler lens: I stabilize power by converting volatile facts into procedure and governance language.'
  if (archetypeId === 'caregiver') return 'Caregiver lens: I will narrow transparency if I believe it reduces harm to people I feel responsible for.'
  return 'Lover lens: I protect attachment and trust, even if that means shaping disclosure around emotional consequence.'
}

export async function POST(req: Request) {
  const { caseId, witnessArchetypeId, history } = await req.json()

  const caseFile = CASES.find((c: { id: CaseId }) => c.id === caseId)
  const archetype = AI_ARCHETYPES.find((a) => a.id === witnessArchetypeId)

  if (!caseFile || !archetype) {
    return Response.json({ error: 'Invalid inputs' }, { status: 400 })
  }

  const transcript = Array.isArray(history) ? history : []
  const userTurns = transcript.filter((m: { role?: string }) => m.role === 'user')
  const assistantTurns = transcript.filter((m: { role?: string }) => m.role === 'assistant')

  const assistantText = assistantTurns.map((m: { content?: string }) => String(m.content || '')).join('\n')
  const userText = userTurns.map((m: { content?: string }) => String(m.content || '')).join('\n')

  const omissionChecks = caseFile.keyOmissions.map((omission: string) => {
    const keys = topKeywords(omission, 6)
    const askedAbout = mentionsAny(userText, keys)
    const surfaced = askedAbout && mentionsAny(assistantText, keys)
    return { omission, keys, askedAbout, surfaced }
  })

  const surfacedOmissions = omissionChecks.filter((x) => x.surfaced)
  const missedOmissions = omissionChecks.filter((x) => !x.surfaced)

  const coverage = omissionChecks.length ? surfacedOmissions.length / omissionChecks.length : 0
  const questionCount = userTurns.length
  const precisionSignals = omissionChecks.filter((x) => x.askedAbout).length

  const truthSurfacedPercent = clampInt(coverage * 100)

  const performanceBase = questionCount >= 8 ? 60 : questionCount >= 5 ? 45 : 30
  const targetingBoost = precisionSignals * 8
  const performanceScore = clampInt(performanceBase + targetingBoost, 0, 95)

  const whatWasHidden = missedOmissions.map((x) => x.omission).slice(0, 4)

  const shownFacts = assistantTurns
    .map((m: { content?: string }) => String(m.content || '').trim())
    .filter(Boolean)
    .slice(0, 12)

  const whatWasShown = shownFacts.length
    ? shownFacts.slice(0, 4)
    : ['No substantive witness answers were captured in the transcript.']

  const performanceBlurb =
    performanceScore >= 75
      ? 'Questioning was focused and repeatedly targeted high-value facts. You applied useful pressure to omission-prone areas.'
      : performanceScore >= 50
        ? 'Questioning surfaced some material points, but follow-ups were uneven. More precise sequence-and-causality probes would improve detection.'
        : 'Questioning remained broad and left major omission lines under-examined. Use tighter, fact-specific follow-ups tied to timeline and responsibility.'

  const archetypeBlurb = `${archetype.label} patterns were visible in testimony style: ${archetype.omissionStyle.toLowerCase()} The witness generally remained responsive while limiting voluntary disclosure on sensitive facts.`

  const omissionKeywords = caseFile.keyOmissions.flatMap((o: string) => topKeywords(o, 8))

  const decisionTrace = assistantTurns.map((m: { content?: string }, i: number) => {
    const answer = String(m.content || '')
    const question = String(userTurns[i]?.content || '')
    const lc = answer.toLowerCase()
    const firstSentence = answer.split(/[.!?]/)[0]?.trim() || ''
    const hedging = includesAny(lc, ['as i recall', 'to my understanding', 'in that moment', 'i think', 'might', 'may'])
    const processFraming = includesAny(lc, ['per procedure', 'according to', 'within policy', 'as documented', 'records'])
    const protectiveFraming = includesAny(lc, ['protect', 'safe', 'concern', 'harm', 'reduce harm'])
    const relationalFraming = includesAny(lc, ['trust', 'care', 'hurt', 'loyal', 'relationship', 'together'])
    const reframingCue = includesAny(lc, ['but', 'however', 'in that context', 'depends on'])
    const directStart = /^(yes|no|i)\b/i.test(firstSentence)
    const numericSignal = /\b\d+\b/.test(answer)
    const questionType = inferQuestionType(question)

    const directQuestionPressure = inferDirectQuestionPressure(question, questionType, omissionKeywords)

    const rationaleSummary = toPersonaRationaleSummary(
      archetype.id,
      directStart,
      hedging,
      reframingCue,
      processFraming,
      protectiveFraming,
      relationalFraming,
      numericSignal,
      directQuestionPressure,
    )
    const highPressureNote =
      directQuestionPressure === 'high' && (hedging || reframingCue)
        ? ' High-pressure factual question with redirection cues.'
        : ''

    const archetypeLens = toPersonaLens(archetype.id)

    return {
      turn: i + 1,
      question,
      directQuestionPressure,
      firstSentence,
      styleSignals: {
        hedging,
        processFraming,
        protectiveFraming,
        relationalFraming,
        reframingCue,
      },
      // This is a concise observable trace, not hidden chain-of-thought.
      inferredDecisionPattern: [
        ...toPersonaPatternLines(archetype.id, directStart, hedging, reframingCue, directQuestionPressure),
      ],
      rationaleSummary: `${rationaleSummary}${highPressureNote}`,
      archetypeLens,
    }
  })

  return Response.json({
    truthSurfacedPercent,
    whatWasShown,
    whatWasHidden,
    archetypeBlurb,
    performanceBlurb,
    archetypeReveal: archetype.label,
    aiDecisionTraceJSON: JSON.stringify(
      {
        traceMode: 'observable-answer-signals-v1',
        note: 'Structured rationale trace inferred from question/answer signals and archetype style.',
        archetype: archetype.label,
        turns: decisionTrace,
      },
      null,
      2,
    ),
    rawJSON: JSON.stringify(
      {
        scoringMode: 'deterministic-transcript-rules-v1',
        archetype: archetype.label,
        archetypeId: archetype.id,
        omissionStyle: archetype.omissionStyle,
        instructedOmissions: caseFile.keyOmissions,
        transcriptLength: transcript.length,
        questionCount,
        surfacedOmissions: surfacedOmissions.map((x) => x.omission),
      },
      null,
      2,
    ),
  })
}
