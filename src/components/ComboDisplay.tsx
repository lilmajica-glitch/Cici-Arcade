import { useGameStore } from '../game/gameStore'
import { Icon } from './Icon'

export function ComboDisplay() {
  const combo = useGameStore((s) => s.combo)
  return <div key={combo} className={`combo-display ${combo >= 2 ? 'combo-active' : ''}`} aria-label={`连续答对 ${combo} 题`}>
    <Icon name="bolt" size={15} /><span>连击</span><strong>×{combo}</strong>
  </div>
}
