import type { GameState } from '../game/GameEngine'
import { accuracyForGame } from '../game/GameEngine'

export type GameStats = { bestAccuracy: number; bestCombo: number; gamesPlayed: number }
export type StatsStorage = Pick<Storage, 'getItem' | 'setItem'>
export const STATS_KEY = 'cici-doctor:stats:v1'
export const emptyStats = (): GameStats => ({ bestAccuracy: 0, bestCombo: 0, gamesPlayed: 0 })

function storageBackend(): StatsStorage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage } catch { return null }
}

const safeNumber = (value: unknown, max: number) => typeof value === 'number' && Number.isFinite(value)
  ? Math.min(max, Math.max(0, Math.floor(value))) : 0

export function readStats(storage: StatsStorage | null = storageBackend()): GameStats {
  try {
    const raw: unknown = JSON.parse(storage?.getItem(STATS_KEY) ?? 'null')
    if (!raw || typeof raw !== 'object') return emptyStats()
    const data = raw as Partial<GameStats>
    return {
      bestAccuracy: safeNumber(data.bestAccuracy, 100),
      bestCombo: safeNumber(data.bestCombo, 20),
      gamesPlayed: safeNumber(data.gamesPlayed, Number.MAX_SAFE_INTEGER),
    }
  } catch { return emptyStats() }
}

export function recordVictory(state: GameState, stats: GameStats): GameStats {
  if (state.status !== 'victory') return stats
  return {
    bestAccuracy: Math.max(stats.bestAccuracy, accuracyForGame(state)),
    bestCombo: Math.max(stats.bestCombo, state.maxCombo),
    gamesPlayed: Math.min(Number.MAX_SAFE_INTEGER, stats.gamesPlayed + 1),
  }
}

export function writeStats(stats: GameStats, storage: StatsStorage | null = storageBackend()): boolean {
  if (!storage) return false
  try { storage.setItem(STATS_KEY, JSON.stringify(stats)); return true } catch { return false }
}
