import { useEffect, useRef } from 'react'
import { ParticleSystem } from '../animation/particles'
import { gameController } from '../game/GameController'
import { usePreferences } from '../game/preferencesStore'

export function ParticleCanvas() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const reduced = usePreferences((s) => s.reducedMotion)
  useEffect(() => {
    if (reduced || !canvas.current) return
    const particles = new ParticleSystem(canvas.current)
    const unsubscribe = gameController.onFeedback((event) => {
      if (event.type !== 'wrong') particles.burst(event.combo, event.type === 'victory')
    })
    return () => { unsubscribe(); particles.dispose() }
  }, [reduced])
  return <canvas ref={canvas} className="particle-canvas" aria-hidden="true" />
}
