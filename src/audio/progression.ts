export type MusicLayer = 'kick' | 'hat' | 'bass' | 'snare' | 'chord' | 'arp' | 'lead'
const layers: readonly (readonly MusicLayer[])[] = [
  ['kick'], ['kick', 'hat'], ['kick', 'hat', 'bass'],
  ['kick', 'hat', 'bass', 'snare', 'chord'],
  ['kick', 'hat', 'bass', 'snare', 'chord', 'arp'],
  ['kick', 'hat', 'bass', 'snare', 'chord', 'arp', 'lead'],
]
const labels = ['机器启动', '节奏亮起来', '能量增加', '火力全开', '超能力爆发', '最后冲刺']

export function musicProgression(index: number, total = 20) {
  const progress = Math.max(0, Math.min(1, index / total))
  const stage = progress >= 0.85 ? 6 : progress >= 0.75 ? 5 : progress >= 0.6 ? 4 : progress >= 0.4 ? 3 : progress >= 0.2 ? 2 : 1
  return { progress, stage, bpm: 112 + progress * 16, layers: layers[stage - 1], label: labels[stage - 1], finalQuestion: index === total - 1 }
}
