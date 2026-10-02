import { useRef } from 'react'
import { useGameStore } from '../game/gameStore'
import { Boss } from './Boss'
import { BossHealthBar } from './BossHealthBar'
import { QuestionMachine } from './QuestionMachine'
import { ComboDisplay } from './ComboDisplay'
import { NumberPad } from './NumberPad'
import { MenuScreen } from './MenuScreen'
import { VictoryScreen } from './VictoryScreen'
import { Icon } from './Icon'
import { MusicMeter } from './MusicMeter'
import { ParticleCanvas } from './ParticleCanvas'
import { useStageEffects } from '../hooks/useStageEffects'
import { useMusicPulse } from '../hooks/useMusicPulse'
import { musicProgression } from '../audio/progression'

function PlayFeedback() {
  const feedback = useGameStore((s) => s.feedback)
  const index = useGameStore((s) => s.questionIndex)
  const eventId = useGameStore((s) => s.eventId)
  const message = feedback === 'wrong' ? '再试一次，你可以的！' : feedback === 'correct' ? 'PERFECT! 答案命中！' : index === 19 ? '最后一击，加油！' : '点击数字，再按 ✓ 发射'
  return <div className="feedback-row"><span key={eventId} className={`feedback-message feedback-${feedback}`} role="status" aria-live="polite">{message}</span><ComboDisplay /></div>
}

function ProgressStrip() {
  const index = useGameStore((s) => s.questionIndex)
  const status = useGameStore((s) => s.status)
  return <div className="progress-strip">
    <div className="progress-dots" aria-hidden="true">{Array.from({ length: 20 }, (_, i) => <i key={i} className={`${i < index ? 'dot-done' : ''} ${i === index ? 'dot-current' : ''}`} />)}</div>
    <span>{status === 'victory' ? '完成' : '攻击'} <b>{String(index).padStart(2, '0')}</b><small> / 20</small></span>
  </div>
}

export function GameScreen() {
  const status = useGameStore((s) => s.status)
  const stageLevel = useGameStore((s) => musicProgression(s.questionIndex).stage)
  const phase = useGameStore((s) => s.phase)
  const stage = useRef<HTMLDivElement>(null)
  const cabinet = useRef<HTMLElement>(null)
  useStageEffects(stage)
  useMusicPulse(cabinet)
  return <section ref={cabinet} className={`game-cabinet status-${status}`} data-phase={phase} data-music-stage={stageLevel} aria-label="博士大作战游戏区域">
    <div className="cabinet-topline"><span><Icon name="flask" size={15} />超能力实验室</span><MusicMeter /></div>
    <div ref={stage} className="combat-stage"><BossHealthBar /><Boss /><QuestionMachine /></div>
    {status === 'playing' ? <div className="play-panel"><PlayFeedback /><NumberPad /><ProgressStrip /></div> : status === 'victory' ? <VictoryScreen /> : <MenuScreen />}
    <div className="cabinet-screw screw-left" aria-hidden="true" /><div className="cabinet-screw screw-right" aria-hidden="true" />
    <ParticleCanvas />
  </section>
}
