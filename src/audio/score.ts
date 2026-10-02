/** Original instrumental groove. Tempo is a composition choice, not a cognitive claim. */
export const FOCUS_SCORE = {
  title: '向前一点',
  bpm: 108,
  swing: 0.08, // 54:46 subdivision; the quarter-note pulse stays straight.
  bars: 16,
  seed: 0xc1c12026,
} as const

export const CHORDS = [
  { bass: 36, notes: [55, 60, 64, 69, 74] }, // C6/9
  { bass: 36, notes: [55, 60, 64, 69, 74] },
  { bass: 45, notes: [55, 60, 64, 69, 72] }, // Am7
  { bass: 45, notes: [55, 60, 64, 69, 72] },
  { bass: 41, notes: [57, 60, 64, 67, 72] }, // Fmaj9
  { bass: 41, notes: [57, 60, 64, 67, 72] },
  { bass: 43, notes: [55, 60, 62, 67, 69] }, // G6sus4
  { bass: 36, notes: [55, 60, 64, 69, 74] },
] as const

export const HAT_VELOCITIES = [0.7, 0.42, 0.88, 0.48, 0.67, 0.38, 0.8, 0.46] as const
export const BASS_PATTERN = [
  { step: 0, offset: 0, length: 2.4, velocity: 1 },
  { step: 3, offset: 12, length: 0.9, velocity: 0.58 },
  { step: 6, offset: 0, length: 1.8, velocity: 0.85 },
  { step: 10, offset: 7, length: 1.3, velocity: 0.64 },
  { step: 14, offset: 12, length: 1.2, velocity: 0.72 },
] as const
// Pentatonic motif with space to think; no octave-up sparkle.
export const LEAD_PHRASES = [
  [null, null, 72, null, null, 69, null, null],
  [null, 67, null, null, null, null, 64, null],
  [null, null, 69, null, null, 67, null, null],
  [null, 64, null, null, null, null, 62, null],
] as const
