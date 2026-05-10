# Prompt System

This project uses one prompt registry file with multiple archetype-specific system prompts.

## Where the prompts are

- `lib/archetype-system-prompts.ts`
  - Contains one prompt entry per archetype:
    - `hero`
    - `trickster`
    - `ruler`
    - `caregiver`
    - `lover`
  - Each entry has its own `systemPrompt` string.

## How prompt selection works

- `app/api/party/route.ts`
  - Receives `archetypeId` from the client request.
  - Looks up the matching prompt from `OMISSION_ARCHETYPE_PROMPT_MAP`.
  - Injects that archetype prompt into the final witness system prompt.
  - Applies archetype-specific temperature values:
    - `hero: 0.45` (more controlled/decisive voice; reduces rambling and keeps assertive consistency)
    - `trickster: 0.72` (higher variability supports evasive pivots, ambiguity, and agile reframing)
    - `ruler: 0.35` (lowest variability to keep formal, procedural, institution-first discipline)
    - `caregiver: 0.52` (moderate variability allows warmth and nuance without losing coherence)
    - `lover: 0.62` (higher emotional expressiveness and relational framing benefit from more variation)

## Why this is one file

The prompts are kept in one registry file for easier maintenance and consistent typing.
They are still separate system prompts at runtime because selection is dynamic by `archetypeId`.

## References

Bechter, C., Farinelli, G., Daniel, R.-D., & Frey, M. (2016). Advertising between archetype and brand personality. *Administrative Sciences, 6*(2), Article 5. https://doi.org/10.3390/admsci6020005

Groenewald, A. E. (2021). *A value-based archetypal model: Uncovering patterns in human behaviour* (Doctoral dissertation, University of South Africa).

Knox, J. M. (2001). Memories, fantasies, archetypes: An exploration of some connections between cognitive science and analytical psychology. *Journal of Analytical Psychology, 46*(4), 613–635.

Kreicbergs, T., & Ščeulovs, D. (2022). The use of brand and masculinity archetypes in analysing consumer engagement in advertising. *Trendy Ekonomiky a Managementu / Trends Economics and Management, 40*(2), 21–38. https://doi.org/10.13164/trends.2022.40.21

Lessio, N., & Morris, A. (n.d.). *Toward design archetypes for conversational agent personality* [Conference manuscript].

Miller-Roach, K. (2014). *Exploring Jungian archetypes as potential predictors of infidelity* (Doctoral dissertation, The University of Mississippi).
