'use client'

import React, { createContext, useContext, useReducer, useCallback } from 'react'
import type { GameState, CaseId, ChatMessage, AnalysisResult, Difficulty } from './game-data'

// Global game state store.
// Edit this file to add new screens, state fields, or transition behavior.

// ─── State ────────────────────────────────────────────────────────────────────

const initialState: GameState = {
  screen: 'landing',
  mode: null,
  difficulty: null,
  selectedCase: null,
  witnessAI: null,
  witnessArchetype: null,
  archetypeKnown: false,
  history: [],
  analysisResult: null,
}

// ─── Actions ─────────────────────────────────────────────────────────────────

type Action =
  | { type: 'GO_TO'; screen: GameState['screen'] }
  | { type: 'SET_MODE'; mode: GameState['mode'] }
  | { type: 'SET_DIFFICULTY'; difficulty: Difficulty }
  | { type: 'SELECT_CASE'; caseId: CaseId }
  | { type: 'ASSIGN_WITNESS'; modelId: string; archetypeId: string; archetypeKnown: boolean }
  | { type: 'ADD_MESSAGE'; message: ChatMessage }
  | { type: 'SET_ANALYSIS'; result: AnalysisResult }
  | { type: 'RESET' }

function reducer(state: GameState, action: Action): GameState {
  // All screen/state transitions are centralized here.
  switch (action.type) {
    case 'GO_TO':
      return { ...state, screen: action.screen }
    case 'SET_MODE':
      return { ...state, mode: action.mode }
    case 'SET_DIFFICULTY':
      return { ...state, difficulty: action.difficulty }
    case 'SELECT_CASE':
      return { ...state, selectedCase: action.caseId }
    case 'ASSIGN_WITNESS':
      return {
        ...state,
        witnessAI: action.modelId,
        witnessArchetype: action.archetypeId,
        archetypeKnown: action.archetypeKnown,
      }
    case 'ADD_MESSAGE':
      return { ...state, history: [...state.history, action.message] }
    case 'SET_ANALYSIS':
      return { ...state, analysisResult: action.result }
    case 'RESET':
      return { ...initialState }
    default:
      return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface GameContextValue {
  state: GameState
  goTo: (screen: GameState['screen']) => void
  setMode: (mode: GameState['mode']) => void
  setDifficulty: (difficulty: Difficulty) => void
  selectCase: (caseId: CaseId) => void
  assignWitness: (modelId: string, archetypeId: string, archetypeKnown: boolean) => void
  addMessage: (message: ChatMessage) => void
  setAnalysis: (result: AnalysisResult) => void
  reset: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Stable action helpers consumed by screen components.

  const goTo = useCallback((screen: GameState['screen']) => dispatch({ type: 'GO_TO', screen }), [])
  const setMode = useCallback((mode: GameState['mode']) => dispatch({ type: 'SET_MODE', mode }), [])
  const setDifficulty = useCallback((difficulty: Difficulty) => dispatch({ type: 'SET_DIFFICULTY', difficulty }), [])
  const selectCase = useCallback((caseId: CaseId) => dispatch({ type: 'SELECT_CASE', caseId }), [])
  const assignWitness = useCallback(
    (modelId: string, archetypeId: string, archetypeKnown: boolean) =>
      dispatch({ type: 'ASSIGN_WITNESS', modelId, archetypeId, archetypeKnown }),
    [],
  )
  const addMessage = useCallback(
    (message: ChatMessage) => dispatch({ type: 'ADD_MESSAGE', message }),
    [],
  )
  const setAnalysis = useCallback(
    (result: AnalysisResult) => dispatch({ type: 'SET_ANALYSIS', result }),
    [],
  )
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  return (
    <GameContext.Provider
      value={{ state, goTo, setMode, setDifficulty, selectCase, assignWitness, addMessage, setAnalysis, reset }}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside GameProvider')
  return ctx
}
