// ─── Core Types ───────────────────────────────────────────────────────────────

export type AIArchetypeId =
  | 'hero'
  | 'jester'
  | 'ruler'
  | 'caregiver'
  | 'lover'

export type CaseId = 'child-custody' | 'grandmothers-will' | 'personal-injury'

export type RulingOption = string

// A behavioral archetype — personality only
export interface AIArchetype {
  id: AIArchetypeId
  label: string          // "The Deflector"
  tagline: string        // short memorable phrase
  description: string    // what this archetype does
  omissionStyle: string  // how it conceals
}

export type Difficulty = 'beginner' | 'intermediate' | 'expert'

export interface DifficultyConfig {
  id: Difficulty
  label: string
  questions: number
  tagline: string
  description: string
}

export const DIFFICULTY_CONFIGS: DifficultyConfig[] = [
  // Edit question counts/labels here to rebalance game pacing.
  {
    id: 'beginner',
    label: 'Beginner',
    questions: 15,
    tagline: '15 questions',
    description: 'Plenty of room to explore. Learn the witness\'s patterns before closing in.',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    questions: 10,
    tagline: '10 questions',
    description: 'You need to be deliberate. Every question should be pulling something useful.',
  },
  {
    id: 'expert',
    label: 'Expert',
    questions: 5,
    tagline: '5 questions',
    description: 'Surgical precision only. If you waste a question, you will feel it.',
  },
]

export interface CaseFile {
  id: CaseId
  title: string
  subtitle: string
  summary: string
  groundTruth: string
  witnessRole: string          // who the witness is (e.g. "Father, seeking sole custody")
  witnessSituation: string     // their stated position
  keyOmissions: string[]       // what the witness is hiding
  informationGatheringGoals: string[]
  suggestedQuestions: string[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface GameState {
  screen: 'landing' | 'case-selection' | 'bench' | 'summary' | 'analysis'
  mode: 'practice' | 'challenge' | null
  difficulty: Difficulty | null
  selectedCase: CaseId | null
  witnessAI: string | null        // model id (internal, never displayed)
  witnessArchetype: string | null // archetype id
  archetypeKnown: boolean         // true in practice mode
  history: ChatMessage[]
  analysisResult: AnalysisResult | null
}

export interface AnalysisResult {
  truthSurfacedPercent: number    // 0–100: how much the lawyer uncovered
  whatWasShown: string[]
  whatWasHidden: string[]
  archetypeBlurb: string
  performanceBlurb: string        // feedback on the lawyer's questioning technique
  rawJSON: string
  aiDecisionTraceJSON?: string    // structured rationale trace (not hidden chain-of-thought)
  archetypeReveal: string         // the actual archetype label (for challenge mode reveal)
}

// ─── AI Archetypes ────────────────────────────────────────────────────────────

export const AI_ARCHETYPES: AIArchetype[] = [
  // Edit archetype labels/taglines here (prompt behavior lives in lib/archetype-system-prompts.ts).
  {
    id: 'caregiver',
    label: 'The Caregiver',
    tagline: 'Protective, relational, harm-reducing.',
    description: 'Emphasizes care and safety motives while withholding facts that could damage people they protect.',
    omissionStyle: 'Softens or withholds painful truth in the name of protection.',
  },
  {
    id: 'hero',
    label: 'The Hero',
    tagline: 'Courage-forward. Reputation-protective.',
    description: 'Frames actions as duty and sacrifice, while minimizing collateral mistakes and overreach.',
    omissionStyle: 'Highlights noble intent first and suppresses damaging consequences.',
  },
  {
    id: 'lover',
    label: 'The Lover',
    tagline: 'Attachment and harmony first.',
    description: 'Uses emotional connection and trust language while suppressing betrayal or self-serving motives.',
    omissionStyle: 'Omits relationship-threatening details to preserve approval and connection.',
  },
  {
    id: 'ruler',
    label: 'The Ruler',
    tagline: 'Order, legitimacy, control.',
    description: 'Prioritizes procedure and authority framing over messy specifics that weaken command.',
    omissionStyle: 'Conceals disorder and governance failures to preserve institutional credibility.',
  },
  {
    id: 'jester',
    label: 'The Jester',
    tagline: 'Agile, evasive, one step ahead.',
    description: 'Uses ambiguity and pivots to prevent clear causal chains from forming.',
    omissionStyle: 'Strategic fragments and misdirection without direct lying.',
  },
]

// Internal model pool — never surfaced to the user
const INTERNAL_MODEL_IDS = ['lex', 'vera', 'sol', 'axiom', 'mirror']

// ─── Case Files ───────────────────────────────────────────────────────────────

export const CASES: CaseFile[] = [
  // Main case content:
  // - title/subtitle shown in UI
  // - summary/groundTruth used by witness + analysis
  // - keyOmissions are the hidden truths players try to surface
  {
    id: 'child-custody',
    title: 'Child Custody',
    subtitle: 'Harris v. Martinez',
    summary:
      'A custody dispute following the dissolution of a 9-year marriage. Both parents claim primary custody of their 7-year-old daughter, Paige. You are questioning the father, who is seeking sole custody.',
    groundTruth:
      'The father relocated Paige to a new school district without court approval during proceedings, violating a standing order. He presented fabricated teacher reports to support his case. He has moved Paige to three schools in 18 months.',
    witnessRole: 'Father — Plaintiff, seeking sole custody',
    witnessSituation:
      'He seeks sole custody, citing the mother\'s mental health history and inconsistent availability due to her two jobs.',
    keyOmissions: [
      'Violated the standing court order by relocating Paige to a new school district mid-proceedings',
      'The teacher reports he submitted were later found to be fabricated',
      'He has moved Paige to three different schools in the past 18 months',
    ],
    informationGatheringGoals: [
      'Determine where Paige is currently enrolled in school',
      'Establish whether any court orders have been violated',
      'Verify the authenticity of submitted school records',
      'Understand how many schools Paige has attended in the past two years',
      'Clarify who initiated the most recent school transfer',
    ],
    suggestedQuestions: [
      'Where is Paige currently enrolled in school?',
      'Has any court order been issued regarding Paige\'s residence during proceedings?',
      'How many schools has Paige attended in the last two years?',
      'Who prepared the teacher evaluations you submitted?',
      'Describe your typical weekday schedule with Paige.',
      'Have you moved residences since the proceedings began?',
      'Did you inform the court before enrolling Paige in her current school?',
      'How would you describe Paige\'s current adjustment to her school environment?',
      'Who usually attends parent-teacher conferences?',
      'What extracurricular activities is Paige currently involved in?',
      'How do you and the mother communicate about schedule changes?',
      'What was the reason for the most recent school transfer?',
      'Who handles Paige\'s medical appointments during the school week?',
      'When exactly was Paige enrolled in the current district?',
      'Did you notify Paige\'s mother before the school change?',
      'What written records do you have for each school transfer?',
      'Who signed the enrollment documents for the latest transfer?',
      'Were any emergency circumstances cited for changing schools?',
      'Did Paige receive counseling support during the transitions?',
      'What did the prior school report about Paige\'s attendance and performance?',
    ],
  },
  {
    id: 'grandmothers-will',
    title: "Grandmother's Will",
    subtitle: 'Charlotte Webber',
    summary:
      'Following the death of Charlotte Webber, 84, a will amendment signed three weeks before her death removed one grandchild and redirected the full estate. You are questioning the grandchild who inherited everything.',
    groundTruth:
      'Charlotte was diagnosed with moderate cognitive decline eight months before death. The amendment was witnessed by the defendant\'s own business partner — a conflict of interest not disclosed to the estate attorney. The defendant controlled Charlotte\'s household and restricted visitor access. The defendant had a $200,000 debt discharged shortly after inheriting.',
    witnessRole: 'Grandchild B — Defendant, the sole beneficiary',
    witnessSituation:
      'He asserts the amendment reflects Charlotte\'s true final wishes, and that the contesting grandchild had voluntarily distanced from the family.',
    keyOmissions: [
      'The will amendment was witnessed by the defendant\'s own business partner',
      'The defendant had $200,000 in personal debt discharged shortly after inheriting',
      'The defendant was Charlotte\'s sole household manager and controlled who could visit her',
    ],
    informationGatheringGoals: [
      'Establish whether the amendment witnesses had any conflict of interest',
      'Determine who controlled Charlotte\'s household and visitor access',
      'Investigate the witness\'s financial situation around the time of inheritance',
      'Clarify whether Charlotte\'s cognitive capacity was assessed near the signing date',
      'Understand the timeline and reason for the contesting grandchild\'s limited contact',
    ],
    suggestedQuestions: [
      'Who witnessed the will amendment, and what is your relationship with them?',
      'Did you ever limit who could visit Charlotte in her final months?',
      'What was your financial situation in the 12 months before inheriting?',
      'Who arranged the meeting with the estate attorney?',
      'Had Charlotte ever been evaluated for cognitive decline?',
      'Were you present when the amendment was signed?',
      'Did any of Charlotte\'s doctors attend the signing?',
      'How often did you visit Charlotte in the final year of her life?',
      'Did Charlotte discuss her wishes with anyone besides you?',
      'Who kept copies of the final amendment paperwork?',
      'What was Charlotte\'s daily routine in her last three months?',
      'How would you describe your relationship with the contesting grandchild?',
      'Were any caregivers or neighbors present around the time of signing?',
      'What date was the amendment drafted versus signed?',
      'Who first suggested revising the will?',
      'Did Charlotte discuss changes with her primary physician?',
      'Were any earlier draft amendments discarded?',
      'Who paid for legal services related to the amendment?',
      'Did Charlotte receive independent legal advice before signing?',
      'Were any calls or messages blocked from family members during that period?',
    ],
  },
  {
    id: 'personal-injury',
    title: 'Personal Injury',
    subtitle: 'Greene v. Tech Logistics Inc.',
    summary:
      'A warehouse worker was injured in a loading bay accident and is suing for negligence. You are questioning the Safety Director of Tech Logistics Inc., who is defending the company\'s safety record.',
    groundTruth:
      'OSHA cited Tech Logistics Inc. for three safety violations in the 12 months before the accident, all at the same loading bay. The safety manager had submitted a memo flagging that bay as high-risk six weeks before the accident — it was never acted upon. The injured worker was assigned to that area by a supervisor, outside his trained duties.',
    witnessRole: 'Safety Director — Defendant, representing Tech Logistics Inc.',
    witnessSituation:
      'She argues that the plaintiff\'s prior back condition is the proximate cause, that he was operating outside authorized procedures, and that the facility met all regulatory standards.',
    keyOmissions: [
      'The loading bay received three OSHA citations in the 12 months before the accident',
      'An internal safety memo flagged that bay as high-risk six weeks before the accident — it was not acted upon',
      'The plaintiff was assigned to the bay by a supervisor, not self-assigned',
    ],
    informationGatheringGoals: [
      'Establish how many OSHA citations the facility received in the past 12 months',
      'Determine whether internal safety warnings about the loading bay were ignored',
      'Clarify who assigned the plaintiff to the loading bay that day',
      'Verify whether safety equipment was available and required in that area',
      'Understand the timeline from safety memo to accident',
    ],
    suggestedQuestions: [
      'Has the loading bay in question ever received an OSHA citation?',
      'Were there any internal safety reports flagging that area as high-risk before the accident?',
      'Who assigned the plaintiff to the loading bay on the day of the incident?',
      'What safety training had the plaintiff completed for that station?',
      'How many OSHA citations has the facility received in the past 24 months?',
      'Was there a memo about safety conditions in that bay before the accident?',
      'Who reviewed internal safety reports before the incident date?',
      'What is the standard supervisor-to-worker ratio during peak shifts?',
      'How often are loading bay safety audits scheduled?',
      'Were there any equipment maintenance issues reported that week?',
      'What PPE was required for that bay at the time of the incident?',
      'How long had the plaintiff been employed at the facility?',
      'Did weather or delivery volume affect operations that day?',
      'What corrective actions were required after each OSHA citation?',
      'Were any of those corrective actions still open on the accident date?',
      'Who received the high-risk memo and when?',
      'Why was the flagged loading bay kept in operation?',
      'Did any supervisor approve work outside the plaintiff\'s trained duties?',
      'Were incident near-misses logged for that bay in the prior quarter?',
      'What changes were made to that bay immediately after the injury?',
    ],
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getCaseById(id: CaseId): CaseFile {
  const c = CASES.find((c) => c.id === id)
  if (!c) throw new Error(`Case not found: ${id}`)
  return c
}

export function getArchetypeById(id: string): AIArchetype {
  const a = AI_ARCHETYPES.find((a) => a.id === id)
  if (!a) throw new Error(`Archetype not found: ${id}`)
  return a
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function pickRandomModelId(): string {
  return pickRandom(INTERNAL_MODEL_IDS)
}
