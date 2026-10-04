import { FOCUS_TRACK } from './tracks'
import type { MusicTrack } from './tracks'

export type MusicLayer = 'kick' | 'hat' | 'bass' | 'snare' | 'chord' | 'pad' | 'perc' | 'arp' | 'lead'
const layers: readonly (readonly MusicLayer[])[] = [
  ['kick', 'hat', 'bass', 'chord'],
  ['kick', 'hat', 'bass', 'chord', 'snare'],
  ['kick', 'hat', 'bass', 'chord', 'snare', 'pad'],
  ['kick', 'hat', 'bass', 'chord', 'snare', 'pad', 'perc'],
  ['kick', 'hat', 'bass', 'chord', 'snare', 'pad', 'perc', 'arp'],
  ['kick', 'hat', 'bass', 'chord', 'snare', 'pad', 'perc', 'arp', 'lead'],
]
const labels = ['找到节奏', '步伐轻快', '和声铺开', '律动加深', '旋律点亮', '从容收尾']

export function musicProgression(index: number, total = 20, track: MusicTrack = FOCUS_TRACK) {
  const progress = Number.isFinite(index) && Number.isFinite(total) && total > 0 ? Math.max(0, Math.min(1, index / total)) : 0
  const stage = progress >= 0.85 ? 6 : progress >= 0.75 ? 5 : progress >= 0.6 ? 4 : progress >= 0.4 ? 3 : progress >= 0.2 ? 2 : 1
  return { progress, stage, bpm: track.bpm, layers: layers[stage - 1], label: labels[stage - 1], finalQuestion: index === total - 1 }
}
