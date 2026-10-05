import { describe, expect, it } from 'vitest'
import { ACTIVITY_KEY, addCheckIn, addCompletedRound, currentStreak, dayKey, emptyActivity, readActivity, shiftDay, weekDays, writeActivity } from '../src/arcade/activity'
import type { GameSession } from '../src/arcade/session'

const session: GameSession = { sessionId: 'math-round-1', gameId: 'math', gameName: 'Cici 小博士', score: 100, accuracy: 100, wrongAnswers: [], durationSeconds: 50, answeredCount: 20 }

describe('arcade daily activity', () => {
  it('records a calendar day only once, even when checking in after a game', () => {
    const once = addCheckIn(emptyActivity(), '2026-10-04')
    expect(addCheckIn(once, '2026-10-04')).toBe(once)
    const played = addCompletedRound(once, session, '2026-10-04')
    expect(played.checkIns).toEqual(['2026-10-04'])
    expect(played.gameRounds.math).toBe(1)
  })
  it('deduplicates delivered game sessions and distinguishes the two games', () => {
    const first = addCompletedRound(emptyActivity(), session, '2026-10-04')
    expect(addCompletedRound(first, session, '2026-10-04')).toBe(first)
    const next = addCompletedRound(first, { ...session, sessionId: 'neon-1', gameId: 'neon' }, '2026-10-05')
    expect(next.gameRounds).toEqual({ math: 1, neon: 1 })
    expect(next.lastGame).toBe('neon')
    expect(next.checkIns).toEqual(['2026-10-04', '2026-10-05'])
  })
  it('does not count a round with no answers as learning activity', () => {
    const activity = emptyActivity()
    expect(addCompletedRound(activity, { ...session, answeredCount: 0 }, '2026-10-04')).toBe(activity)
  })
  it('maintains yesterday’s streak until today is over and resets after a missed day', () => {
    const days = ['2026-10-01', '2026-10-02', '2026-10-03']
    expect(currentStreak(days, '2026-10-04')).toBe(3)
    expect(currentStreak(days, '2026-10-05')).toBe(0)
    expect(currentStreak([...days, '2026-10-04'], '2026-10-04')).toBe(4)
    expect(currentStreak(['2026-10-05'], '2026-10-04')).toBe(0)
  })
  it('uses local calendar dates and crosses months, years and daylight-saving boundaries', () => {
    expect(dayKey(new Date(2026, 9, 4, 23, 59))).toBe('2026-10-04')
    expect(shiftDay('2026-01-01', -1)).toBe('2025-12-31')
    expect(shiftDay('2024-02-28', 1)).toBe('2024-02-29')
    expect(shiftDay('2026-03-08', 1)).toBe('2026-03-09')
  })
  it('builds a Monday-to-Sunday week including the current Sunday', () => {
    expect(weekDays(new Date(2026, 9, 4, 12))).toEqual(['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'])
  })
  it('tolerates corrupt, missing and blocked browser storage', () => {
    expect(readActivity(null)).toEqual(emptyActivity())
    expect(readActivity({ getItem: () => '{invalid', setItem: () => {} })).toEqual(emptyActivity())
    const blocked = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
    expect(readActivity(blocked)).toEqual(emptyActivity())
    expect(writeActivity(emptyActivity(), blocked)).toBe(false)
    expect(writeActivity(emptyActivity(), null)).toBe(false)
  })
  it('validates saved dates, counts and goals instead of trusting stored JSON', () => {
    const storage = { getItem: () => JSON.stringify({ checkIns: ['2026-02-31', 'bad', '2026-10-04', '2026-10-04'], gameRounds: { math: -1, neon: 3.9 }, weeklyGoal: 100, lastGame: 'unknown' }), setItem: () => {} }
    expect(readActivity(storage)).toEqual({ ...emptyActivity(), checkIns: ['2026-10-04'], gameRounds: { math: 0, neon: 3 } })
  })
  it('persists the goal and daily history under the arcade-specific key', () => {
    let raw = ''
    const storage = { getItem: () => raw, setItem: (key: string, value: string) => { expect(key).toBe(ACTIVITY_KEY); raw = value } }
    const activity = { ...addCheckIn(emptyActivity(), '2026-10-04'), weeklyGoal: 5 as const }
    expect(writeActivity(activity, storage)).toBe(true)
    expect(readActivity(storage)).toEqual(activity)
  })
})
