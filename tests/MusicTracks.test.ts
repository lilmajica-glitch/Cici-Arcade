import { afterEach, describe, expect, it, vi } from 'vitest'
import { arrangeStep } from '../src/audio/arrangement'
import { MusicEngine } from '../src/audio/MusicEngine'
import { previewTiming } from '../src/audio/preview'
import { CLOUD_TRACK, FOCUS_TRACK, MUSIC_TRACKS, ORBIT_TRACK, pickMusicTrack } from '../src/audio/tracks'
import { musicProgression } from '../src/audio/progression'
import type { Mixer } from '../src/audio/Mixer'
import type { Synth } from '../src/audio/Synth'

afterEach(() => vi.useRealTimers())

describe('Three original game tracks', () => {
  it('draws each track from an equal third of the random interval, including its edges', () => {
    expect([0, 1 / 3 - 0.000001, 1 / 3, 2 / 3 - 0.000001, 2 / 3, 0.999999, 1].map((value) => pickMusicTrack(() => value).id))
      .toEqual(['focus', 'focus', 'orbit', 'orbit', 'cloud', 'cloud', 'cloud'])
    const random = vi.fn(() => 0.5)
    expect(pickMusicTrack(random)).toBe(ORBIT_TRACK)
    expect(random).toHaveBeenCalledOnce()
    for (const value of [-1, NaN, Infinity]) expect(pickMusicTrack(() => value)).toBe(FOCUS_TRACK)
  })

  it('gives the new songs different drum, bass, harmony, melody and timbre identities', () => {
    expect(new Set(MUSIC_TRACKS.map((track) => JSON.stringify(track.kicks))).size).toBe(3)
    expect(new Set(MUSIC_TRACKS.map((track) => JSON.stringify(track.bassPattern))).size).toBe(3)
    expect(new Set(MUSIC_TRACKS.map((track) => JSON.stringify(track.chords))).size).toBe(3)
    expect(new Set(MUSIC_TRACKS.map((track) => JSON.stringify(track.leadPhrases))).size).toBe(3)
    expect(CLOUD_TRACK.timbre).toBe('mallet')
  })

  for (const track of MUSIC_TRACKS) {
    it(`${track.title}: loops a sparse melody in the digit pads' pentatonic scale, with breathing bars`, () => {
      const full = Array.from({ length: track.bars * 16 }, (_, step) => arrangeStep(step, 0, track.bpm, 6, track)).flat()
      const opening = Array.from({ length: 16 }, (_, step) => arrangeStep(step, 0, track.bpm, 1, track)).flat()
      for (const voice of ['kick', 'bass', 'hat', 'keys']) expect(opening.some((event) => event.voice === voice)).toBe(true)
      expect(opening.some((event) => event.voice === 'motif')).toBe(false)
      const melody = full.filter((event) => event.voice === 'motif')
      expect(melody.length).toBeGreaterThan(0)
      expect(melody.length).toBeLessThanOrEqual(24)
      expect(melody.every((event) => event.notes.every((note) => note >= 60 && note <= 72 && [0, 2, 4, 7, 9].includes(note % 12)))).toBe(true)
      for (let bar = 0; bar < 16; bar++) {
        if (bar % 4 >= 2) expect(Array.from({ length: 16 }, (_, step) => arrangeStep(bar * 16 + step, 0, track.bpm, 6, track)).flat().some((event) => event.voice === 'motif')).toBe(false)
      }
      for (let step = 0; step < 256; step++) expect(arrangeStep(step, 0, track.bpm, 6, track)).toEqual(arrangeStep(step + 256, 0, track.bpm, 6, track))
      expect(full.every((event) => event.velocity > 0 && event.velocity <= 1 && event.duration > 0 && Number.isFinite(event.time))).toBe(true)
    })

    it(`${track.title}: starts at its own tempo and retains the same song and layers after background resume`, () => {
      vi.useFakeTimers()
      const clock = { currentTime: 0, state: 'running' }
      const sounds = { kick: vi.fn(), hat: vi.fn(), bass: vi.fn(), snare: vi.fn(), keys: vi.fn(), mallet: vi.fn(), pad: vi.fn(), percussion: vi.fn(), stopMusic: vi.fn() }
      const mix = { setMusicAudible: vi.fn() }
      const music = new MusicEngine(clock as unknown as BaseAudioContext, sounds as unknown as Synth, mix as unknown as Mixer)
      music.start(true, track)
      expect(music.sequencer.bpm).toBe(track.bpm)
      music.setProgress(19, 20)
      for (let tick = 1; tick < 121; tick++) { clock.currentTime = tick * 0.025; music.sequencer.tick() }
      expect(music.sequencer.bpm).toBe(track.bpm)
      expect(sounds.snare).toHaveBeenCalled()
      const voice = track.timbre === 'mallet' ? sounds.mallet : sounds.keys
      expect(voice).toHaveBeenCalled()
      music.stop()
      expect(sounds.stopMusic).toHaveBeenLastCalledWith(clock.currentTime + 0.055)
      voice.mockClear(); sounds.snare.mockClear()
      music.start(false)
      for (let tick = 1; tick <= 100; tick++) { clock.currentTime += 0.025; music.sequencer.tick() }
      expect(music.sequencer.bpm).toBe(track.bpm)
      expect(voice).toHaveBeenCalled()
      expect(sounds.snare).toHaveBeenCalled()
      expect(sounds.stopMusic).toHaveBeenCalledTimes(2)
      music.stop()
      expect(vi.getTimerCount()).toBe(0)
    })

    it(`${track.title}: preview timing includes all six complete sections at the song's tempo`, () => {
      const timing = previewTiming(track)
      expect(timing.sectionSeconds).toBeCloseTo(16 * 60 / track.bpm)
      expect(timing.seconds).toBeGreaterThan(0.06 + timing.sectionSeconds * 6)
      expect(timing.seconds - timing.sectionSeconds * 6).toBeLessThan(2)
      for (let question = 0; question < 20; question++) expect(musicProgression(question, 20, track).bpm).toBe(track.bpm)
    })
  }
})
