import { afterEach, expect, it, vi } from 'vitest'
import { connectMathToArcade } from '../src/game/arcadeBridge'
import { gameActions, gameStore } from '../src/game/gameStore'
import { initialGameState } from '../src/game/GameEngine'
import { VocabularySystem } from '../neon-word-runner/src/game/systems/VocabularySystem'

afterEach(() => { vi.unstubAllGlobals(); gameStore.setState(initialGameState(), true) })

it('reports real math mistakes, first-try accuracy, score, duration, and a fresh replay', () => {
  const send = vi.fn()
  vi.stubGlobal('window', { parent: { postMessage: send }, location: { origin: 'http://localhost:5173' }, addEventListener: vi.fn(), removeEventListener: vi.fn() })
  const disconnect = connectMathToArcade()
  try {
    gameActions.start(); gameActions.reveal()
    const first = gameStore.getState().currentQuestion!
    gameActions.feed(String((Number(String(first.answer)[0]) + 1) % 10))
    for (let index = 0; index < 20; index++) {
      const question = gameStore.getState().currentQuestion!
      for (const digit of String(question.answer)) gameActions.feed(digit)
      gameActions.advance(); gameActions.reveal()
    }
    const end = send.mock.calls.find(([message]) => message.type === 'ciciarcade:end')![0]
    expect(end.session).toMatchObject({ gameId: 'math', score: 1900, accuracy: 95, answeredCount: 20,
      wrongAnswers: [{ question: `${first.left} ${first.operator} ${first.right}`, correctAnswer: String(first.answer) }] })
    expect(end.session.durationSeconds).toBeGreaterThanOrEqual(0)
    expect(send).toHaveBeenCalledWith(expect.any(Object), 'http://localhost:5173')
    gameActions.start(); gameActions.reveal()
    for (let index = 0; index < 20; index++) {
      for (const digit of String(gameStore.getState().currentQuestion!.answer)) gameActions.feed(digit)
      gameActions.advance(); gameActions.reveal()
    }
    const second = send.mock.calls.filter(([message]) => message.type === 'ciciarcade:end')[1][0]
    expect(second.session).toMatchObject({ score: 2000, accuracy: 100, wrongAnswers: [] })
    expect(second.session.sessionId).not.toBe(end.session.sessionId)
  } finally { disconnect() }
})

it('records both incorrect choices and timeouts from existing vocabulary judging', () => {
  const entries = ['cat', 'dog', 'bird'].map((english, index) => ({ id: english, english, chinese: ['猫', '狗', '鸟'][index], pronunciation: '', difficulty: 1 as const }))
  const vocabulary = new VocabularySystem(entries, 'zh-en', ['JUMP', 'SLIDE', 'VAULT'], () => .5)
  const first = vocabulary.presentNext()!
  vocabulary.submit(first.id, (first.correctIndex + 1) % 3)
  const second = vocabulary.presentNext()!
  vocabulary.timeout(second.id)
  const third = vocabulary.presentNext()!
  vocabulary.submit(third.id, third.correctIndex)
  expect(vocabulary.stats).toMatchObject({ correct: 1, wrong: 2, accuracy: 33 })
  expect(vocabulary.wrongAnswers).toEqual([
    { question: first.prompt, userAnswer: first.choices[(first.correctIndex + 1) % 3], correctAnswer: first.choices[first.correctIndex], knowledgePoint: `${first.english} 的词义与识别` },
    { question: second.prompt, userAnswer: '未作答（超时）', correctAnswer: second.choices[second.correctIndex], knowledgePoint: `${second.english} 的词义与识别` },
  ])
})
