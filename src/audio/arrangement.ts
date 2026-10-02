import { BASS_PATTERN, CHORDS, FOCUS_SCORE, HAT_VELOCITIES, LEAD_PHRASES } from './score'
import type { Synth } from './Synth'

export type MusicEvent = {
  voice: 'kick' | 'hat' | 'bass' | 'snare' | 'keys' | 'pad' | 'perc' | 'motif'
  time: number
  velocity: number
  duration: number
  notes: readonly number[]
  pan: number
}

/** One score drives both live scheduling and OfflineAudioContext auditions. */
export function arrangeStep(step: number, time: number, bpm: number, stage: number): MusicEvent[] {
  const local = step % 16
  const bar = Math.floor(step / 16) % FOCUS_SCORE.bars
  const chord = CHORDS[bar % CHORDS.length]
  const duration = 60 / bpm / 4
  const swung = time + (local % 2 ? duration * FOCUS_SCORE.swing : 0)
  const events: MusicEvent[] = []
  const add = (voice: MusicEvent['voice'], at: number, velocity: number, length = 1, notes: readonly number[] = [], pan = 0) => {
    events.push({ voice, time: at, velocity, duration: duration * length, notes, pan })
  }
  if ([0, 6, 8].includes(local) || (local === 14 && bar % 2 === 1)) add('kick', time, local === 6 ? 0.78 : 1)
  if (local % 2 === 0) add('hat', time, HAT_VELOCITIES[local / 2], 1, [], -0.12)
  const bass = BASS_PATTERN.find((note) => note.step === local)
  if (bass) add('bass', swung, bass.velocity, bass.length, [chord.bass + bass.offset])
  // The opening already contains harmony; the fuller voicing arrives with stage 3.
  if (local === 0 || local === 10) add('keys', time + 0.008, local === 0 ? 0.8 : 0.52, local === 0 ? 5.5 : 3, stage < 3 ? chord.notes.slice(1, 3) : chord.notes.slice(1), 0.12)
  if (stage >= 2 && (local === 4 || local === 12)) add('snare', time + 0.006, local === 4 ? 0.86 : 1)
  if (stage >= 3 && local === 0 && bar % 2 === 0) add('pad', time, 1, 28, chord.notes.slice(0, 4), -0.1)
  if (stage >= 4 && [3, 7, 11, 15].includes(local)) add('perc', swung, local === 7 ? 0.8 : 0.45, 1, [], 0.2)
  if (stage >= 5 && bar % 2 === 1 && (local === 3 || local === 11)) add('keys', swung, 0.42, 1.8, [chord.notes[local === 3 ? 2 : 3]], local === 3 ? -0.2 : 0.2)
  // Motif has complete breathing bars, rather than running throughout the loop.
  if (stage >= 6 && bar % 4 < 2 && local % 2 === 0) {
    const midi = LEAD_PHRASES[Math.floor(bar / 4)][local / 2]
    if (midi !== null) add('motif', time + 0.012, 0.65, 2.8, [midi], -0.1)
  }
  return events
}

export function playMusicEvents(synth: Synth, events: readonly MusicEvent[]) {
  for (const event of events) {
    const { time, velocity, duration, notes, pan } = event
    switch (event.voice) {
      case 'kick': synth.kick(time, 0.62 * velocity); break
      case 'hat': synth.hat(time, false, velocity, pan); break
      case 'bass': synth.bass(time, notes[0], duration, velocity); break
      case 'snare': synth.snare(time, velocity); break
      case 'keys': notes.forEach((note, i) => synth.keys(time + i * 0.004, note, 0.09 * velocity / Math.sqrt(notes.length), duration, pan)); break
      case 'pad': synth.pad(time, notes, duration); break
      case 'perc': synth.percussion(time, velocity, pan); break
      case 'motif': synth.keys(time, notes[0], 0.085 * velocity, duration, pan); break
    }
  }
}
