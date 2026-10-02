import { useEffect, useRef } from 'react'
import { gameController } from '../game/GameController'
import { gameStore } from '../game/gameStore'
import { readStats } from '../utils/persistence'
import { Icon } from './Icon'

export function MenuScreen() {
  const start = useRef<HTMLButtonElement>(null)
  const stats = readStats()
  useEffect(() => { if (gameStore.getState().sessionId > 0) start.current?.focus({ preventScroll: true }) }, [])
  return <div className="menu-panel">
    <span className="section-kicker">小小脑袋，大大能量</span>
    <h1>博士大作战<span aria-hidden="true">！</span></h1>
    <p>弹奏数字，发射答案。<br />用 20 个答案，打败泡泡博士！</p>
    <button ref={start} type="button" className="start-button" onClick={() => gameController.start()}><Icon name="bolt" size={23} /><span>开始游戏</span><i><Icon name="arrow" size={22} /></i></button>
    <div className="play-recipe"><span><i className="mini-key">7</i>输入答案</span><b aria-hidden="true">→</b><span><Icon name="check" size={18} />按 ✓ 发射</span></div>
    <div className="menu-fineprint">20 以内加减法 <span>·</span> 不计时 <span>·</span> 答错再试</div>
    {stats.gamesPlayed > 0 ? <div className="personal-best">你的最佳连击 ×{stats.bestCombo} <span>·</span> 已完成 {stats.gamesPlayed} 局</div> : null}
  </div>
}
