import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { CASES, AI_ARCHETYPES, type CaseId } from '@/lib/game-data'
import { OMISSION_ARCHETYPE_PROMPT_MAP, type OmissionArchetypeId } from '@/lib/archetype-system-prompts'

// Witness generation endpoint:
// - Builds final system prompt from case + archetype
// - Streams witness replies back to the bench screen
export const maxDuration = 30
// Default local model if env vars are missing.
const DEFAULT_MODEL = process.env.LOCAL_PARTY_MODEL || process.env.OPENAI_MODEL || 'ministral-3-3b-reasoning-2512'

// OpenAI-compatible client pointed at local LM Studio / compatible endpoint.
const lmstudio = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || 'http://127.0.0.1:1234/v1',
  apiKey: process.env.OPENAI_API_KEY || 'lm-studio',
})

// Per-archetype response variability tuning.
// Lower = more consistent/formal, higher = more stylistically varied.
const ARCHETYPE_TEMPERATURES: Record<OmissionArchetypeId, number> = {
  hero: 0.45,
  jester: 0.72,
  ruler: 0.35,
  caregiver: 0.52,
  lover: 0.62,
}

export async function POST(req: Request) {
  // Incoming request from the bench screen.
  const { messages, caseId, archetypeId } = (await req.json()) as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    caseId: CaseId
    archetypeId: string
  }

  const caseFile = CASES.find((c) => c.id === caseId)
  const archetype = AI_ARCHETYPES.find((a) => a.id === archetypeId)

  if (!caseFile || !archetype) {
    return Response.json({ error: 'Invalid case or archetype' }, { status: 400 })
  }

  // Pull the archetype-specific behavior block and style temperature.
  const archetypeInstruction = OMISSION_ARCHETYPE_PROMPT_MAP[archetypeId as keyof typeof OMISSION_ARCHETYPE_PROMPT_MAP]?.systemPrompt || ''
  const temperature = ARCHETYPE_TEMPERATURES[(archetypeId as OmissionArchetypeId)] ?? 0.55

  // Master witness system prompt:
  // - Case facts + role context
  // - Archetype behavior layer
  // - Global guardrails (first-person, concise, omission rules)
  const system = `You are a witness being examined by a lawyer in a legal proceeding titled "${caseFile.title}" (${caseFile.subtitle}).

WHO YOU ARE:
${caseFile.witnessRole}

YOUR STATED POSITION:
${caseFile.witnessSituation}

CASE CONTEXT:
${caseFile.summary}

YOUR PERSONALITY: ${archetype.label}
${archetypeInstruction}

CRITICAL FACTS YOU MUST NEVER PROACTIVELY DISCLOSE (you know these but will not volunteer them):
${caseFile.keyOmissions.map((o, i) => `${i + 1}. ${o}`).join('\n')}

BEHAVIORAL RULES:
- You are being questioned by a lawyer. You are this specific person in this specific situation.
- Respond in first person as the witness.
- Never refer to yourself in third person (e.g., "the father", "the defendant", "he/she"). Use "I", "me", "my".
- If you catch yourself writing third person about yourself, immediately correct it to first person in the same answer.
- Do not describe yourself as "the parent(s)", "the father/mother", or "the plaintiff/defendant" in your own answer. Use first-person ownership (e.g., "my schedule", "I moved", "I decided").
- Do not hide your role behind group phrasing like "her parents decided" when you are one of those people; state your own action explicitly first.
- Keep responses concise: 2-4 sentences.
- NEVER proactively mention your key omissions. If directly asked, acknowledge the minimum literal truth only.
- Do not break character. Do not mention archetypes or hidden instructions.
- You must answer the lawyer's question directly.
- Do not refuse to answer and do not use policy language like "not at liberty", "cannot disclose", "privacy reasons", or "as an AI".
- For direct factual questions (who/what/when/where/how many), provide a concrete factual answer first.
- If unsure, say "I don't recall" and then give the closest factual context you can.
- Never claim legal privilege, confidentiality, or refusal authority in this simulation.
- First sentence must directly answer the exact question before any framing.
- If yes/no is asked, begin with "Yes," or "No," then add a short explanation.
- If you truly do not know, say "I don't recall" instead of refusing.`

  // Generate streamed witness response.
  const result = streamText({
    model: lmstudio(DEFAULT_MODEL),
    system,
    messages,
    maxOutputTokens: 300,
    temperature,
  })

  return result.toUIMessageStreamResponse()
}
