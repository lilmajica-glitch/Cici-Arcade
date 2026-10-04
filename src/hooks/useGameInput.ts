import { useEffect } from 'react'
import { gameController } from '../game/GameController'
import { gameStore } from '../game/gameStore'

export function useGameInput() {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || gameStore.getState().status !== 'playing') return
      if (event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return
      if (/^\d$/.test(event.key)) { event.preventDefault(); gameController.feed(event.key) }
      else if (event.key === 'Backspace') { event.preventDefault(); gameController.input('erase') }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])
}
