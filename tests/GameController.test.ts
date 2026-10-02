import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GameController, TIMINGS } from '../src/game/GameController'
import { gameStore } from '../src/game/gameStore'
import { initialGameState } from '../src/game/GameEngine'
import { preferencesStore } from '../src/game/preferencesStore'
import { readStats } from '../src/utils/persistence'
import { audioEngine } from '../src/audio/AudioEngine'

vi.mock('../src/audio/AudioEngine', () => ({ audioEngine: {
  initialize: vi.fn(async () => true), start: vi.fn(), stop: vi.fn(), progress: vi.fn(),
  number: vi.fn(), erase: vi.fn(), correct: vi.fn(), wrong: vi.fn(), dispense: vi.fn(), victory: vi.fn(),
} }))

let controller: GameController
let data: Map<string, string>
beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  data = new Map()
  vi.stubGlobal('localStorage', { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) })
  gameStore.setState(initialGameState(), true)
  preferencesStore.setState({ muted: false, musicVolume: 0.75, reducedMotion: false, audioStatus: 'idle' })
  controller = new GameController()
})
afterEach(() => { controller.dispose(); vi.useRealTimers(); vi.unstubAllGlobals() })

const answer = () => {
  for (const digit of String(gameStore.getState().currentQuestion!.answer)) controller.input(digit)
  controller.input('submit')
}

describe('presentation controller', () => {
  it('accepts input before the 620ms tongue finishes and locks double confirmations', () => {
    controller.start()
    vi.advanceTimersByTime(TIMINGS.reveal)
    expect(gameStore.getState().phase).toBe('answering')
    answer()
    controller.input('submit')
    expect(gameStore.getState().questionIndex).toBe(1)
    vi.advanceTimersByTime(TIMINGS.correct + TIMINGS.reveal)
    expect(gameStore.getState().phase).toBe('answering')
    expect(gameStore.getState().questionIndex).toBe(1)
  })

  it('emits immediate sound and allows immediate retry after a mistake', () => {
    controller.start()
    vi.advanceTimersByTime(TIMINGS.reveal)
    const wrong = (gameStore.getState().currentQuestion!.answer + 1) % 21
    for (const digit of String(wrong)) controller.input(digit)
    controller.input('submit')
    expect(audioEngine.number).toHaveBeenCalled()
    expect(audioEngine.wrong).toHaveBeenCalledOnce()
    expect(gameStore.getState().phase).toBe('answering')
    expect(gameStore.getState().questionIndex).toBe(0)
    answer()
    expect(audioEngine.correct).toHaveBeenCalledOnce()
  })

  it('cancels callbacks from a previous session when replaying or returning to menu', () => {
    controller.start()
    vi.advanceTimersByTime(TIMINGS.reveal)
    answer()
    controller.start()
    vi.advanceTimersByTime(1000)
    expect(gameStore.getState().questionIndex).toBe(0)
    expect(gameStore.getState().phase).toBe('answering')
    answer()
    controller.menu()
    vi.advanceTimersByTime(1000)
    expect(gameStore.getState().status).toBe('menu')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('completes twenty questions and persists only one victory record', () => {
    controller.start()
    vi.advanceTimersByTime(TIMINGS.reveal)
    for (let i = 0; i < 20; i++) {
      answer()
      vi.advanceTimersByTime(TIMINGS.correct + TIMINGS.reveal)
    }
    expect(gameStore.getState().status).toBe('victory')
    expect(readStats()).toEqual({ bestAccuracy: 100, bestCombo: 20, gamesPlayed: 1 })
    for (let i = 0; i < 4; i++) controller.input('submit')
    vi.advanceTimersByTime(5000)
    expect(readStats().gamesPlayed).toBe(1)
    expect(audioEngine.victory).toHaveBeenCalledOnce()
  })

  it('uses reduced-motion timings without changing rules', () => {
    preferencesStore.setState({ reducedMotion: true })
    controller.start()
    vi.advanceTimersByTime(TIMINGS.reducedReveal)
    answer()
    vi.advanceTimersByTime(TIMINGS.reducedCorrect + TIMINGS.reducedReveal)
    expect(gameStore.getState().questionIndex).toBe(1)
    expect(gameStore.getState().bossHp).toBe(95)
    expect(gameStore.getState().phase).toBe('answering')
  })

  it('restores the current musical progress if audio initializes after an answer', async () => {
    let ready!: (value: boolean) => void
    vi.mocked(audioEngine.initialize).mockImplementationOnce(() => new Promise((resolve) => { ready = resolve }))
    controller.start()
    vi.advanceTimersByTime(TIMINGS.reveal)
    answer()
    ready(true)
    await Promise.resolve()
    expect(audioEngine.start).toHaveBeenCalledOnce()
    expect(audioEngine.progress).toHaveBeenLastCalledWith(1, 20)
  })

  it('ignores a late audio initialization from a cancelled session', async () => {
    let ready!: (value: boolean) => void
    vi.mocked(audioEngine.initialize).mockImplementationOnce(() => new Promise((resolve) => { ready = resolve }))
    controller.start()
    controller.menu()
    ready(true)
    await Promise.resolve()
    expect(audioEngine.start).not.toHaveBeenCalled()
    expect(preferencesStore.getState().audioStatus).toBe('idle')
  })
})
