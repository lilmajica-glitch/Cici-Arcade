import type { Operator, Question, RandomSource } from './types'

type Options = {
  previous?: Question | null
  operator?: Operator
  max?: 10 | 20
  rng?: RandomSource
}

export const questionSignature = (q: Question) => `${q.left}${q.operator}${q.right}`

function createPool(max: number, operator: Operator): Question[] {
  const pool: Question[] = []
  for (let left = 0; left <= max; left++) {
    for (let right = 0; right <= max; right++) {
      const answer = operator === '+' ? left + right : left - right
      if (answer >= 0 && answer <= max) pool.push({ left, right, operator, answer })
    }
  }
  return pool
}

const pools = {
  10: { '+': createPool(10, '+'), '-': createPool(10, '-') },
  20: { '+': createPool(20, '+'), '-': createPool(20, '-') },
}

function randomIndex(length: number, rng: RandomSource) {
  const value = rng()
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError('Random source must return a number in [0, 1).')
  }
  return Math.floor(value * length)
}

/** Pick directly from legal candidates; no retry loop can stall a session. */
export function generateQuestion({ previous, operator, max = 20, rng = Math.random }: Options = {}): Question {
  const op = operator ?? (randomIndex(2, rng) === 0 ? '+' : '-')
  const previousKey = previous ? questionSignature(previous) : null
  const candidates = pools[max][op].filter((q) => questionSignature(q) !== previousKey)
  return { ...candidates[randomIndex(candidates.length, rng)] }
}

function shuffle<T>(items: T[], rng: RandomSource): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1, rng)
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

/** Fixed MVP: twenty questions, ten of each operation, four gentle warmups. */
export function generateSession(rng: RandomSource = Math.random): Question[] {
  const warmup = shuffle<Operator>(['+', '-', '+', '-'], rng)
  const rest = shuffle<Operator>([
    ...Array<Operator>(8).fill('+'), ...Array<Operator>(8).fill('-'),
  ], rng)
  const questions: Question[] = []
  for (const [index, operator] of [...warmup, ...rest].entries()) {
    questions.push(generateQuestion({ operator, max: index < 4 ? 10 : 20, previous: questions.at(-1), rng }))
  }
  return questions
}

export function isCorrectAnswer(question: Question, input: string): boolean {
  return /^\d{1,2}$/.test(input) && Number(input) === question.answer
}
