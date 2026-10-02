import { describe, expect, it } from 'vitest'
import { generateQuestion, generateSession, isCorrectAnswer, questionSignature } from '../src/math/QuestionGenerator'
import type { Question } from '../src/math/types'

function seededRandom(seed: number) {
  let state = seed
  return () => {
    state = (1664525 * state + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

describe('QuestionGenerator', () => {
  it('produces integer operands and correct answers between zero and twenty', () => {
    const rng = seededRandom(17)
    let previous: Question | null = null
    for (let i = 0; i < 10_000; i++) {
      const q = generateQuestion({ rng, previous })
      for (const n of [q.left, q.right, q.answer]) {
        expect(Number.isInteger(n)).toBe(true)
        expect(n).toBeGreaterThanOrEqual(0)
        expect(n).toBeLessThanOrEqual(20)
      }
      expect(q.answer).toBe(q.operator === '+' ? q.left + q.right : q.left - q.right)
      if (previous) expect(questionSignature(q)).not.toBe(questionSignature(previous))
      previous = q
    }
  })

  it('never generates a negative subtraction, across many seeds', () => {
    for (let seed = 0; seed < 80; seed++) {
      const rng = seededRandom(seed)
      for (let i = 0; i < 100; i++) {
        const q = generateQuestion({ operator: '-', rng })
        expect(q.left).toBeGreaterThanOrEqual(q.right)
        expect(q.answer).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('can reach zero and twenty; repeated constant randomness still cannot repeat', () => {
    const zero = generateQuestion({ operator: '+', rng: () => 0 })
    const upper = generateQuestion({ operator: '+', rng: () => 0.999999 })
    expect(zero.answer).toBe(0)
    expect(upper.answer).toBe(20)
    const next = generateQuestion({ operator: '+', rng: () => 0, previous: zero })
    expect(questionSignature(next)).not.toBe(questionSignature(zero))
  })

  it('makes a balanced twenty-question session with four warmups', () => {
    for (let seed = 1; seed < 40; seed++) {
      const questions = generateSession(seededRandom(seed))
      expect(questions).toHaveLength(20)
      expect(questions.filter((q) => q.operator === '+')).toHaveLength(10)
      expect(questions.filter((q) => q.operator === '-')).toHaveLength(10)
      for (const q of questions.slice(0, 4)) expect(Math.max(q.left, q.right, q.answer)).toBeLessThanOrEqual(10)
      questions.slice(1).forEach((q, i) => expect(questionSignature(q)).not.toBe(questionSignature(questions[i])))
    }
  })

  it('judges the whole submitted answer, including zero, and rejects empty/invalid input', () => {
    const q: Question = { left: 17, right: 8, operator: '-', answer: 9 }
    expect(isCorrectAnswer(q, '9')).toBe(true)
    expect(isCorrectAnswer(q, '09')).toBe(true)
    for (const input of ['', '8', ' ', '-9', '9.0', '9x', '009']) expect(isCorrectAnswer(q, input)).toBe(false)
    expect(isCorrectAnswer({ left: 8, right: 8, operator: '-', answer: 0 }, '0')).toBe(true)
  })

  it('rejects a malformed injected random source', () => {
    for (const value of [-1, 1, NaN, Infinity]) expect(() => generateQuestion({ rng: () => value })).toThrow(RangeError)
  })
})
