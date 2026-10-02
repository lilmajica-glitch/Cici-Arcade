import { useEffect, useRef } from 'react'
import { useGameStore } from '../game/gameStore'
import { gameController } from '../game/GameController'
import { accuracyForGame } from '../game/GameEngine'
import { Icon } from './Icon'

export function VictoryScreen() {
  const accuracy = useGameStore(accuracyForGame)
  const maxCombo = useGameStore((s) => s.maxCombo)
  const replay = useRef<HTMLButtonElement>(null)
  useEffect(() => { replay.current?.focus({ preventScroll: true }) }, [])
  return <div className="victory-panel">
    <span className="section-kicker"><Icon name="star" size={15} /> VICTORY <Icon name="star" size={15} /></span>
    <h1>你就是小博士！</h1>
    <p role="status">20 道题，20 次漂亮的攻击。</p>
    <div className="victory-stats"><div><span>一次答对</span><strong>{accuracy}<small>%</small></strong></div><div><span>最佳连击</span><strong><small>×</small>{maxCombo}</strong></div></div>
    <button ref={replay} type="button" className="start-button" onClick={() => gameController.start()}><Icon name="bolt" size={22} /><span>再玩一次</span><i><Icon name="arrow" size={22} /></i></button>
    <button type="button" className="back-button" onClick={() => gameController.menu()}>回到开始</button>
  </div>
}
