import { useGameStore } from '../game/gameStore'
import { musicProgression } from '../audio/progression'
import { Icon } from './Icon'

export function MusicMeter() {
  const stage = useGameStore((s) => musicProgression(s.questionIndex).stage)
  const status = useGameStore((s) => s.status)
  return <span className="music-meter" data-stage={stage} aria-label={status === 'menu' ? '音乐准备就绪' : `音乐能量第 ${stage} 阶段`}>
    <Icon name="note" size={13} /><span>{status === 'menu' ? '节奏准备就绪' : status === 'victory' ? '超能力满格' : '节奏在长大'}</span>
    <i aria-hidden="true">{Array.from({ length: 6 }, (_, n) => <b key={n} className={n < stage && status !== 'menu' ? 'layer-on' : ''} />)}</i>
  </span>
}
