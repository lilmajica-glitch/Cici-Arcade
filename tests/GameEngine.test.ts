import { describe, expect, it } from 'vitest'
import {
  accuracyForGame, advanceAfterCorrect, enterDigit, eraseDigit, initialGameState,
  returnToMenu, revealQuestion, startGame, submitAnswer,
} from '../src/game/GameEngine'
import type { GameState } from '../src/game/GameEngine'
import { bossHpForProgress } from '../src/game/BossSystem'
import { comboIntensity, nextCombo, resetCombo } from '../src/game/ComboSystem'

const ready = () => revealQuestion(startGame(initialGameState(), () => 0.37))
const type = (state: GameState, value: string) => [...value].reduce(enterDigit, state)
const solve = (state: GameState) => submitAnswer(type(state, String(state.currentQuestion!.answer)))

describe('Boss HP', () => {
  it('follows question progress in exact five-HP steps', () => {
    for (let index = 0; index <= 20; index++) expect(bossHpForProgress(index)).toBe(100 - index * 5)
    expect(bossHpForProgress(-5)).toBe(100)
    expect(bossHpForProgress(100)).toBe(0)
  })
})

describe('Combo', () => {
  it('increments, remembers the peak and resets only the active chain', () => {
    expect(nextCombo(3, 9)).toEqual({ combo: 4, maxCombo: 9 })
    expect(nextCombo(9, 9)).toEqual({ combo: 10, maxCombo: 10 })
    expect(resetCombo()).toBe(0)
    expect(comboIntensity(1000)).toBe(1)
  })
})

describe('Game progression', () => {
  it('starts a fresh twenty-question session and waits for reveal', () => {
    const state = startGame(initialGameState())
    expect(state.status).toBe('playing')
    expect(state.phase).toBe('dispensing')
    expect(state.questions).toHaveLength(20)
    expect(state.currentQuestion).toBe(state.questions[0])
    expect(enterDigit(state, '1')).toBe(state)
  })

  it('ignores an empty answer without counting a mistake', () => {
    const state = ready()
    expect(submitAnswer(state)).toBe(state)
  })

  it('clears a wrong answer without advancing, hurting the boss or locking retry', () => {
    const state = solve(ready())
    const next = revealQuestion(advanceAfterCorrect(state))
    const wrong = submitAnswer(type(next, String((next.currentQuestion!.answer + 1) % 21)))
    expect(wrong.questionIndex).toBe(1)
    expect(wrong.currentQuestion).toBe(next.currentQuestion)
    expect(wrong.bossHp).toBe(95)
    expect(wrong.correctCount).toBe(1)
    expect(wrong.wrongCount).toBe(1)
    expect(wrong.input).toBe('')
    expect(wrong.combo).toBe(0)
    expect(wrong.maxCombo).toBe(1)
    expect(wrong.phase).toBe('answering')
    const retry = solve(wrong)
    expect(retry.questionIndex).toBe(2)
    expect(retry.firstTryCount).toBe(1)
    expect(retry.combo).toBe(1)
  })

  it('judges correctly and rejects double confirmation during the reward', () => {
    const state = solve(ready())
    expect(state.feedback).toBe('correct')
    expect(state.correctCount).toBe(1)
    expect(state.bossHp).toBe(95)
    expect(submitAnswer(state)).toBe(state)
    expect(advanceAfterCorrect(ready()).questionIndex).toBe(0)
  })

  it('requires all twenty correct answers and then enters victory', () => {
    let state = ready()
    for (let i = 0; i < 20; i++) {
      state = solve(state)
      expect(state.questionIndex).toBe(i + 1)
      expect(state.bossHp).toBe(100 - (i + 1) * 5)
      state = advanceAfterCorrect(state)
      expect(state.status).toBe(i === 19 ? 'victory' : 'playing')
      state = revealQuestion(state)
    }
    expect(state.correctCount).toBe(20)
    expect(state.combo).toBe(20)
    expect(state.bossHp).toBe(0)
    expect(state.currentQuestion).toBe(null)
    expect(accuracyForGame(state)).toBe(100)
    expect(submitAnswer(state)).toBe(state)
  })

  it('does not let a high combo skip questions or modify five-HP damage', () => {
    const state = solve({ ...ready(), combo: 100, maxCombo: 100 })
    expect(state.questionIndex).toBe(1)
    expect(state.bossHp).toBe(95)
    expect(state.status).toBe('playing')
  })

  it('handles zero, limits two digits, allows editing and rejects non-digits', () => {
    const state: GameState = { ...ready(), currentQuestion: { left: 6, right: 6, operator: '-', answer: 0 } }
    expect(solve(state).feedback).toBe('correct')
    expect(type(state, '012').input).toBe('12')
    expect(type(state, '123').input).toBe('12')
    expect(eraseDigit(type(state, '12')).input).toBe('1')
    expect(enterDigit(state, 'x')).toBe(state)
  })

  it('keeps first-try accuracy meaningful even when every problem is eventually solved', () => {
    let state = ready()
    const answer = state.currentQuestion!.answer
    state = submitAnswer(type(state, String((answer + 1) % 21)))
    state = submitAnswer(type(state, String((answer + 2) % 21)))
    for (let i = 0; i < 20; i++) state = revealQuestion(advanceAfterCorrect(solve(state)))
    expect(state.status).toBe('victory')
    expect(state.wrongCount).toBe(2)
    expect(state.firstTryCount).toBe(19)
    expect(accuracyForGame(state)).toBe(95)
  })

  it('resets the whole session on replay and invalidates previous session IDs', () => {
    const old = solve(ready())
    const fresh = startGame(old)
    expect(fresh.sessionId).toBe(old.sessionId + 1)
    expect(fresh.questionIndex).toBe(0)
    expect(fresh.combo).toBe(0)
    expect(fresh.wrongCount).toBe(0)
    expect(fresh.bossHp).toBe(100)
    expect(returnToMenu(fresh).status).toBe('menu')
  })
})
