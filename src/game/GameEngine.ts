import { generateSession, isCorrectAnswer } from '../math/QuestionGenerator'
import type { Question, RandomSource } from '../math/types'
import { bossHpForProgress, TOTAL_QUESTIONS } from './BossSystem'
import { nextCombo, resetCombo } from './ComboSystem'

export type GameState = {
  status: 'menu' | 'playing' | 'victory'
  phase: 'dispensing' | 'answering' | 'correct'
  sessionId: number
  questionIndex: number
  totalQuestions: typeof TOTAL_QUESTIONS
  questions: Question[]
  currentQuestion: Question | null
  input: string
  combo: number
  maxCombo: number
  bossHp: number
  correctCount: number
  wrongCount: number
  firstTryCount: number
  wrongInQuestion: boolean
  feedback: 'none' | 'correct' | 'wrong'
  eventId: number
}

export function initialGameState(sessionId = 0): GameState {
  return {
    status: 'menu', phase: 'dispensing', sessionId,
    questionIndex: 0, totalQuestions: TOTAL_QUESTIONS, questions: [], currentQuestion: null,
    input: '', combo: 0, maxCombo: 0, bossHp: 100,
    correctCount: 0, wrongCount: 0, firstTryCount: 0, wrongInQuestion: false,
    feedback: 'none', eventId: 0,
  }
}

export function startGame(previous: GameState, rng?: RandomSource): GameState {
  const questions = generateSession(rng)
  return {
    ...initialGameState(previous.sessionId + 1),
    status: 'playing', questions, currentQuestion: questions[0],
  }
}

export function revealQuestion(state: GameState): GameState {
  return state.status === 'playing' && state.phase === 'dispensing'
    ? { ...state, phase: 'answering' } : state
}

const canAnswer = (state: GameState) => state.status === 'playing' && state.phase === 'answering'

export function enterDigit(state: GameState, digit: string): GameState {
  if (!canAnswer(state) || !/^\d$/.test(digit) || state.input.length >= 2) return state
  const input = state.input === '0' ? digit : state.input + digit
  return { ...state, input, feedback: 'none' }
}

export function eraseDigit(state: GameState): GameState {
  if (!canAnswer(state) || !state.input) return state
  return { ...state, input: state.input.slice(0, -1), feedback: 'none' }
}

export function submitAnswer(state: GameState): GameState {
  if (!canAnswer(state) || !state.currentQuestion || !state.input) return state
  if (!isCorrectAnswer(state.currentQuestion, state.input)) {
    return {
      ...state, input: '', combo: resetCombo(), wrongCount: state.wrongCount + 1,
      wrongInQuestion: true, feedback: 'wrong', eventId: state.eventId + 1,
    }
  }
  const questionIndex = state.questionIndex + 1
  return {
    ...state, phase: 'correct', questionIndex,
    ...nextCombo(state.combo, state.maxCombo),
    bossHp: bossHpForProgress(questionIndex), correctCount: state.correctCount + 1,
    firstTryCount: state.firstTryCount + (state.wrongInQuestion ? 0 : 1),
    feedback: 'correct', eventId: state.eventId + 1,
  }
}

export function advanceAfterCorrect(state: GameState): GameState {
  if (state.status !== 'playing' || state.phase !== 'correct') return state
  if (state.questionIndex === state.totalQuestions) {
    return { ...state, status: 'victory', input: '', currentQuestion: null }
  }
  return {
    ...state, phase: 'dispensing', currentQuestion: state.questions[state.questionIndex],
    input: '', wrongInQuestion: false, feedback: 'none',
  }
}

export function returnToMenu(state: GameState): GameState {
  return initialGameState(state.sessionId + 1)
}

export const accuracyForGame = (state: GameState) => Math.round(100 * state.firstTryCount / state.totalQuestions)
