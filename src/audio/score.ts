/** Original four-bar toy-synth arrangement, composed specifically for Cici. */
export const CHORDS = [
  { bass: 36, notes: [60, 64, 67, 69] },
  { bass: 41, notes: [60, 65, 69, 74] },
  { bass: 45, notes: [57, 60, 64, 67] },
  { bass: 36, notes: [60, 64, 67, 74] },
] as const

export const LEAD_PHRASES = [
  [null, 76, 79, null, 74, 72, null, 76],
  [77, null, 76, 74, null, 72, 74, null],
  [76, 79, null, 81, 79, null, 76, 72],
  [74, null, 72, null, 76, 79, 72, null],
] as const
export const ARP_ORDER = [0, 2, 1, 3, 2, 0, 3, 1] as const
