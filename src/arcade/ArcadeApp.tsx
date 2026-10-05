import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowsOut } from '@phosphor-icons/react'
import { games } from './games'
import type { ArcadeGame } from './games'
import { RoundReport } from './RoundReport'
import { isGameSession, isLearningReport } from './session'
import type { AiSummary, GameSession } from './session'
import { recordCompletedRound } from './activity'
import { GameCards } from './GameCards'
import { HomePage } from './HomePage'
import { MotionLink } from './MotionLink'
import { SiteHeader, SiteFooter } from './SiteChrome'

function GamePage({ game }: { game: ArcadeGame }) {
  const frameContainer = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const request = useRef<AbortController | null>(null)
  const lastRound = useRef('')
  const [session, setSession] = useState<GameSession | null>(null)
  const [report, setReport] = useState<AiSummary | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [fullscreenError, setFullscreenError] = useState('')

  const summarize = useCallback(async (round: GameSession) => {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setBusy(true); setError(''); setReport(null)
    try {
      const response = await fetch('/api/ai/summary', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(round), signal: controller.signal,
      })
      const data = await response.json() as AiSummary & { error?: string }
      if (!response.ok) throw new Error(data.error || '学习总结暂时不可用，请再试一次。')
      if (!isLearningReport(data) || !['local', 'openai'].includes(data.source)) throw new Error('学习总结不完整，请再试一次。')
      if (!controller.signal.aborted) setReport(data)
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '连接失败，请再试一次。')
    } finally { if (!controller.signal.aborted) setBusy(false) }
  }, [])

  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return
      if (event.data?.type === 'ciciarcade:start' && event.data.gameId === game.id) {
        request.current?.abort()
        lastRound.current = ''
        setSession(null); setReport(null); setBusy(false); setError('')
      }
      if (event.data?.type === 'ciciarcade:end' && isGameSession(event.data.session)) {
        const round = event.data.session
        if (round.gameId !== game.id || round.sessionId === lastRound.current) return
        lastRound.current = round.sessionId
        recordCompletedRound(round)
        setSession(round)
        void summarize(round)
      }
    }
    window.addEventListener('message', receive)
    return () => { window.removeEventListener('message', receive); request.current?.abort() }
  }, [game.id, summarize])

  async function fullscreen() {
    try {
      await frameContainer.current?.requestFullscreen()
      setFullscreenError('')
    } catch {
      setFullscreenError('当前浏览器无法进入全屏，可以继续在这里玩。')
    }
  }

  return <main id="main" className={`arcade-main play-page play-page-${game.id}`}>
    <div className="play-toolbar">
      <a className="back-link" href="/games"><ArrowLeft size={18} />游戏大厅</a>
      <h1>{game.name}<span>{game.subtitle}</span></h1>
      {document.fullscreenEnabled && <button className="fullscreen-button" type="button" onClick={() => void fullscreen()}><ArrowsOut size={18} /><span>全屏游戏</span></button>}
    </div>
    <div className="game-frame-container" ref={frameContainer}>
      {!loaded && <div className="game-loading" role="status">正在加载 {game.name}…</div>}
      <iframe ref={frame} className="game-frame" src={game.source} title={`${game.name}游戏`} allow="autoplay; fullscreen" allowFullScreen inert={Boolean(session)} aria-hidden={session ? true : undefined} onLoad={() => setLoaded(true)} />
      {session && <RoundReport key={session.sessionId} session={session} report={report} busy={busy} error={error}
        onRetry={() => void summarize(session)}
        onReplay={() => frame.current?.contentWindow?.postMessage({ type: 'ciciarcade:replay', gameId: game.id }, window.location.origin)} />}
    </div>
    <p className="game-controls">{game.controls}</p>
    {fullscreenError && <p role="status" className="fullscreen-error">{fullscreenError}</p>}
  </main>
}

export default function ArcadeApp() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  const game = games.find((entry) => entry.path === path)
  const home = path === '/'
  const lobby = path === '/games'

  useEffect(() => {
    document.title = game ? `${game.name} · CiciArcade` : lobby ? '游戏大厅 · CiciArcade' : home ? 'CiciArcade · 把练习玩成冒险' : '页面未找到 · CiciArcade'
  }, [game, home, lobby])

  return <div className={'arcade-app' + (game ? ' arcade-app-play' : home ? ' arcade-app-home' : ' arcade-app-lobby')}>
    <a className="skip-link" href="#main">跳到主要内容</a>
    <SiteHeader home={home} playing={Boolean(game)} />
    {game ? <GamePage game={game} /> : home ? <HomePage /> : lobby ? <main id="main" className="lobby-page page-width">
      <section className="lobby-heading"><p>保持好奇，马上开玩。</p><h1>选一个世界，<br /><span>开始今天的冒险。</span></h1><p>去实验室挑战口算，或在霓虹城市里闯过单词关。</p></section>
      <GameCards />
      <div className="lobby-checkin-link"><span>每次出发，都算进步。</span><MotionLink href="/#daily-checkin" variant="quiet">看看我的学习足迹</MotionLink></div>
    </main> : <main id="main" className="page-width missing-page"><h1>这个关卡还没开放。</h1><p>回到游戏大厅，选择一个游戏继续冒险。</p><MotionLink href="/games">返回游戏大厅</MotionLink></main>}
    {!game && <SiteFooter />}
  </div>
}
