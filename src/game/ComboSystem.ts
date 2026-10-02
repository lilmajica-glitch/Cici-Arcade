export function nextCombo(combo: number, maxCombo: number) {
  const next = combo + 1
  return { combo: next, maxCombo: Math.max(next, maxCombo) }
}

export const resetCombo = () => 0

/** Bounded expression intensity; never used by question or HP logic. */
export const comboIntensity = (combo: number) => Math.min(1, 0.35 + combo * 0.065)
