'use client'

// App entry point:
// - Wraps the game in GameProvider (global state)
// - Routes between screens using state.screen
import { GameProvider, useGame } from '@/lib/game-context'
import LandingScreen from '@/components/screens/LandingScreen'
import CaseSelectionScreen from '@/components/screens/CaseSelectionScreen'
import BenchScreen from '@/components/screens/BenchScreen'
import SummaryScreen from '@/components/screens/RulingScreen'
import AnalysisScreen from '@/components/screens/AnalysisScreen'

function AppRouter() {
  const { state } = useGame()

  // Screen routing is controlled in lib/game-context.tsx.
  switch (state.screen) {
    case 'landing':
      return <LandingScreen />
    case 'case-selection':
      return <CaseSelectionScreen />
    case 'bench':
      return <BenchScreen />
    case 'summary':
      return <SummaryScreen />
    case 'analysis':
      return <AnalysisScreen />
    default:
      return <LandingScreen />
  }
}

export default function Home() {
  return (
    <GameProvider>
      <AppRouter />
    </GameProvider>
  )
}
