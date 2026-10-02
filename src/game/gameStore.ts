import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import {
  advanceAfterCorrect, enterDigit, eraseDigit, initialGameState,
  returnToMenu, revealQuestion, startGame, submitAnswer,
} from './GameEngine'
import type { GameState } from './GameEngine'

export const gameStore = createStore<GameState>()(() => initialGameState())
export const useGameStore = <T,>(selector: (state: GameState) => T): T => useStore(gameStore, selector)

function apply(reducer: (state: GameState) => GameState) {
  const previous = gameStore.getState()
  const next = reducer(previous)
  if (next !== previous) gameStore.setState(next, true)
  return next
}

export const gameActions = {
  start: () => apply(startGame),
  reveal: () => apply(revealQuestion),
  digit: (digit: string) => apply((state) => enterDigit(state, digit)),
  erase: () => apply(eraseDigit),
  submit: () => apply(submitAnswer),
  advance: () => apply(advanceAfterCorrect),
  menu: () => apply(returnToMenu),
}
