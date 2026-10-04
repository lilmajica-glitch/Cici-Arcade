import { gameActions, gameStore } from './gameStore'
import { preferencesStore } from './preferencesStore'
import { readStats, recordVictory, writeStats } from '../utils/persistence'
import { audioEngine } from '../audio/AudioEngine'
import { pickMusicTrack } from '../audio/tracks'

export const TIMINGS = { reveal: 240, correct: 420, reducedReveal: 70, reducedCorrect: 220 }
export const FESTIVAL_TIMINGS = { correct: 1300, reducedCorrect: 360 }
export type InputAction = string | 'erase' | 'submit'
export type FeedbackEvent = { type: 'correct' | 'wrong' | 'victory'; combo: number }

/** Bridges discrete game actions to finite presentation timelines. */
export class GameController {
  private timers = new Set<ReturnType<typeof setTimeout>>()
  private listeners = new Set<(event: FeedbackEvent) => void>()
  private savedSession = -1

  start() {
    this.clearTimers()
    const audioReady = audioEngine.initialize()
    gameActions.start()
    const sessionId = gameStore.getState().sessionId
    const track = pickMusicTrack()
    void audioReady.then((ready) => {
      const current = gameStore.getState()
      if (current.sessionId !== sessionId) return
      preferencesStore.setState({ audioStatus: ready ? 'ready' : 'unavailable' })
      if (ready && current.status === 'playing') {
        audioEngine.start(track)
        audioEngine.progress(current.questionIndex, current.totalQuestions)
      }
    })
    this.scheduleReveal()
  }

  input(action: InputAction) {
    const current = gameStore.getState()
    if (action === 'erase') { if (gameActions.erase() !== current) audioEngine.erase(); return }
    if (action !== 'submit') { if (gameActions.digit(action) !== current) audioEngine.number(action); return }
    const before = gameStore.getState()
    const after = gameActions.submit()
    if (before === after) return
    if (after.feedback === 'correct') { audioEngine.correct(after.combo); audioEngine.progress(after.questionIndex, after.totalQuestions) }
    else audioEngine.wrong()
    this.emit({ type: after.feedback === 'correct' ? 'correct' : 'wrong', combo: after.combo })
    if (after.feedback !== 'correct') return
    const reduced = preferencesStore.getState().reducedMotion
    this.schedule(() => {
      const next = gameActions.advance()
      if (next.status === 'victory') {
        if (this.savedSession !== next.sessionId) {
          writeStats(recordVictory(next, readStats()))
          this.savedSession = next.sessionId
        }
        this.emit({ type: 'victory', combo: next.combo })
        audioEngine.victory()
      } else this.scheduleReveal()
    }, reduced ? TIMINGS.reducedCorrect : TIMINGS.correct)
  }

  feed(digit: string) {
    const before = gameStore.getState()
    const after = gameActions.feed(digit)
    if (before === after) return
    audioEngine.number(digit)
    if (after.feedback === 'wrong') {
      audioEngine.wrong()
      this.emit({ type: 'wrong', combo: after.combo })
      return
    }
    if (after.phase !== 'correct') return
    audioEngine.correct(after.combo)
    audioEngine.progress(after.questionIndex, after.totalQuestions)
    this.emit({ type: 'correct', combo: after.combo })
    this.schedule(() => {
      const next = gameActions.advance()
      if (next.status === 'victory') {
        if (this.savedSession !== next.sessionId) {
          writeStats(recordVictory(next, readStats()))
          this.savedSession = next.sessionId
        }
        this.emit({ type: 'victory', combo: next.combo })
        audioEngine.victory()
      } else this.scheduleReveal()
    }, preferencesStore.getState().reducedMotion
      ? FESTIVAL_TIMINGS.reducedCorrect : FESTIVAL_TIMINGS.correct)
  }

  menu() {
    this.clearTimers()
    audioEngine.stop()
    gameActions.menu()
  }

  onFeedback(listener: (event: FeedbackEvent) => void) {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  dispose() { this.clearTimers(); audioEngine.stop() }

  private emit(event: FeedbackEvent) { this.listeners.forEach((listener) => listener(event)) }

  private scheduleReveal() {
    audioEngine.dispense()
    this.schedule(gameActions.reveal, preferencesStore.getState().reducedMotion ? TIMINGS.reducedReveal : TIMINGS.reveal)
  }

  private schedule(callback: () => void, delay: number) {
    const sessionId = gameStore.getState().sessionId
    const timer = setTimeout(() => {
      this.timers.delete(timer)
      if (gameStore.getState().sessionId === sessionId) callback()
    }, delay)
    this.timers.add(timer)
  }

  private clearTimers() {
    this.timers.forEach(clearTimeout)
    this.timers.clear()
  }
}

export const gameController = new GameController()
if (import.meta.hot) import.meta.hot.dispose(() => gameController.dispose())
