import { FOCUS_TRACK } from './tracks'
import type { MusicTrack } from './tracks'
import type { Synth } from './Synth'

export type MusicEvent = {
  voice: 'kick' | 'hat' | 'bass' | 'snare' | 'keys' | 'pad' | 'perc' | 'motif'
  time: number
  velocity: number
  duration: number
  notes: readonly number[]
  pan: number
  timbre: MusicTrack['timbre']
}

/** One score drives both live scheduling and OfflineAudioContext auditions. */
export function arrangeStep(step: number, time: number, bpm: number, stage: number, track: MusicTrack = FOCUS_TRACK): MusicEvent[] {
  const local = step % 16
  const bar = Math.floor(step / 16) % track.bars
  const chord = track.chords[bar % track.chords.length]
  const duration = 60 / bpm / 4
  const swung = time + (local % 2 ? duration * track.swing : 0)
  const events: MusicEvent[] = []
  const add = (voice: MusicEvent['voice'], at: number, velocity: number, length = 1, notes: readonly number[] = [], pan = 0) => {
    events.push({ voice, time: at, velocity, duration: duration * length, notes, pan, timbre: track.timbre })
  }
  if (track.kicks.includes(local) || (local === track.alternateKick && bar % 2 === 1)) add('kick', time, local === 6 ? 0.78 : 1)
  if (local % 2 === 0) add('hat', time, track.hatVelocities[local / 2], 1, [], -0.12)
  const bass = track.bassPattern.find((note) => note.step === local)
  if (bass) add('bass', swung, bass.velocity, bass.length, [chord.bass + bass.offset])
  // The opening already contains harmony; the fuller voicing arrives with stage 3.
  const keys = track.keys.find((note) => note.step === local)
  if (keys) add('keys', swung + 0.008, keys.velocity, keys.length, stage < 3 ? chord.notes.slice(1, 3) : chord.notes.slice(1), 0.12)
  if (stage >= 2 && track.snare.includes(local)) add('snare', time + 0.006, local === 4 ? 0.86 : 1)
  if (stage >= 3 && local === 0 && bar % 2 === 0) add('pad', time, 1, 28, chord.notes.slice(0, 4), -0.1)
  if (stage >= 4 && track.percussion.includes(local)) add('perc', swung, local === 7 ? 0.8 : 0.45, 1, [], 0.2)
  if (stage >= 5 && bar % 2 === 1 && track.answers.includes(local)) {
    const first = local === track.answers[0]
    add('keys', swung, 0.42, 1.8, [chord.notes[first ? 2 : 3]], first ? -0.2 : 0.2)
  }
  // Motif has complete breathing bars, rather than running throughout the loop.
  if (stage >= 6 && bar % 4 < 2 && local % 2 === 0) {
    const midi = track.leadPhrases[Math.floor(bar / 4)][local / 2]
    if (midi !== null) add('motif', time + 0.012, 0.65, 2.8, [midi], -0.1)
  }
  return events
}

export function playMusicEvents(synth: Synth, events: readonly MusicEvent[]) {
  for (const event of events) {
    const { time, velocity, duration, notes, pan, timbre } = event
    const playNote = timbre === 'mallet' ? synth.mallet.bind(synth) : synth.keys.bind(synth)
    switch (event.voice) {
      case 'kick': synth.kick(time, 0.62 * velocity); break
      case 'hat': synth.hat(time, false, velocity, pan); break
      case 'bass': synth.bass(time, notes[0], duration, velocity); break
      case 'snare': synth.snare(time, velocity); break
      case 'keys': notes.forEach((note, i) => playNote(time + i * 0.004, note, 0.09 * velocity / Math.sqrt(notes.length), duration, pan)); break
      case 'pad': synth.pad(time, notes, duration); break
      case 'perc': synth.percussion(time, velocity, pan); break
      case 'motif': playNote(time, notes[0], 0.085 * velocity, duration, pan); break
    }
  }
}
