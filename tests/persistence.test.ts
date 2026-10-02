import { describe, expect, it } from 'vitest'
import { emptyStats, readStats, recordVictory, STATS_KEY, writeStats } from '../src/utils/persistence'
import { initialGameState } from '../src/game/GameEngine'

describe('three-field local statistics', () => {
  it('tolerates missing, blocked and corrupt storage', () => {
    expect(readStats(null)).toEqual(emptyStats())
    expect(readStats({ getItem: () => '{broken', setItem: () => {} })).toEqual(emptyStats())
    const blocked = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
    expect(readStats(blocked)).toEqual(emptyStats())
    expect(writeStats(emptyStats(), blocked)).toBe(false)
  })
  it('validates bounds and ignores unknown fields', () => {
    const storage = { getItem: () => JSON.stringify({ bestAccuracy: 999, bestCombo: -2, gamesPlayed: 'oops', name: 'ignored' }), setItem: () => {} }
    expect(readStats(storage)).toEqual({ bestAccuracy: 100, bestCombo: 0, gamesPlayed: 0 })
  })
  it('writes only the required fields and counts completed games', () => {
    let saved = ''
    const storage = { getItem: () => saved, setItem: (key: string, data: string) => { expect(key).toBe(STATS_KEY); saved = data } }
    const state = { ...initialGameState(), status: 'victory' as const, firstTryCount: 18, maxCombo: 9 }
    const stats = recordVictory(state, emptyStats())
    expect(stats).toEqual({ bestAccuracy: 90, bestCombo: 9, gamesPlayed: 1 })
    expect(writeStats(stats, storage)).toBe(true)
    expect(Object.keys(JSON.parse(saved))).toEqual(['bestAccuracy', 'bestCombo', 'gamesPlayed'])
    expect(readStats(storage)).toEqual(stats)
    expect(recordVictory(initialGameState(), stats)).toBe(stats)
  })
})
