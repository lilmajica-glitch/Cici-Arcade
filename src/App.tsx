import { useEffect } from 'react'
import { gameController } from './game/GameController'
import { preferencesStore, usePreferences } from './game/preferencesStore'
import { useGameInput } from './hooks/useGameInput'
import { useAudioLifecycle } from './hooks/useAudioLifecycle'
import { GameScreen } from './components/GameScreen'
import { Icon } from './components/Icon'
import './styles/tokens.css'
import './styles/game.css'
import './styles/scene.css'
import './styles/motion.css'
import './styles/responsive.css'

export default function App() {
  const muted = usePreferences((s) => s.muted)
  const reduced = usePreferences((s) => s.reducedMotion)
  const unavailable = usePreferences((s) => s.audioStatus === 'unavailable')
  const audioStatus = usePreferences((s) => s.audioStatus)
  useGameInput()
  useAudioLifecycle()
  useEffect(() => () => gameController.dispose(), [])
  return <div className={`app-shell ${reduced ? 'reduced-motion' : 'motion-enabled'}`} data-audio-state={audioStatus}>
    <header className="site-header">
      <div className="wordmark" aria-label="Cici 小博士"><span className="wordmark-icon"><Icon name="flask" size={26} /></span><span className="wordmark-name">cici</span><span className="wordmark-chinese">小博士</span></div>
      <div className="header-actions">
        <button className="preference-button" type="button" aria-label={muted ? '开启声音' : '静音'} aria-pressed={muted} title={muted ? '开启声音' : '静音'} onClick={() => preferencesStore.setState({ muted: !muted })}><Icon name={muted ? 'mute' : 'sound'} size={18} /><span>{muted ? '声音已关' : '声音开启'}</span></button>
        <button className="preference-button" type="button" aria-label="减少动态效果" aria-pressed={reduced} title="减少动态效果" onClick={() => preferencesStore.setState({ reducedMotion: !reduced })}><Icon name="motion" size={18} /><span>减少动态</span></button>
      </div>
    </header>
    <main className="page-main">
      <aside className="desktop-note note-left" aria-hidden="true"><span>THE LITTLE GENIUS LAB</span><strong>一题，一击。</strong><p>数字会唱歌，<br />答案有超能力。</p></aside>
      <GameScreen />
      <aside className="desktop-note note-right" aria-hidden="true"><div className="note-mark"><Icon name="note" /></div><span>PLAY YOUR ANSWER</span><p>跟着自己的节奏，<br />慢慢想，大胆试。</p></aside>
      {unavailable ? <p className="audio-notice" role="status">声音暂时未能启动，仍然可以继续玩。</p> : null}
    </main>
    <footer className="site-footer">为每一个小小的灵光一闪<span>✦</span> CICI 小博士</footer>
  </div>
}
