import { useGameStore } from '../game/gameStore'
import { Icon } from './Icon'

export function BossHealthBar() {
  const hp = useGameStore((s) => s.bossHp)
  return <div className={`boss-health ${hp <= 20 ? 'health-low' : ''}`}>
    <div className="boss-health-label"><span className="boss-tag">BOSS</span><strong>泡泡博士</strong><span className="hp-value">{hp}<small> / 100</small></span></div>
    <div className="health-track" role="progressbar" aria-label="泡泡博士生命值" aria-valuenow={hp} aria-valuemin={0} aria-valuemax={100}>
      <div className="health-fill" style={{ transform: `scaleX(${hp / 100})` }} />
      <Icon name="bolt" size={15} />
    </div>
  </div>
}
