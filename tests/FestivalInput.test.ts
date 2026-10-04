import { describe, expect, it } from 'vitest'
import {
  advanceAfterCorrect, eraseDigit, feedDigit, initialGameState,
  revealQuestion, startGame, toggleHint,
} from '../src/game/GameEngine'
import type { GameState } from '../src/game/GameEngine'

const fifteen = (): GameState => ({
  ...revealQuestion(startGame(initialGameState())),
  currentQuestion: { left: 8, right: 7, operator: '+', answer: 15 },
})

describe('feeding the tongue machine', () => {
  it('accepts the tens digit without advancing, then automatically completes on the units digit', () => {
    const tens = feedDigit(fifteen(), '1')
    expect(tens.input).toBe('1')
    expect(tens.phase).toBe('answering')
    expect(tens.bossHp).toBe(100)
    const completed = feedDigit(tens, '5')
    expect(completed.input).toBe('15')
    expect(completed.phase).toBe('correct')
    expect(completed.questionIndex).toBe(1)
    expect(completed.bossHp).toBe(95)
    expect(feedDigit(completed, '5')).toBe(completed)
  })

  it('preserves the correct prefix after a wrong digit and permits immediate retry', () => {
    const wrong = feedDigit(feedDigit(fifteen(), '1'), '6')
    expect(wrong.input).toBe('1')
    expect(wrong.feedback).toBe('wrong')
    expect(wrong.phase).toBe('answering')
    expect(wrong.wrongCount).toBe(1)
    expect(wrong.questionIndex).toBe(0)
    const retry = feedDigit(wrong, '5')
    expect(retry.phase).toBe('correct')
    expect(retry.firstTryCount).toBe(0)
    expect(retry.combo).toBe(1)
  })

  it('handles zero as a complete answer and rejects a leading zero for fifteen', () => {
    const zero = { ...fifteen(), currentQuestion: { left: 6, right: 6, operator: '-' as const, answer: 0 } }
    expect(feedDigit(zero, '0').phase).toBe('correct')
    expect(feedDigit(fifteen(), '0').input).toBe('')
    expect(feedDigit(fifteen(), 'x').wrongCount).toBe(0)
  })

  it('allows deletion and hints without treating them as errors, and clears them on a new question', () => {
    const hinted = toggleHint(feedDigit(fifteen(), '1'))
    expect(hinted.hintVisible).toBe(true)
    expect(eraseDigit(hinted).input).toBe('')
    expect(eraseDigit(hinted).wrongCount).toBe(0)
    const next = revealQuestion(advanceAfterCorrect(feedDigit(hinted, '5')))
    expect(next.input).toBe('')
    expect(next.hintVisible).toBe(false)
    expect(next.digitResult).toBe('none')
  })

  it('finishes a full twenty-question run using digit feeds alone', () => {
    let state = revealQuestion(startGame(initialGameState(), () => 0.37))
    for (let i = 0; i < 20; i++) {
      for (const digit of String(state.currentQuestion!.answer)) state = feedDigit(state, digit)
      expect(state.bossHp).toBe(100 - (i + 1) * 5)
      state = revealQuestion(advanceAfterCorrect(state))
    }
    expect(state.status).toBe('victory')
    expect(state.correctCount).toBe(20)
    expect(state.maxCombo).toBe(20)
  })
})
