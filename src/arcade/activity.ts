import type { GameId, GameSession } from './session'

export const ACTIVITY_KEY = 'ciciarcade:activity:v1'
export const ACTIVITY_EVENT = 'ciciarcade:activity-updated'
export type WeeklyGoal = 3 | 5 | 7
export type Activity = {
  checkIns: string[]
  weeklyGoal: WeeklyGoal
  gameRounds: Record<GameId, number>
  lastGame: GameId | null
  sessionIds: string[]
}
type ActivityStorage = Pick<Storage, 'getItem' | 'setItem'>

export function emptyActivity(): Activity {
  return { checkIns: [], weeklyGoal: 3, gameRounds: { math: 0, neon: 0 }, lastGame: null, sessionIds: [] }
}

export function dayKey(date = new Date()): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

function validDay(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  if (year < 2000 || year > 9999) return false
  const date = new Date(year, month - 1, day, 12)
  return dayKey(date) === value
}

export function shiftDay(key: string, amount: number): string {
  const [year, month, day] = key.split('-').map(Number)
  return dayKey(new Date(year, month - 1, day + amount, 12))
}

export function weekDays(date = new Date()): string[] {
  const offset = (date.getDay() + 6) % 7
  const monday = shiftDay(dayKey(date), -offset)
  return Array.from({ length: 7 }, (_, index) => shiftDay(monday, index))
}

export function currentStreak(checkIns: string[], today = dayKey()): number {
  const days = new Set(checkIns.filter((key) => validDay(key) && key <= today))
  let cursor = days.has(today) ? today : shiftDay(today, -1)
  let count = 0
  while (days.has(cursor)) {
    count += 1
    cursor = shiftDay(cursor, -1)
  }
  return count
}

export function addCheckIn(activity: Activity, today = dayKey()): Activity {
  if (!validDay(today) || activity.checkIns.includes(today)) return activity
  return { ...activity, checkIns: [...activity.checkIns, today].sort().slice(-366) }
}

export function addCompletedRound(activity: Activity, session: GameSession, today = dayKey()): Activity {
  if (session.answeredCount < 1 || activity.sessionIds.includes(session.sessionId)) return activity
  return {
    ...addCheckIn(activity, today),
    gameRounds: { ...activity.gameRounds, [session.gameId]: Math.min(1_000_000, activity.gameRounds[session.gameId] + 1) },
    lastGame: session.gameId,
    sessionIds: [...activity.sessionIds, session.sessionId].slice(-64),
  }
}

export function activityStorage(): ActivityStorage | null {
  try { return typeof window !== 'undefined' ? window.localStorage : null } catch { return null }
}

export function readActivity(storage: ActivityStorage | null = activityStorage()): Activity {
  try {
    const raw = storage?.getItem(ACTIVITY_KEY)
    if (!raw) return emptyActivity()
    const value = JSON.parse(raw) as Record<string, unknown> | null
    if (!value || typeof value !== 'object') return emptyActivity()
    const rounds = value.gameRounds && typeof value.gameRounds === 'object' ? value.gameRounds as Record<string, unknown> : {}
    const count = (input: unknown) => typeof input === 'number' && Number.isFinite(input) ? Math.min(1_000_000, Math.max(0, Math.floor(input))) : 0
    return {
      checkIns: Array.isArray(value.checkIns) ? [...new Set(value.checkIns.filter(validDay))].sort().slice(-366) : [],
      weeklyGoal: value.weeklyGoal === 5 || value.weeklyGoal === 7 ? value.weeklyGoal : 3,
      gameRounds: { math: count(rounds.math), neon: count(rounds.neon) },
      lastGame: value.lastGame === 'math' || value.lastGame === 'neon' ? value.lastGame : null,
      sessionIds: Array.isArray(value.sessionIds) ? [...new Set(value.sessionIds.filter((id): id is string => typeof id === 'string' && id.length > 0 && id.length <= 120))].slice(-64) : [],
    }
  } catch { return emptyActivity() }
}

export function writeActivity(activity: Activity, storage: ActivityStorage | null = activityStorage()): boolean {
  if (!storage) return false
  try {
    storage.setItem(ACTIVITY_KEY, JSON.stringify(activity))
    return true
  } catch { return false }
}

export function recordCompletedRound(session: GameSession): void {
  const current = readActivity()
  const next = addCompletedRound(current, session)
  if (next === current) return
  if (writeActivity(next)) window.dispatchEvent(new Event(ACTIVITY_EVENT))
}
