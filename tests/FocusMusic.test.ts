import { afterEach, describe, expect, it, vi } from 'vitest'
import { arrangeStep } from '../src/audio/arrangement'
import { encodeWav } from '../src/audio/preview'
import { MusicEngine } from '../src/audio/MusicEngine'
import type { Mixer } from '../src/audio/Mixer'
import { FOCUS_SCORE } from '../src/audio/score'
import { seededNoise } from '../src/audio/Synth'
import type { Synth } from '../src/audio/Synth'

afterEach(() => vi.useRealTimers())

describe('Focus groove musical constraints', () => {
  const score = (stage: number) => Array.from({ length: FOCUS_SCORE.bars * 16 }, (_, step) => arrangeStep(step, step * 60 / 108 / 4, 108, stage)).flat()

  it('starts with a full groove and keeps melody sparse, in a moderate register', () => {
    const opening = score(1)
    for (const voice of ['kick', 'hat', 'bass', 'keys']) expect(opening.some((event) => event.voice === voice)).toBe(true)
    const melody = score(6).filter((event) => event.voice === 'motif')
    expect(melody.length).toBeLessThanOrEqual(20)
    expect(melody.every((event) => event.notes.every((note) => note >= 60 && note <= 72))).toBe(true)
    expect(score(5).some((event) => event.voice === 'motif')).toBe(false)
  })

  it('has syncopation and slight swing without moving the main beat', () => {
    const beat = 60 / 108 / 4
    const bar = Array.from({ length: 16 }, (_, step) => arrangeStep(step, step * beat, 108, 6)).flat()
    const kicks = bar.filter((event) => event.voice === 'kick')
    expect(kicks.some((event) => Math.round(event.time / beat) % 4 !== 0)).toBe(true)
    expect(kicks[0].time).toBe(0)
    const offbeat = arrangeStep(3, 3 * beat, 108, 6).find((event) => event.voice === 'bass')!
    expect(offbeat.time - 3 * beat).toBeGreaterThan(0)
    expect(offbeat.time - 3 * beat).toBeLessThan(beat * 0.12)
    expect(score(6).every((event) => event.velocity > 0 && event.velocity <= 1 && event.duration > 0)).toBe(true)
  })

  it('leaves breathing bars and repeats the original sixteen-bar form', () => {
    expect(Array.from({ length: 16 }, (_, i) => arrangeStep(2 * 16 + i, 0, 108, 6)).flat().some((event) => event.voice === 'motif')).toBe(false)
    expect(arrangeStep(0, 0, 108, 6)).toEqual(arrangeStep(256, 0, 108, 6))
  })

  it('reproduces noise for repeatable exported evidence', () => {
    const first = seededNoise(FOCUS_SCORE.seed)
    const second = seededNoise(FOCUS_SCORE.seed)
    const samples = Array.from({ length: 1000 }, () => first())
    expect(samples).toEqual(Array.from({ length: 1000 }, () => second()))
    expect(samples.every((sample) => sample >= -1 && sample <= 1)).toBe(true)
  })
})

describe('Live music transitions', () => {
  it('adds requested layers at a bar boundary, without a riser or tempo jump', () => {
    vi.useFakeTimers()
    const clock = { currentTime: 0, state: 'running' }
    const sounds = { kick: vi.fn(), hat: vi.fn(), bass: vi.fn(), snare: vi.fn(), keys: vi.fn(), pad: vi.fn(), percussion: vi.fn(), riser: vi.fn() }
    const mix = { setMusicAudible: vi.fn() }
    const music = new MusicEngine(clock as unknown as BaseAudioContext, sounds as unknown as Synth, mix as unknown as Mixer)
    music.start()
    music.setProgress(19, 20)
    for (let tick = 1; tick < 76; tick++) { clock.currentTime = tick * 0.025; music.sequencer.tick() }
    expect(sounds.snare).not.toHaveBeenCalled()
    for (let tick = 76; tick < 116; tick++) { clock.currentTime = tick * 0.025; music.sequencer.tick() }
    expect(sounds.snare).toHaveBeenCalled()
    expect(sounds.riser).not.toHaveBeenCalled()
    expect(music.sequencer.bpm).toBe(108)
    music.stop()
    expect(mix.setMusicAudible).toHaveBeenLastCalledWith(false)
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('Downloadable WAV', () => {
  it('writes stereo PCM16 with correct lengths, clipping and channel interleaving', () => {
    const data = encodeWav({ numberOfChannels: 2, length: 3, sampleRate: 48000, getChannelData: (channel: number) => new Float32Array(channel === 0 ? [0, 1, -2] : [0.5, -0.5, 2]) })
    const view = new DataView(data)
    expect(new TextDecoder().decode(data.slice(0, 4))).toBe('RIFF')
    expect(view.getUint32(4, true)).toBe(data.byteLength - 8)
    expect(view.getUint16(22, true)).toBe(2)
    expect(view.getUint32(24, true)).toBe(48000)
    expect(view.getUint32(40, true)).toBe(12)
    expect([44, 46, 48, 50, 52, 54].map((offset) => view.getInt16(offset, true))).toEqual([0, 16384, 32767, -16384, -32768, 32767])
  })
})
