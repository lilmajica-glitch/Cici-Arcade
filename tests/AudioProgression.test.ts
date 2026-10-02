import { afterEach, describe, expect, it, vi } from 'vitest'
import { musicProgression } from '../src/audio/progression'
import { NUMBER_NOTES } from '../src/audio/SFX'
import { Sequencer } from '../src/audio/Sequencer'
import { FOCUS_SCORE } from '../src/audio/score'

afterEach(() => vi.useRealTimers())

describe('Progressive music', () => {
  it('adds each stage monotonically and reaches all layers at low HP', () => {
    const boundaries = [0, 4, 8, 12, 15, 17]
    boundaries.forEach((index, i) => {
      const stage = musicProgression(index)
      expect(stage.stage).toBe(i + 1)
      if (i > 0) for (const layer of musicProgression(boundaries[i - 1]).layers) expect(stage.layers).toContain(layer)
    })
    expect(musicProgression(0).layers).toEqual(['kick', 'hat', 'bass', 'chord'])
    expect(musicProgression(17).layers).toContain('lead')
    expect(musicProgression(19).finalQuestion).toBe(true)
    expect(musicProgression(18).finalQuestion).toBe(false)
  })
  it('keeps a stable tempo for the whole session, including the final question', () => {
    for (let index = -1; index <= 30; index++) expect(musicProgression(index).bpm).toBe(FOCUS_SCORE.bpm)
    expect(musicProgression(0, 0).progress).toBe(0)
    expect(musicProgression(NaN).progress).toBe(0)
  })
  it('maps ten digit pads to the required five-note scale', () => {
    expect(NUMBER_NOTES).toEqual({ '1': 60, '2': 62, '3': 64, '4': 67, '5': 69, '6': 72, '7': 74, '8': 76, '9': 79, '0': 81 })
    expect(new Set(Object.values(NUMBER_NOTES).map((midi) => midi % 12))).toEqual(new Set([0, 2, 4, 7, 9]))
  })
})

describe('Sequencer', () => {
  it('schedules ahead, smooths tempo, and stops its interval', () => {
    vi.useFakeTimers()
    const clock = { currentTime: 0, state: 'running' }
    const notes: number[] = []
    const sequence = new Sequencer(clock, (_, time) => notes.push(time))
    sequence.start()
    expect(notes[0]).toBeCloseTo(0.04)
    sequence.setTargetBpm(116)
    clock.currentTime = 0.025
    sequence.tick()
    expect(sequence.bpm).toBeGreaterThan(108)
    expect(sequence.bpm).toBeLessThan(109)
    for (let i = 1; i <= 200; i++) { clock.currentTime += 0.025; sequence.tick() }
    expect(sequence.bpm).toBeGreaterThan(115)
    expect(notes.every((t, i) => i === 0 || t > notes[i - 1])).toBe(true)
    sequence.stop()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('does not burst stale notes after a long background stall', () => {
    vi.useFakeTimers()
    const clock = { currentTime: 0, state: 'running' }
    const play = vi.fn()
    const sequence = new Sequencer(clock, play)
    sequence.start()
    play.mockClear()
    clock.currentTime = 25
    sequence.tick()
    expect(play.mock.calls.length).toBeLessThanOrEqual(2)
    expect(play.mock.calls[0][1]).toBeGreaterThanOrEqual(25)
    sequence.stop()
  })
  it('stays quiet while the audio clock is suspended', () => {
    vi.useFakeTimers()
    const clock = { currentTime: 0, state: 'suspended' }
    const play = vi.fn()
    const sequence = new Sequencer(clock, play)
    sequence.start()
    sequence.tick()
    expect(play).not.toHaveBeenCalled()
    sequence.stop()
  })
})
