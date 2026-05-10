# Code Map

Use this as a quick guide for where to edit what.

## Core Game Flow

- `app/page.tsx`
  - Screen router (`landing` -> `case-selection` -> `bench` -> `summary` -> `analysis`).
- `lib/game-context.tsx`
  - Global game state, actions, and transitions.
- `lib/game-data.ts`
  - Cases, archetypes metadata, difficulty settings, suggested questions.

## Personality + Prompting

- `lib/archetype-system-prompts.ts`
  - Archetype-specific prompt blocks (Hero/Jester/Ruler/Caregiver/Lover).
- `app/api/party/route.ts`
  - Witness generation endpoint; builds final system prompt and streams replies.

## Scoring + Analysis

- `app/api/analyze/route.ts`
  - Transcript scoring logic and analysis payload.
- `components/screens/RulingScreen.tsx`
  - Results summary UI.
- `components/screens/AnalysisScreen.tsx`
  - Full analysis + raw JSON UI.

## Main Screens

- `components/screens/LandingScreen.tsx`
  - Intro page and step preview.
- `components/screens/CaseSelectionScreen.tsx`
  - Case/mode/difficulty setup flow.
- `components/screens/BenchScreen.tsx`
  - Live interrogation UI.

## Styling

- `app/globals.css`
  - Theme tokens + global utility classes.

## Notes on `components/ui/*`

Most files in `components/ui/*` are reusable UI primitives (buttons, dialogs, etc.).
They are not game logic, and usually do not need edits unless you want to redesign shared component behavior.
