# Cross-Examine

Cross-Examine is an interactive legal-interrogation research game.  
Players question an AI witness designed to withhold key facts by omission, then review analysis of what was surfaced vs. missed.

## Core Flow

1. Select a case.
2. Select AI personality mode (known or hidden).
3. Set difficulty (question limit).
4. Interrogate the witness.
5. Review results and full analysis.

## Tech Stack

- Next.js
- TypeScript
- React
- Local API routes (`app/api/*`)

## Local Development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` (or the port shown in your terminal).

## Local LM Endpoint

This project is configured to work with a local LM endpoint:

- `http://127.0.0.1:1234`

Make sure your local model server is running before starting gameplay that requires live model responses.

## Project Notes

- Archetype prompt logic: `lib/archetype-system-prompts.ts`
- Game state and screen flow: `lib/game-context.tsx`
- Case/question banks and scoring data: `lib/game-data.ts`
- Analysis logic: `app/api/analyze/route.ts`
