import { useEffect } from 'react'
import type { RefObject } from 'react'
import { useGameStore } from '../game/gameStore'
import { usePreferences } from '../game/preferencesStore'
import { audioEngine } from '../audio/AudioEngine'

export function useMusicPulse(cabinet: RefObject<HTMLElement | null>) {
  const playing = useGameStore((s) => s.status === 'playing')
  const reduced = usePreferences((s) => s.reducedMotion)
  useEffect(() => {
    if (!playing || reduced || !cabinet.current) return
    const element = cabinet.current
    let frame = 0
    const update = () => {
      element.style.setProperty('--beat', audioEngine.pulse().toFixed(3))
      frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    return () => { cancelAnimationFrame(frame); element.style.removeProperty('--beat') }
  }, [cabinet, playing, reduced])
}
