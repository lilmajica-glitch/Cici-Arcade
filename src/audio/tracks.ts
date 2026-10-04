import { BASS_PATTERN, CHORDS, FOCUS_SCORE, HAT_VELOCITIES, LEAD_PHRASES } from './score'

type RhythmNote = { readonly step: number; readonly velocity: number; readonly length: number }
export type MusicTrack = {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly cover: readonly [string, string]
  readonly bpm: number
  readonly swing: number
  readonly bars: number
  readonly chords: readonly { readonly bass: number; readonly notes: readonly number[] }[]
  readonly hatVelocities: readonly number[]
  readonly bassPattern: readonly (RhythmNote & { readonly offset: number })[]
  readonly kicks: readonly number[]
  readonly alternateKick: number | null
  readonly keys: readonly RhythmNote[]
  readonly snare: readonly number[]
  readonly percussion: readonly number[]
  readonly answers: readonly number[]
  readonly leadPhrases: readonly (readonly (number | null)[])[]
  readonly timbre: 'keys' | 'mallet'
}

export const FOCUS_TRACK = {
  ...FOCUS_SCORE, id: 'focus',
  description: '有律动，也留一点空白。鼓点、贝斯和电钢琴，陪你慢慢想。',
  cover: ['ONE STEP', 'AT A TIME.'],
  chords: CHORDS, hatVelocities: HAT_VELOCITIES, bassPattern: BASS_PATTERN,
  kicks: [0, 6, 8], alternateKick: 14,
  keys: [{ step: 0, velocity: 0.8, length: 5.5 }, { step: 10, velocity: 0.52, length: 3 }],
  snare: [4, 12], percussion: [3, 7, 11, 15], answers: [3, 11],
  leadPhrases: LEAD_PHRASES, timbre: 'keys',
} as const satisfies MusicTrack

// Straight four-on-the-floor pulse, offbeat harmony and call/response melody.
// The tempo is a composition choice, not a claim of improved cognition.
export const ORBIT_TRACK = {
  id: 'orbit', title: '星轨弹跳',
  description: '稳稳的舞曲鼓点，接住轻快的电钢琴短句。像沿着星轨，一步一步跳过去。',
  cover: ['ORBIT', 'HOP.'],
  bpm: 112, swing: 0, bars: 16,
  chords: [CHORDS[0], CHORDS[0], CHORDS[4], CHORDS[4], CHORDS[2], CHORDS[2], CHORDS[6], CHORDS[7]],
  hatVelocities: [0.48, 0.76, 0.42, 0.72, 0.5, 0.8, 0.44, 0.68],
  bassPattern: [
    { step: 0, offset: 0, length: 2.6, velocity: 0.9 },
    { step: 6, offset: 12, length: 1.3, velocity: 0.62 },
    { step: 8, offset: 0, length: 2.6, velocity: 0.86 },
    { step: 14, offset: 7, length: 1.3, velocity: 0.6 },
  ],
  kicks: [0, 4, 8, 12], alternateKick: null,
  keys: [{ step: 2, velocity: 0.7, length: 3 }, { step: 10, velocity: 0.6, length: 3 }],
  snare: [4, 12], percussion: [3, 11], answers: [6, 14],
  leadPhrases: [
    [72, null, 69, null, null, 67, null, null],
    [69, null, 67, null, null, 64, null, null],
    [64, null, 67, null, null, 69, null, null],
    [67, null, 62, null, null, 60, null, null],
  ], timbre: 'keys',
} as const satisfies MusicTrack

// Softer two-beat groove, wooden mallets and syncopated bass. All tracks share
// C-family harmony with the digit pads, so input remains part of the music.
export const CLOUD_TRACK = {
  id: 'cloud', title: '云朵接力',
  description: '柔和的木质敲击音，搭着轻摇摆的贝斯。乐句轮流接棒，留出慢慢想的空白。',
  cover: ['CLOUD', 'RELAY.'],
  bpm: 100, swing: 0.12, bars: 16,
  chords: [CHORDS[0], CHORDS[2], CHORDS[4], CHORDS[7], CHORDS[2], CHORDS[4], CHORDS[6], CHORDS[7]],
  hatVelocities: [0.6, 0.32, 0.7, 0.38, 0.58, 0.3, 0.72, 0.36],
  bassPattern: [
    { step: 0, offset: 0, length: 3.2, velocity: 0.94 },
    { step: 5, offset: 7, length: 1.5, velocity: 0.55 },
    { step: 8, offset: 12, length: 2.5, velocity: 0.7 },
    { step: 13, offset: 0, length: 1.7, velocity: 0.68 },
  ],
  kicks: [0, 8], alternateKick: 11,
  keys: [{ step: 0, velocity: 0.85, length: 4.5 }, { step: 7, velocity: 0.6, length: 3 }],
  snare: [4, 12], percussion: [3, 9, 15], answers: [5, 13],
  leadPhrases: [
    [null, 64, null, 67, null, null, 69, null],
    [null, 69, null, 64, null, null, 62, null],
    [null, 67, null, 69, null, null, 72, null],
    [null, 64, null, 62, null, null, 60, null],
  ], timbre: 'mallet',
} as const satisfies MusicTrack

export const MUSIC_TRACKS: readonly MusicTrack[] = [FOCUS_TRACK, ORBIT_TRACK, CLOUD_TRACK]

/** Equal-probability draw once per game; consecutive repeats are allowed. */
export function pickMusicTrack(random: () => number = Math.random): MusicTrack {
  const value = random()
  const unit = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0
  return MUSIC_TRACKS[Math.min(MUSIC_TRACKS.length - 1, Math.floor(unit * MUSIC_TRACKS.length))]
}
