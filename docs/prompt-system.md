# Prompt System

This project uses a central archetype prompt registry and applies one archetype-specific prompt at runtime per witness.

## Prompt Registry

- File: `lib/archetype-system-prompts.ts`
- Runtime archetype IDs:
  - `hero`
  - `Jester`
  - `ruler`
  - `caregiver`
  - `lover`
- Each archetype has:
  - `label`
  - `relatedArchetypes`
  - `whyItOmits`
  - `notesBasis`
  - `systemPrompt`

## Runtime Prompt Selection

- File: `app/api/party/route.ts`
- Flow:
  1. Receives `archetypeId` from the client request.
  2. Looks up the prompt from `OMISSION_ARCHETYPE_PROMPT_MAP`.
  3. Injects that archetype block into the witness system prompt.
  4. Applies archetype-specific temperature.

Current temperatures:
- `hero`: `0.45` (more controlled/decisive voice; reduces rambling and keeps assertive consistency)
- `Jester`: `0.72` (higher variability supports evasive pivots, ambiguity, and agile reframing)
- `ruler`: `0.35` (lowest variability to keep formal, procedural, institution-first discipline)
- `caregiver`: `0.52` (moderate variability allows warmth and nuance without losing coherence)
- `lover`: `0.62` (higher emotional expressiveness and relational framing benefit from more variation)

## Analysis Trace Behavior

- File: `app/api/analyze/route.ts`
- The analysis endpoint generates a structured trace (`aiDecisionTraceJSON`) from observable question/answer signals.
- It now includes `directQuestionPressure` (`low` / `medium` / `high`) based on:
  - overlap with case omission keywords,
  - sensitive-domain probes,
  - and question type.
- It does not return hidden chain-of-thought. The trace is a compact, observable reasoning summary for research transparency.

## Why a Single Registry File

Prompts are stored in one typed registry for maintainability and consistency, but they are still distinct system prompts at runtime because selection is dynamic by `archetypeId`.

## References (Working List)

- Bechter, C., Farinelli, G., Daniel, R.-D., & Frey, M. (2016). Advertising between archetype and brand personality. *Administrative Sciences, 6*(2), Article 5. https://doi.org/10.3390/admsci6020005
- Groenewald, A. E. (2021). *A value-based archetypal model: Uncovering patterns in human behaviour* (Doctoral dissertation, University of South Africa).
- Knox, J. M. (2001). Memories, fantasies, archetypes: An exploration of some connections between cognitive science and analytical psychology. *Journal of Analytical Psychology, 46*(4), 613-635.
- Kreicbergs, T., & Šceulovs, D. (2022). The use of brand and masculinity archetypes in analysing consumer engagement in advertising. *Trendy Ekonomiky a Managementu / Trends Economics and Management, 40*(2), 21-38. https://doi.org/10.13164/trends.2022.40.21
- Lessio, N., & Morris, A. (n.d.). *Toward design archetypes for conversational agent personality* [Conference manuscript].
- Miller-Roach, K. (2014). *Exploring Jungian archetypes as potential predictors of infidelity* (Doctoral dissertation, The University of Mississippi).