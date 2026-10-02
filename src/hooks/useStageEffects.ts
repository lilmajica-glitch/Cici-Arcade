import { useEffect } from 'react'
import type { RefObject } from 'react'
import { screenPunch, softShake } from '../animation/shake'
import { gameController } from '../game/GameController'
import { comboIntensity } from '../game/ComboSystem'
import { usePreferences } from '../game/preferencesStore'

export function useStageEffects(stage: RefObject<HTMLDivElement | null>) {
  const reduced = usePreferences((s) => s.reducedMotion)
  useEffect(() => {
    if (reduced) return
    let animation: Animation | null = null
    const unsubscribe = gameController.onFeedback((event) => {
      if (!stage.current) return
      animation?.cancel()
      if (event.type === 'correct') animation = screenPunch(stage.current, comboIntensity(event.combo))
      else if (event.type === 'wrong') {
        const card = stage.current.querySelector<HTMLElement>('.question-card')
        if (card) animation = softShake(card)
      }
    })
    return () => { animation?.cancel(); unsubscribe() }
  }, [stage, reduced])
}
