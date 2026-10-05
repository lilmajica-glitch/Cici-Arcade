import { useCallback, useEffect, useRef, useState } from 'react'
import { ACTIVITY_EVENT, ACTIVITY_KEY, addCheckIn, readActivity, writeActivity } from './activity'
import type { Activity, WeeklyGoal } from './activity'

export function useActivity() {
  const [activity, setActivity] = useState(readActivity)
  const [saved, setSaved] = useState(true)
  const latest = useRef(activity)

  useEffect(() => {
    const refresh = () => {
      const next = readActivity()
      latest.current = next
      setActivity(next)
    }
    const receive = (event: StorageEvent) => {
      if (event.key === ACTIVITY_KEY || event.key === null) refresh()
    }
    window.addEventListener(ACTIVITY_EVENT, refresh)
    window.addEventListener('storage', receive)
    return () => {
      window.removeEventListener(ACTIVITY_EVENT, refresh)
      window.removeEventListener('storage', receive)
    }
  }, [])

  const commit = useCallback((next: Activity) => {
    latest.current = next
    const persisted = writeActivity(next)
    setActivity(next)
    setSaved(persisted)
    if (persisted) window.dispatchEvent(new Event(ACTIVITY_EVENT))
  }, [])

  const checkIn = useCallback(() => {
    const next = addCheckIn(latest.current)
    if (next !== latest.current) commit(next)
  }, [commit])

  const changeGoal = useCallback((goal: WeeklyGoal) => {
    commit({ ...latest.current, weeklyGoal: goal })
  }, [commit])

  return { activity, saved, checkIn, changeGoal }
}
